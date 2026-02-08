import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { OutputBackend } from "../backends/types.js";
import { createFeederForTarget } from "../feeders/registry.js";
import { resolveSource } from "../sources/resolver.js";
import type { Config } from "../config.js";
import type { JellyfinClient } from "../jellyfin/client.js";

const PlaySchema = z
  .object({
    source: z.enum(["local", "url", "jellyfin"]),
    path: z.string().optional(),
    url: z.string().optional(),
    jellyfinUrl: z.string().optional(),
  })
  .refine((d) => d.source !== "local" || d.path, {
    message: "path is required when source is local",
  })
  .refine((d) => d.source !== "url" || (d.url && d.url.startsWith("http")), {
    message: "url is required when source is url",
  })
  .refine((d) => d.source !== "jellyfin" || (d.jellyfinUrl && d.jellyfinUrl.startsWith("http")), {
    message: "jellyfinUrl is required when source is jellyfin",
  });

export function createRoutes(
  config: Config,
  backend: OutputBackend,
  jellyfin: JellyfinClient
) {
  const router = Router();
  let feeder: ReturnType<typeof createFeederForTarget> | null = null;

  const getFeeder = () => feeder;

  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      outputMode: config.OUTPUT_MODE,
      platform: config.PLATFORM,
    });
  });

  router.get("/status", (_req: Request, res: Response) => {
    const f = feeder;
    res.json({
      state: f?.getState() ?? "stopped",
      outputMode: config.OUTPUT_MODE,
    });
  });

  router.post("/play", async (req: Request, res: Response) => {
    try {
      const parsed = PlaySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const jellyfinResolve = jellyfin.isConfigured()
        ? (url: string) => jellyfin.resolveToStreamUrl(url)
        : undefined;

      const playableUrl = await resolveSource(
        parsed.data,
        config,
        jellyfinResolve
      );

      await backend.prepare();
      await backend.startStream();

      const target = backend.getTarget();
      const f = createFeederForTarget(target);
      feeder = f;

      await f.feed(playableUrl, target);

      res.json({ status: "playing", source: playableUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  router.post("/stop", async (_req: Request, res: Response) => {
    try {
      const f = getFeeder();
      if (f) await f.stop();
      await backend.stopStream();
      feeder = null;
      res.json({ status: "stopped" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  router.post("/pause", async (_req: Request, res: Response) => {
    try {
      const f = getFeeder();
      if (!f) {
        res.status(400).json({ error: "Nothing is playing" });
        return;
      }
      await f.pause();
      res.json({ status: "paused" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  router.post("/resume", async (_req: Request, res: Response) => {
    try {
      const f = getFeeder();
      if (!f) {
        res.status(400).json({ error: "Nothing is playing" });
        return;
      }
      await f.resume();
      res.json({ status: "playing" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  return router;
}
