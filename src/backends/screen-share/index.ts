import type { OutputBackend, Target } from "../types.js";
import type { Config } from "../../config.js";
import { DiscordController } from "./discord-controller.js";

/**
 * ScreenShareBackend - shares virtual display (Xvfb) to Discord.
 * MPV plays video on the display; Discord shares it via screen share.
 */
export class ScreenShareBackend implements OutputBackend {
  readonly name = "screen_share";
  private controller: DiscordController | null = null;
  private _prepared = false;
  private _streaming = false;

  constructor(private readonly config: Config) {}

  async prepare(): Promise<void> {
    if (this._prepared) return;

    if (!this.controller) {
      this.controller = new DiscordController(
        this.config,
        this.config.DISCORD_PROFILE_PATH
      );
      await this.controller.init();
    } else {
      // Controller may be on login page from getLoginQR; navigate to channel
      await this.controller.navigateToChannel();
    }
    await this.controller.joinVoiceChannel();
    this._prepared = true;
  }

  /**
   * Open Discord login page and return QR code screenshot. Scan with Discord
   * mobile app to log in. Browser stays open; session is saved to profile.
   * Only available for screen_share backend.
   */
  async getLoginQR(): Promise<Buffer> {
    if (!this.controller) {
      this.controller = new DiscordController(
        this.config,
        this.config.DISCORD_PROFILE_PATH
      );
    }
    return this.controller.initForLoginAndGetQR();
  }

  getTarget(): Target {
    const display = process.env.DISPLAY ?? ":99";
    return { type: "display", display };
  }

  async startStream(): Promise<void> {
    if (!this.controller) await this.prepare();
    if (!this.controller) throw new Error("Failed to prepare Discord");

    if (!this._streaming) {
      await this.controller!.startScreenShare();
      this._streaming = true;
    }
  }

  async stopStream(): Promise<void> {
    if (this.controller && this._streaming) {
      await this.controller.stopScreenShare();
      this._streaming = false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.controller) {
      await this.controller.shutdown();
      this.controller = null;
    }
    this._prepared = false;
    this._streaming = false;
  }
}
