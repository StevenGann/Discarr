/**
 * Jellyfin API client. Resolves web UI URLs to direct stream URLs for playback.
 * Requires JELLYFIN_SERVER_URL and JELLYFIN_API_KEY. JELLYFIN_USER_ID used for playback context.
 */
import axios, { type AxiosInstance } from "axios";
import type { Config } from "../config.js";

export class JellyfinClient {
  private client: AxiosInstance | null = null;

  constructor(private readonly config: Config) {
    const url = config.JELLYFIN_SERVER_URL;
    const apiKey = config.JELLYFIN_API_KEY;
    if (url && apiKey) {
      this.client = axios.create({
        baseURL: url.replace(/\/$/, ""),
        headers: {
          "X-Emby-Token": apiKey,
          "Content-Type": "application/json",
        },
      });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Extract item ID from Jellyfin web URL.
   * e.g. https://jellyfin.example.com/web/index.html#!/itemdetails.html?id=abc123
   */
  parseItemIdFromUrl(jellyfinUrl: string): string | null {
    try {
      const url = new URL(jellyfinUrl);
      const fromSearch = url.searchParams.get("id");
      if (fromSearch) return fromSearch;
      const hash = url.hash;
      const hashMatch = hash?.match(/[?&]id=([^&]+)/);
      return hashMatch ? hashMatch[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Resolve Jellyfin item URL to direct stream URL for playback.
   */
  async resolveToStreamUrl(jellyfinUrl: string): Promise<string> {
    if (!this.client) {
      throw new Error("Jellyfin not configured. Set JELLYFIN_SERVER_URL and JELLYFIN_API_KEY.");
    }

    const itemId = this.parseItemIdFromUrl(jellyfinUrl);
    if (!itemId) {
      throw new Error(`Could not parse item ID from URL: ${jellyfinUrl}`);
    }

    const baseUrl = this.client.defaults.baseURL!;
    const apiKey = this.config.JELLYFIN_API_KEY!;

    // Jellyfin stream endpoint - supports direct play for most formats
    return `${baseUrl}/Videos/${itemId}/stream?api_key=${apiKey}`;
  }
}
