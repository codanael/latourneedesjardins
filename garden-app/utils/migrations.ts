import { getDatabase } from "./database.ts";

export interface Migration {
  version: number;
  description: string;
  up: (db: ReturnType<typeof getDatabase>) => void;
  down: (db: ReturnType<typeof getDatabase>) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: "Initial schema",
    up: (db) => {
      // Create migrations table
      db.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          description TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    },
    down: (db) => {
      db.query(`DROP TABLE IF EXISTS migrations`);
    },
  },
];

export function getCurrentVersion(): number {
  const db = getDatabase();

  // Ensure migrations table exists
  db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const result = db.query(`
    SELECT MAX(version) as version FROM migrations
  `);

  return (result[0] as unknown[])?.[0] as number ?? 0;
}

export function runMigrations() {
  const db = getDatabase();
  const currentVersion = getCurrentVersion();

  console.log(`Current database version: ${currentVersion}`);

  const pendingMigrations = migrations.filter((m) =>
    m.version > currentVersion
  );

  if (pendingMigrations.length === 0) {
    console.log("No migrations to run");
    return;
  }

  console.log(`Running ${pendingMigrations.length} migrations...`);

  for (const migration of pendingMigrations) {
    console.log(
      `Running migration ${migration.version}: ${migration.description}`,
    );

    try {
      migration.up(db);

      // Record migration as executed
      db.query(
        `
        INSERT OR REPLACE INTO migrations (version, description) 
        VALUES (?, ?)
      `,
        [migration.version, migration.description],
      );

      console.log(`Migration ${migration.version} completed successfully`);
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  console.log("All migrations completed successfully");
}

export function rollbackMigration(targetVersion: number) {
  const db = getDatabase();
  const currentVersion = getCurrentVersion();

  if (targetVersion >= currentVersion) {
    console.log("No rollback needed");
    return;
  }

  const migrationsToRollback = migrations
    .filter((m) => m.version > targetVersion && m.version <= currentVersion)
    .sort((a, b) => b.version - a.version);

  console.log(`Rolling back ${migrationsToRollback.length} migrations...`);

  for (const migration of migrationsToRollback) {
    console.log(
      `Rolling back migration ${migration.version}: ${migration.description}`,
    );

    try {
      migration.down(db);

      // Remove migration record
      db.query(
        `
        DELETE FROM migrations WHERE version = ?
      `,
        [migration.version],
      );

      console.log(`Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      console.error(
        `Rollback of migration ${migration.version} failed:`,
        error,
      );
      throw error;
    }
  }

  console.log("Rollback completed successfully");
}
