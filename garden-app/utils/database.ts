import { DB } from "sqlite";

let db: DB | null = null;

export function getDatabase(): DB {
  if (!db) {
    db = new DB("./database.sqlite");
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}