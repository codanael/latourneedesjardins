import { DB } from "sqlite";

let db: DB | null = null;

export function getDatabase(): DB {
  if (!db) {
    db = new DB(Deno.env.get("DATABASE_URL"));
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
