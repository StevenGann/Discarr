import { Builder, By, until, type WebDriver } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import path from "node:path";
import type { Config } from "../../config.js";

/**
 * DiscordController - automates Discord web client via Selenium + Firefox.
 * Handles: navigate to server, join voice channel, start/stop screen share.
 *
 * Note: Discord's DOM structure can change with updates. If automation breaks,
 * inspect the web client and update selectors below (data-list-item-id,
 * aria-label, class names). Test with a persistent profile to avoid login loops.
 */
export class DiscordController {
  private driver: WebDriver | null = null;

  constructor(
    private readonly config: Config,
    private readonly profilePath: string
  ) {}

  async init(): Promise<void> {
    const options = new firefox.Options();

    // Use persistent profile so login survives restarts
    options.setProfile(path.resolve(this.profilePath));

    // Required for WebRTC/screen share in headless
    options.setPreference("media.navigator.permission.disabled", true);
    options.setPreference("media.navigator.streams.fake", false);
    options.setPreference("dom.webdriver.enabled", false);

    this.driver = await new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(options)
      .build();

    const serverId = this.config.DISCORD_SERVER_ID;
    const voiceChannelId = this.config.DISCORD_VOICE_CHANNEL_ID;

    if (!serverId || !voiceChannelId) {
      throw new Error(
        "DISCORD_SERVER_ID and DISCORD_VOICE_CHANNEL_ID must be set for screen share"
      );
    }

    await this.driver.get(
      `https://discord.com/channels/${serverId}/${voiceChannelId}`
    );

    // Wait for Discord to load
    await this.driver.wait(
      until.elementLocated(By.css("[data-list-item-id]")),
      30000
    );
  }

  async joinVoiceChannel(): Promise<void> {
    if (!this.driver) throw new Error("Discord controller not initialized");

    // Discord channel list items use data-list-item-id="channels___<channelId>"
    const voiceChannelSelector = `a[data-list-item-id="channels___${this.config.DISCORD_VOICE_CHANNEL_ID}"]`;
    const channel = await this.driver.wait(
      until.elementLocated(By.css(voiceChannelSelector)),
      10000
    );
    await channel.click();

    // Wait for connection
    await this.driver.sleep(2000);
  }

  async startScreenShare(): Promise<void> {
    if (!this.driver) throw new Error("Discord controller not initialized");

    // Click "Screen Share" or "Share Your Screen" in the voice panel
    // Discord's UI: look for screen share button in the bottom panel
    const screenShareSelector =
      'button[aria-label="Share Your Screen"], button[aria-label="Screen Share"], [class*="shareScreen"]';
    const screenShareBtn = await this.driver.wait(
      until.elementLocated(By.css(screenShareSelector)),
      10000
    );
    await screenShareBtn.click();

    // Modal may appear to select screen/window
    await this.driver.sleep(1500);
    const sourceSelector =
      '[class*="sourceRow"], [class*="sourceRow"], button[class*="source"]';
    try {
      const sources = await this.driver.findElements(By.css(sourceSelector));
      if (sources.length > 0) {
        await sources[0].click();
      }
    } catch {
      // Some setups auto-select; continue
    }

    await this.driver.sleep(1000);
  }

  async stopScreenShare(): Promise<void> {
    if (!this.driver) throw new Error("Discord controller not initialized");

    const stopSelector =
      'button[aria-label="Stop Sharing"], button[aria-label="Stop Screen Share"], [class*="stopShare"]';
    try {
      const stopBtn = await this.driver.findElement(By.css(stopSelector));
      await stopBtn.click();
    } catch {
      // May already be stopped
    }
  }

  async leaveVoiceChannel(): Promise<void> {
    if (!this.driver) return;
    await this.stopScreenShare();
    // Click disconnect
    try {
      const disconnectSelector =
        'button[aria-label="Disconnect"], [class*="disconnect"]';
      const btn = await this.driver.findElement(By.css(disconnectSelector));
      await btn.click();
    } catch {
      // Ignore
    }
  }

  async shutdown(): Promise<void> {
    if (this.driver) {
      await this.leaveVoiceChannel();
      await this.driver.quit();
      this.driver = null;
    }
  }
}
