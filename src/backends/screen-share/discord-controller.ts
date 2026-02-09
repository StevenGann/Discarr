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
  /** True if driver was created headless (for login QR only); cannot be used for screen share */
  private _headlessOnly = false;

  constructor(
    private readonly config: Config,
    private readonly profilePath: string
  ) {}

  /** Build browser for main flow (needs real display for screen share). */
  private async buildDriver(): Promise<WebDriver> {
    const options = new firefox.Options();

    options.setProfile(path.resolve(this.profilePath));
    options.setPreference("media.navigator.permission.disabled", true);
    options.setPreference("media.navigator.streams.fake", false);
    options.setPreference("dom.webdriver.enabled", false);

    return new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(options)
      .build();
  }

  /** Build headless browser for login QR (no display needed). */
  private async buildDriverHeadless(): Promise<WebDriver> {
    const options = new firefox.Options();

    options.setProfile(path.resolve(this.profilePath));
    options.setPreference("dom.webdriver.enabled", false);
    options.addArguments("--headless");

    return new Builder()
      .forBrowser("firefox")
      .setFirefoxOptions(options)
      .build();
  }

  async init(): Promise<void> {
    this.driver = await this.buildDriver();

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

  /**
   * Open Discord login page and return screenshot of QR code for scanning.
   * Uses headless Firefox (no display required). Browser stays open; scan with
   * Discord mobile app to complete login. Session is saved to profile.
   */
  async initForLoginAndGetQR(): Promise<Buffer> {
    if (!this.driver) {
      this.driver = await this.buildDriverHeadless();
      this._headlessOnly = true;
    }

    await this.driver.get("https://discord.com/login");
    await this.driver.sleep(2000);

    // Click "Log in with QR Code" if it's a link/button (shows QR view)
    try {
      const qrLink = await this.driver.findElement(
        By.xpath("//*[contains(text(), 'Log in with QR Code')]")
      );
      await qrLink.click();
      await this.driver.sleep(2000);
    } catch {
      // QR may already be visible; continue
    }

    // Screenshot the page; QR code is visible on the login view
    const screenshotBase64 = await this.driver.takeScreenshot();
    return Buffer.from(screenshotBase64, "base64");
  }

  /** Navigate to the configured voice channel. Use after login when controller was on login page. */
  async navigateToChannel(): Promise<void> {
    if (!this.driver) throw new Error("Discord controller not initialized");

    const serverId = this.config.DISCORD_SERVER_ID;
    const voiceChannelId = this.config.DISCORD_VOICE_CHANNEL_ID;
    if (!serverId || !voiceChannelId) {
      throw new Error("DISCORD_SERVER_ID and DISCORD_VOICE_CHANNEL_ID must be set");
    }

    await this.driver.get(
      `https://discord.com/channels/${serverId}/${voiceChannelId}`
    );
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

  isHeadlessOnly(): boolean {
    return this._headlessOnly;
  }

  async shutdown(): Promise<void> {
    if (this.driver) {
      await this.leaveVoiceChannel();
      await this.driver.quit();
      this.driver = null;
    }
  }
}
