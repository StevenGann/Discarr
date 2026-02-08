/**
 * Configuration loading and validation.
 * Reads from process.env and optional .env file. Validates with Zod.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const OutputMode = z.enum(["screen_share", "virtual_webcam", "hardware_capture"]);
const Platform = z.enum(["linux", "windows"]);

const ConfigSchema = z.object({
  OUTPUT_MODE: OutputMode.default("screen_share"),
  PLATFORM: Platform.default("linux"),
  PORT: z.coerce.number().default(3000),
  DISCORD_SERVER_ID: z.string().optional(),
  DISCORD_VOICE_CHANNEL_ID: z.string().optional(),
  DISCORD_PROFILE_PATH: z.string().default("./discord-profile"),
  JELLYFIN_SERVER_URL: z
    .string()
    .optional()
    .transform((v) => (v === "" || !v ? undefined : v)),
  JELLYFIN_API_KEY: z.string().optional(),
  JELLYFIN_USER_ID: z.string().optional(),
  VIDEOS_PATH: z.string().default("/videos"),
});

export type OutputModeType = z.infer<typeof OutputMode>;
export type PlatformType = z.infer<typeof Platform>;

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
        }
      }
    }
  } catch {
    // .env optional
  }
  return { ...process.env, ...env } as Record<string, string>;
}

/** Load and validate config from env. Throws on validation failure. */
export function loadConfig() {
  const raw = loadEnv();
  const parsed = ConfigSchema.safeParse({
    OUTPUT_MODE: raw.OUTPUT_MODE,
    PLATFORM: raw.PLATFORM,
    PORT: raw.PORT,
    DISCORD_SERVER_ID: raw.DISCORD_SERVER_ID,
    DISCORD_VOICE_CHANNEL_ID: raw.DISCORD_VOICE_CHANNEL_ID,
    DISCORD_PROFILE_PATH: raw.DISCORD_PROFILE_PATH,
    JELLYFIN_SERVER_URL: raw.JELLYFIN_SERVER_URL,
    JELLYFIN_API_KEY: raw.JELLYFIN_API_KEY,
    JELLYFIN_USER_ID: raw.JELLYFIN_USER_ID,
    VIDEOS_PATH: raw.VIDEOS_PATH,
  });

  if (!parsed.success) {
    throw new Error(`Invalid config: ${parsed.error.message}`);
  }

  return parsed.data;
}

export type Config = z.infer<typeof ConfigSchema>;
