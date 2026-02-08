import type { VideoFeeder } from "./types.js";
import type { Target } from "../backends/types.js";
import { MPVDisplayFeeder } from "./mpv-display.js";

/**
 * Selects a VideoFeeder that supports the given target.
 */
export function createFeederForTarget(target: Target): VideoFeeder {
  const feeders: VideoFeeder[] = [new MPVDisplayFeeder()];

  const feeder = feeders.find((f) => f.supportsTarget(target));
  if (!feeder) {
    throw new Error(`No feeder supports target type: ${target.type}`);
  }
  return feeder;
}
