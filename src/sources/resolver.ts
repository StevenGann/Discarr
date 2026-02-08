import path from "node:path";
import type { Config } from "../config.js";

/**
 * Resolves a play request to a playable path or URL.
 * Handles: local path, absolute path, HTTP URL, Jellyfin URL.
 */
export async function resolveSource(
  input: { source: "local" | "url" | "jellyfin"; path?: string; url?: string; jellyfinUrl?: string },
  config: Config,
  jellyfinResolve?: (url: string) => Promise<string>
): Promise<string> {
  if (input.source === "url" && input.url) {
    return input.url;
  }

  if (input.source === "local" && input.path) {
    const base = config.VIDEOS_PATH;
    const resolved = path.isAbsolute(input.path)
      ? input.path
      : path.join(base, input.path);
    return resolved;
  }

  if (input.source === "jellyfin" && input.jellyfinUrl) {
    if (!jellyfinResolve) {
      throw new Error("Jellyfin integration not configured");
    }
    return jellyfinResolve(input.jellyfinUrl);
  }

  throw new Error("Invalid source: provide path, url, or jellyfinUrl depending on source type");
}
