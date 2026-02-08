/**
 * Discarr entry point.
 * Loads config, creates output backend and Jellyfin client, mounts REST API, handles shutdown.
 */
import express from "express";
import cors from "cors";
import { loadConfig } from "./config.js";
import { createBackend } from "./backends/registry.js";
import { createRoutes } from "./api/routes.js";
import { JellyfinClient } from "./jellyfin/client.js";

async function main() {
  const config = loadConfig();
  const backend = createBackend(config);
  const jellyfin = new JellyfinClient(config);

  const app = express();
  app.use(cors());
  app.use(express.json());

  const routes = createRoutes(config, backend, jellyfin);
  app.use("/", routes);

  const server = app.listen(config.PORT, () => {
    console.log(`Discarr API listening on port ${config.PORT}`);
    console.log(`Output mode: ${config.OUTPUT_MODE}`);
  });

  const shutdown = async () => {
    console.log("Shutting down...");
    server.close();
    await backend.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
