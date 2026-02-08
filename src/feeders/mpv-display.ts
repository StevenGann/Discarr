import { spawn, type ChildProcess } from "node:child_process";
import type { Target } from "../backends/types.js";
import type { VideoFeeder, PlaybackState } from "./types.js";

/**
 * MPVDisplayFeeder - plays video with MPV on a virtual display.
 * Used by ScreenShareBackend.
 */
export class MPVDisplayFeeder implements VideoFeeder {
  private process: ChildProcess | null = null;
  private _state: PlaybackState = "stopped";

  supportsTarget(target: Target): boolean {
    return target.type === "display";
  }

  async feed(source: string, target: Target): Promise<void> {
    if (target.type !== "display") {
      throw new Error(`MPVDisplayFeeder only supports display target`);
    }

    await this.stop();

    const display = target.display;
    const env = { ...process.env, DISPLAY: display };

    this.process = spawn("mpv", [
      "--no-osc",                    // No on-screen controller
      "--no-input-default-bindings", // Disable keyboard shortcuts
      "--fs",                        // Fullscreen on the virtual display
      "--no-audio-display",          // Don't show audio viz overlay
      source,
    ], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    this._state = "playing";

    this.process.on("exit", (code) => {
      this.process = null;
      this._state = "stopped";
    });

    this.process.stderr?.on("data", () => {
      // MPV logs to stderr; can be useful for debugging
    });
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill("SIGTERM");
      this.process = null;
      this._state = "stopped";
    }
  }

  async pause(): Promise<void> {
    if (this.process && this._state === "playing") {
      this.process.kill("SIGSTOP");
      this._state = "paused";
    }
  }

  async resume(): Promise<void> {
    if (this.process && this._state === "paused") {
      this.process.kill("SIGCONT");
      this._state = "playing";
    }
  }

  getState(): PlaybackState {
    return this._state;
  }
}
