import type { OutputBackend, Target } from "../types.js";
import type { Config } from "../../config.js";

/**
 * HardwareCaptureBackend - uses real capture device (/dev/videoX).
 * Same "camera" abstraction as virtual webcam; Discord selects the device.
 *
 * Future implementation: pass capture device into container, optional
 * FFmpeg passthrough for format conversion.
 */
export class HardwareCaptureBackend implements OutputBackend {
  readonly name = "hardware_capture";

  constructor(private readonly _config: Config) {}

  async prepare(): Promise<void> {
    throw new Error(
      "Hardware capture backend is not yet implemented. Use OUTPUT_MODE=screen_share for now."
    );
  }

  getTarget(): Target {
    throw new Error("Hardware capture backend is not yet implemented.");
  }

  async startStream(): Promise<void> {
    throw new Error("Hardware capture backend is not yet implemented.");
  }

  async stopStream(): Promise<void> {
    throw new Error("Hardware capture backend is not yet implemented.");
  }

  async shutdown(): Promise<void> {
    // no-op
  }
}
