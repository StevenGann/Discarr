/**
 * Target describes what the VideoFeeder should deliver video to.
 * Each output backend returns a target that matches its needs.
 */
export type Target =
  | { type: "display"; display: string }
  | { type: "v4l2"; device: string; audioDevice?: string }
  | { type: "hardware"; device: string };

/**
 * OutputBackend interface - how Discord receives the video stream.
 * Implementations: ScreenShare, VirtualWebcam, HardwareCapture
 */
export interface OutputBackend {
  readonly name: string;

  /** Ensure Discord session is ready (browser, join channel) */
  prepare(): Promise<void>;

  /** What the VideoFeeder should feed video to */
  getTarget(): Target;

  /** Begin sharing/camera in Discord */
  startStream(): Promise<void>;

  /** End sharing/camera */
  stopStream(): Promise<void>;

  /** Cleanup resources */
  shutdown(): Promise<void>;
}
