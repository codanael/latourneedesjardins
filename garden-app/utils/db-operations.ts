import { getDatabase } from "./database.ts";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  host_status?: string;
  admin_notes?: string;
  confirmed_at?: string;
  role?: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  host_id: number;
  host_name?: string;
  host_email?: string;
  theme?: string;
  max_attendees?: number;
  weather_location?: string;
  special_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface RSVP {
  id: number;
  event_id: number;
  user_id: number;
  user_name?: string;
  response: "yes" | "no" | "maybe";
  created_at: string;
  updated_at: string;
}

export interface PotluckItem {
  id: number;
  event_id: number;
  user_id: number;
  user_name?: string;
  item_name: string;
  category: string;
  quantity: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// User operations
export function createUser(
  name: string,
  email: string,
  status: "pending" | "approved" | "rejected" = "pending",
): User {
  const db = getDatabase();
  const now = new Date().toISOString();
  const confirmedAt = status === "approved" ? now : null;

  db.query(
    `
    INSERT INTO users (name, email, host_status, confirmed_at)
    VALUES (?, ?, ?, ?)
  `,
    [name, email, status, confirmedAt],
  );

  const result = db.query(
    `
    SELECT * FROM users WHERE email = ?
  `,
    [email],
  );

  return rowToUser(result[0] as unknown[]);
}

export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  const result = db.query(
    `
    SELECT * FROM users WHERE email = ?
  `,
    [email],
  );

  if (result.length === 0) return null;

  return rowToUser(result[0] as unknown[]);
}

// Helper function to convert raw rows to User objects
function rowToUser(row: unknown[]): User {
  return {
    id: row[0] as number,
    name: row[1] as string,
    email: row[2] as string,
    created_at: row[3] as string,
    updated_at: row[4] as string,
    host_status: (row[5] as string) || "pending",
    admin_notes: (row[6] as string) || undefined,
    confirmed_at: (row[7] as string) || undefined,
  };
}

// Helper function to convert raw rows to Event objects
function rowToEvent(row: unknown[]): Event {
  return {
    id: row[0] as number,
    title: row[1] as string,
    description: row[2] as string,
    date: row[3] as string,
    time: row[4] as string,
    location: row[5] as string,
    host_id: row[6] as number,
    theme: row[7] as string,
    max_attendees: row[8] as number,
    weather_location: row[9] as string,
    special_instructions: row[10] as string,
    created_at: row[11] as string,
    updated_at: row[12] as string,
    host_name: (row[13] as string) || undefined,
    host_email: (row[14] as string) || undefined,
  };
}

// Helper function to convert raw rows to RSVP objects
function rowToRSVP(row: unknown[]): RSVP {
  return {
    id: row[0] as number,
    event_id: row[1] as number,
    user_id: row[2] as number,
    response: row[3] as "yes" | "no" | "maybe",
    created_at: row[4] as string,
    updated_at: row[5] as string,
    user_name: (row[6] as string) || undefined,
  };
}

// Helper function to convert raw rows to PotluckItem objects
function rowToPotluckItem(row: unknown[]): PotluckItem {
  return {
    id: row[0] as number,
    event_id: row[1] as number,
    user_id: row[2] as number,
    item_name: row[3] as string,
    category: row[4] as string,
    quantity: row[5] as number,
    notes: row[6] as string,
    created_at: row[7] as string,
    updated_at: row[8] as string,
    user_name: (row[9] as string) || undefined,
  };
}

export function getAllUsers(): User[] {
  const db = getDatabase();
  const result = db.query(`SELECT * FROM users ORDER BY name`);
  return result.map((row) => rowToUser(row as unknown[]));
}

// Event operations
export function createEvent(
  eventData: Omit<
    Event,
    "id" | "created_at" | "updated_at" | "host_name" | "host_email"
  >,
): Event {
  const db = getDatabase();
  db.query(
    `
    INSERT INTO events (title, description, date, time, location, host_id, theme, max_attendees, weather_location, special_instructions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      eventData.title,
      eventData.description,
      eventData.date,
      eventData.time,
      eventData.location,
      eventData.host_id,
      eventData.theme,
      eventData.max_attendees,
      eventData.weather_location,
      eventData.special_instructions,
    ],
  );

  // Get the created event by finding the most recent one for this host
  const result = db.query(
    `
    SELECT 
      e.*,
      u.name as host_name,
      u.email as host_email
    FROM events e
    JOIN users u ON e.host_id = u.id
    WHERE e.host_id = ? AND e.title = ?
    ORDER BY e.created_at DESC
    LIMIT 1
  `,
    [eventData.host_id, eventData.title],
  );

  return rowToEvent(result[0] as unknown[]);
}

export function getAllEvents(): Event[] {
  const db = getDatabase();
  const result = db.query(`
    SELECT 
      e.*,
      u.name as host_name,
      u.email as host_email
    FROM events e
    JOIN users u ON e.host_id = u.id
    ORDER BY e.date ASC
  `);
  return result.map((row) => rowToEvent(row as unknown[]));
}

export function getUpcomingEvents(limit = 10): Event[] {
  const db = getDatabase();
  const today = new Date().toISOString().split("T")[0];

  const result = db.query(
    `
    SELECT 
      e.*,
      u.name as host_name,
      u.email as host_email
    FROM events e
    JOIN users u ON e.host_id = u.id
    WHERE e.date >= ?
    ORDER BY e.date ASC
    LIMIT ?
  `,
    [today, limit],
  );
  return result.map((row) => rowToEvent(row as unknown[]));
}

export function getEventById(id: number): Event | null {
  const db = getDatabase();
  const result = db.query(
    `
    SELECT 
      e.*,
      u.name as host_name,
      u.email as host_email
    FROM events e
    JOIN users u ON e.host_id = u.id
    WHERE e.id = ?
  `,
    [id],
  );

  if (result.length === 0) return null;
  return rowToEvent(result[0] as unknown[]);
}

export function getEventsByHost(hostId: number): Event[] {
  const db = getDatabase();
  const result = db.query(
    `
    SELECT 
      e.*,
      u.name as host_name,
      u.email as host_email
    FROM events e
    JOIN users u ON e.host_id = u.id
    WHERE e.host_id = ?
    ORDER BY e.date ASC
  `,
    [hostId],
  );
  return result.map((row) => rowToEvent(row as unknown[]));
}

export function updateEvent(
  id: number,
  eventData: Partial<
    Omit<Event, "id" | "created_at" | "updated_at" | "host_name" | "host_email">
  >,
): Event | null {
  const db = getDatabase();

  const updateFields = [];
  const updateValues = [];

  for (const [key, value] of Object.entries(eventData)) {
    if (value !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  }

  if (updateFields.length === 0) return getEventById(id);

  updateValues.push(id);

  db.query(
    `
    UPDATE events 
    SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
    updateValues,
  );

  return getEventById(id);
}

// RSVP operations
export function createOrUpdateRSVP(
  event_id: number,
  user_id: number,
  response: "yes" | "no" | "maybe",
): RSVP {
  const db = getDatabase();

  db.query(
    `
    INSERT OR REPLACE INTO rsvps (event_id, user_id, response)
    VALUES (?, ?, ?)
  `,
    [event_id, user_id, response],
  );

  return getRSVPsByEvent(event_id).find((r) => r.user_id === user_id)!;
}

export function getRSVPsByEvent(event_id: number): RSVP[] {
  const db = getDatabase();
  const result = db.query(
    `
    SELECT 
      r.*,
      u.name as user_name
    FROM rsvps r
    JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ?
    ORDER BY r.response, u.name
  `,
    [event_id],
  );
  return result.map((row) => rowToRSVP(row as unknown[]));
}

export function getUserRSVP(event_id: number, user_id: number): RSVP | null {
  const db = getDatabase();
  const result = db.query(
    `
    SELECT 
      r.*,
      u.name as user_name
    FROM rsvps r
    JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ? AND r.user_id = ?
  `,
    [event_id, user_id],
  );

  if (result.length === 0) return null;
  return rowToRSVP(result[0] as unknown[]);
}

// Potluck operations
export function createPotluckItem(
  itemData: Omit<PotluckItem, "id" | "created_at" | "updated_at" | "user_name">,
): PotluckItem {
  const db = getDatabase();
  db.query(
    `
    INSERT INTO potluck_items (event_id, user_id, item_name, category, quantity, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      itemData.event_id,
      itemData.user_id,
      itemData.item_name,
      itemData.category,
      itemData.quantity,
      itemData.notes,
    ],
  );

  // Return the most recent item for this event/user combination
  const items = getPotluckItemsByEvent(itemData.event_id);
  return items[items.length - 1];
}

export function getPotluckItemsByEvent(event_id: number): PotluckItem[] {
  const db = getDatabase();
  const result = db.query(
    `
    SELECT 
      p.*,
      u.name as user_name
    FROM potluck_items p
    JOIN users u ON p.user_id = u.id
    WHERE p.event_id = ?
    ORDER BY p.category, p.item_name
  `,
    [event_id],
  );
  return result.map((row) => rowToPotluckItem(row as unknown[]));
}

export function deletePotluckItem(id: number, user_id: number): boolean {
  const db = getDatabase();
  db.query(
    `
    DELETE FROM potluck_items 
    WHERE id = ? AND user_id = ?
  `,
    [id, user_id],
  );

  return true; // SQLite doesn't return changes count in this API
}

// Utility functions
export function getEventStats(event_id: number) {
  const db = getDatabase();

  const rsvpResult = db.query(
    `
    SELECT 
      response,
      COUNT(*) as count
    FROM rsvps 
    WHERE event_id = ?
    GROUP BY response
  `,
    [event_id],
  );

  const rsvpStats = rsvpResult.map((row) => ({
    response: (row as unknown[])[0] as string,
    count: (row as unknown[])[1] as number,
  }));

  const potluckResult = db.query(
    `
    SELECT COUNT(*) as count
    FROM potluck_items
    WHERE event_id = ?
  `,
    [event_id],
  );

  const potluckCount = (potluckResult[0] as unknown[])[0] as number;

  return {
    rsvp_stats: rsvpStats,
    potluck_count: potluckCount,
  };
}

export function getUserById(id: number): User | null {
  const db = getDatabase();
  const result = db.query(
    `SELECT * FROM users WHERE id = ?`,
    [id],
  );

  if (result.length === 0) return null;
  return rowToUser(result[0] as unknown[]);
}

export function deleteEvent(id: number): boolean {
  const db = getDatabase();

  try {
    // Delete related records first (foreign key constraints)
    db.query(`DELETE FROM potluck_items WHERE event_id = ?`, [id]);
    db.query(`DELETE FROM rsvps WHERE event_id = ?`, [id]);

    // Delete the event
    db.query(`DELETE FROM events WHERE id = ?`, [id]);

    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
    return false;
  }
}

// Host status management functions
export function updateHostStatus(
  userId: number,
  status: "pending" | "approved" | "rejected",
  adminNotes?: string,
): boolean {
  const db = getDatabase();

  try {
    const now = status === "approved" ? new Date().toISOString() : null;

    db.query(
      `UPDATE users 
       SET host_status = ?, admin_notes = ?, confirmed_at = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, adminNotes || null, now, userId],
    );

    return true;
  } catch (error) {
    console.error("Error updating host status:", error);
    return false;
  }
}

export function getHostsByStatus(
  status?: "pending" | "approved" | "rejected",
): User[] {
  const db = getDatabase();

  let query = `SELECT * FROM users`;
  const params: (string | number)[] = [];

  if (status) {
    query += ` WHERE host_status = ?`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC`;

  const result = db.query(query, params);
  return result.map((row) => rowToUser(row as unknown[]));
}

export function autoApproveHost(email: string): boolean {
  const db = getDatabase();

  try {
    const now = new Date().toISOString();

    db.query(
      `UPDATE users 
       SET host_status = 'approved', confirmed_at = ?, admin_notes = 'Auto-approved', updated_at = CURRENT_TIMESTAMP 
       WHERE email = ?`,
      [now, email],
    );

    return true;
  } catch (error) {
    console.error("Error auto-approving host:", error);
    return false;
  }
}

export function requiresApproval(userId: number): boolean {
  const db = getDatabase();

  try {
    const result = db.query(
      `SELECT host_status FROM users WHERE id = ?`,
      [userId],
    );

    if (result.length === 0) return true;

    const status = (result[0] as unknown[])[0] as string;
    return status === "pending";
  } catch (error) {
    console.error("Error checking approval status:", error);
    return true; // Default to requiring approval on error
  }
}
