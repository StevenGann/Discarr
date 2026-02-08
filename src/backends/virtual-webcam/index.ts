import type { OutputBackend, Target } from "../types.js";
import type { Config } from "../../config.js";

/**
 * VirtualWebcamBackend - feeds video to v4l2loopback device.
 * Discord uses the virtual camera as video source.
 *
 * Future implementation: requires host to load v4l2loopback + snd-aloop,
 * pass /dev/video* into container.
 */
export class VirtualWebcamBackend implements OutputBackend {
  readonly name = "virtual_webcam";

  constructor(private readonly _config: Config) {}

  async prepare(): Promise<void> {
    throw new Error(
      "Virtual webcam backend is not yet implemented. Use OUTPUT_MODE=screen_share for now."
    );
  }

  getTarget(): Target {
    throw new Error("Virtual webcam backend is not yet implemented.");
  }

  async startStream(): Promise<void> {
    throw new Error("Virtual webcam backend is not yet implemented.");
  }

  async stopStream(): Promise<void> {
    throw new Error("Virtual webcam backend is not yet implemented.");
  }

  async shutdown(): Promise<void> {
    // no-op
  }
}
