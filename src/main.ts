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
import { seedDatabase } from "./utils/seed-data.ts";
import { getAllEvents } from "./utils/db-operations.ts";

// Validate environment variables
validateEnv();

// Initialize database on startup
initializeDatabase();
runMigrations();

// Seed database with sample data if empty
const existingEvents = getAllEvents();
if (existingEvents.length === 0) {
  seedDatabase();
}

await start(manifest, config);
