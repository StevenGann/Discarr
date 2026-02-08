import type { Target } from "../backends/types.js";

export type PlaybackState = "stopped" | "playing" | "paused";

/**
 * VideoFeeder interface - delivers video to the active output backend's target.
 * Implementations: MPVDisplayFeeder (for display), FFmpegV4L2Feeder (for v4l2)
 */
export interface VideoFeeder {
  /** Feed video from source (path or URL) to the given target */
  feed(source: string, target: Target): Promise<void>;

  /** Stop current playback */
  stop(): Promise<void>;

  /** Pause or resume */
  pause(): Promise<void>;
  resume(): Promise<void>;

  /** Current playback state */
  getState(): PlaybackState;

  /** Whether this feeder supports the given target type */
  supportsTarget(target: Target): boolean;
}
