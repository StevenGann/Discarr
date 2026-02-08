/**
 * Backend factory. Creates the appropriate OutputBackend based on OUTPUT_MODE config.
 */
import type { OutputBackend } from "./types.js";
import type { Config, OutputModeType } from "../config.js";
import { ScreenShareBackend } from "./screen-share/index.js";
import { VirtualWebcamBackend } from "./virtual-webcam/index.js";
import { HardwareCaptureBackend } from "./hardware-capture/index.js";

export function createBackend(config: Config): OutputBackend {
  const mode: OutputModeType = config.OUTPUT_MODE;

  switch (mode) {
    case "screen_share":
      return new ScreenShareBackend(config);
    case "virtual_webcam":
      return new VirtualWebcamBackend(config);
    case "hardware_capture":
      return new HardwareCaptureBackend(config);
    default:
      throw new Error(`Unknown output mode: ${mode}`);
  }
}
