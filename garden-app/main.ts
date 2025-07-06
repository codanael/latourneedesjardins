/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import { initializeDatabase } from "./utils/schema.ts";
import { runMigrations } from "./utils/migrations.ts";
import { validateEnv } from "./utils/env.ts";

// Validate environment variables
validateEnv();

// Initialize database on startup
initializeDatabase();
runMigrations();

await start(manifest, config);
