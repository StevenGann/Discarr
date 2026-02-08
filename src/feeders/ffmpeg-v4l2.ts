import type { Target } from "../backends/types.js";
import type { VideoFeeder, PlaybackState } from "./types.js";

/**
 * FFmpegV4L2Feeder - pipes video to v4l2loopback device.
 * Used by VirtualWebcamBackend.
 *
 * Future implementation: spawn ffmpeg to decode source and write to
 * /dev/video0 (and audio to snd-aloop).
 */
export class FFmpegV4L2Feeder implements VideoFeeder {
  supportsTarget(target: Target): boolean {
    return target.type === "v4l2";
  }

  async feed(_source: string, _target: Target): Promise<void> {
    throw new Error("FFmpegV4L2Feeder is not yet implemented.");
  }

  async stop(): Promise<void> {
    // no-op
  }

  async pause(): Promise<void> {
    throw new Error("FFmpegV4L2Feeder is not yet implemented.");
  }

  async resume(): Promise<void> {
    throw new Error("FFmpegV4L2Feeder is not yet implemented.");
  }

  getState(): PlaybackState {
    return "stopped";
  }
}
