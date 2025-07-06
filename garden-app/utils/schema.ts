import { getDatabase } from "./database.ts";

export function initializeDatabase() {
  const db = getDatabase();

  // Users table
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Events table
  db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      host_id INTEGER NOT NULL,
      theme TEXT,
      max_attendees INTEGER,
      weather_location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES users (id)
    )
  `);

  // RSVPs table
  db.query(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      response TEXT NOT NULL CHECK (response IN ('yes', 'no', 'maybe')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(event_id, user_id)
    )
  `);

  // Potluck items table
  db.query(`
    CREATE TABLE IF NOT EXISTS potluck_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better query performance
  db.query(`CREATE INDEX IF NOT EXISTS idx_events_date ON events (date)`);
  db.query(`CREATE INDEX IF NOT EXISTS idx_events_host ON events (host_id)`);
  db.query(`CREATE INDEX IF NOT EXISTS idx_rsvps_event ON rsvps (event_id)`);
  db.query(`CREATE INDEX IF NOT EXISTS idx_rsvps_user ON rsvps (user_id)`);
  db.query(
    `CREATE INDEX IF NOT EXISTS idx_potluck_event ON potluck_items (event_id)`,
  );

  console.log("Database schema initialized successfully");
}
