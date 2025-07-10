import { getDatabase } from "./database.ts";
import { initializeSessionsTable } from "./session.ts";

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
      special_instructions TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES users (id)
    )
  `);

  // Add special_instructions column if it doesn't exist (for existing databases)
  try {
    db.query(`ALTER TABLE events ADD COLUMN special_instructions TEXT`);
  } catch {
    // Column already exists, ignore the error
  }

  // Add latitude/longitude columns if they don't exist (for existing databases)
  try {
    db.query(`ALTER TABLE events ADD COLUMN latitude REAL`);
  } catch {
    // Column already exists, ignore the error
  }

  try {
    db.query(`ALTER TABLE events ADD COLUMN longitude REAL`);
  } catch {
    // Column already exists, ignore the error
  }

  // Add host_status column to users table if it doesn't exist
  try {
    db.query(`ALTER TABLE users ADD COLUMN host_status TEXT DEFAULT 'pending'`);
  } catch {
    // Column already exists, ignore the error
  }

  // Add admin_notes column to users table if it doesn't exist
  try {
    db.query(`ALTER TABLE users ADD COLUMN admin_notes TEXT`);
  } catch {
    // Column already exists, ignore the error
  }

  // Add confirmed_at column to users table if it doesn't exist
  try {
    db.query(`ALTER TABLE users ADD COLUMN confirmed_at DATETIME`);
  } catch {
    // Column already exists, ignore the error
  }

  // Add role column to users table if it doesn't exist
  try {
    db.query(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
  } catch {
    // Column already exists, ignore the error
  }

  // Add plus_one column to rsvps table if it doesn't exist
  try {
    db.query(`ALTER TABLE rsvps ADD COLUMN plus_one BOOLEAN DEFAULT FALSE`);
  } catch {
    // Column already exists, ignore the error
  }

  // Convert existing 'maybe' responses to 'no' as part of migration
  try {
    db.query(`UPDATE rsvps SET response = 'no' WHERE response = 'maybe'`);
  } catch {
    // Migration already done or table doesn't exist yet
  }

  // RSVPs table
  db.query(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      response TEXT NOT NULL CHECK (response IN ('yes', 'no', 'maybe')),
      plus_one BOOLEAN DEFAULT FALSE,
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

  // Initialize sessions table for OAuth authentication
  initializeSessionsTable();

  // Database schema initialized successfully
}
