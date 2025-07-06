import { getDatabase } from "./database.ts";
import { User } from "./db-operations.ts";
import { parseSessionCookie } from "./oauth.ts";

export interface Session {
  id: string;
  user_id: number;
  provider: string;
  created_at: string;
  last_accessed: string;
  expires_at: string;
  user_agent?: string;
  ip_address?: string;
}

export interface AuthenticatedUser extends User {
  session: Session;
}

// Initialize sessions table
export function initializeSessionsTable() {
  const db = getDatabase();

  // Create sessions table if it doesn't exist
  db.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create index for faster lookups
  db.query(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
  `);

  db.query(`
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)
  `);
}

// Create a new session
export function createSession(
  userId: number,
  provider: string,
  userAgent?: string,
  ipAddress?: string,
): string {
  const db = getDatabase();

  // Generate cryptographically secure session ID
  const sessionId = crypto.randomUUID();

  // Set shorter session expiration for security (24 hours instead of 7 days)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Clean up any existing sessions for this user if they exceed limit
  const existingSessions = getUserSessions(userId);
  if (existingSessions.length >= 5) { // Max 5 concurrent sessions
    // Delete oldest session
    const oldestSession = existingSessions[existingSessions.length - 1];
    deleteSession(oldestSession.id);
  }

  db.query(
    `
    INSERT INTO sessions (id, user_id, provider, expires_at, user_agent, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      sessionId,
      userId,
      provider,
      expiresAt.toISOString(),
      userAgent || null,
      ipAddress || null,
    ],
  );

  return sessionId;
}

// Get session by ID
export function getSession(sessionId: string): Session | null {
  const db = getDatabase();
  const result = db.query(
    `
    SELECT * FROM sessions 
    WHERE id = ? AND expires_at > CURRENT_TIMESTAMP
  `,
    [sessionId],
  );

  if (result.length === 0) return null;

  const row = result[0] as unknown[];
  return {
    id: row[0] as string,
    user_id: row[1] as number,
    provider: row[2] as string,
    created_at: row[3] as string,
    last_accessed: row[4] as string,
    expires_at: row[5] as string,
    user_agent: row[6] as string,
    ip_address: row[7] as string,
  };
}

// Update session last accessed time
export function updateSessionLastAccessed(sessionId: string): void {
  const db = getDatabase();
  db.query(
    `
    UPDATE sessions 
    SET last_accessed = CURRENT_TIMESTAMP 
    WHERE id = ?
  `,
    [sessionId],
  );
}

// Delete session (logout)
export function deleteSession(sessionId: string): void {
  const db = getDatabase();
  db.query(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
}

// Delete all sessions for a user
export function deleteAllUserSessions(userId: number): void {
  const db = getDatabase();
  db.query(`DELETE FROM sessions WHERE user_id = ?`, [userId]);
}

// Clean up expired sessions
export function cleanupExpiredSessions(): void {
  const db = getDatabase();
  db.query(`DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP`);
}

// Get authenticated user from request
export function getAuthenticatedUser(req: Request): AuthenticatedUser | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const sessionId = parseSessionCookie(cookieHeader);
  if (!sessionId) return null;

  const session = getSession(sessionId);
  if (!session) return null;

  // Update last accessed time
  updateSessionLastAccessed(sessionId);

  // Get user data
  const db = getDatabase();
  const userResult = db.query(
    `
    SELECT * FROM users WHERE id = ?
  `,
    [session.user_id],
  );

  if (userResult.length === 0) return null;

  const userRow = userResult[0] as unknown[];
  const user: User = {
    id: userRow[0] as number,
    name: userRow[1] as string,
    email: userRow[2] as string,
    created_at: userRow[3] as string,
    updated_at: userRow[4] as string,
    host_status: (userRow[5] as string) || "pending",
    admin_notes: (userRow[6] as string) || undefined,
    confirmed_at: (userRow[7] as string) || undefined,
  };

  return {
    ...user,
    session,
  };
}

// Check if user is authenticated
export function isAuthenticated(req: Request): boolean {
  return getAuthenticatedUser(req) !== null;
}

// Check if user has specific role or permission
export function hasPermission(
  req: Request,
  permission: "admin" | "host" | "user",
): boolean {
  const user = getAuthenticatedUser(req);
  if (!user) return false;

  switch (permission) {
    case "admin":
      // Check if user is admin (you can extend this logic)
      return user.email.includes("admin") || user.host_status === "admin";
    case "host":
      return user.host_status === "approved" || hasPermission(req, "admin");
    case "user":
      return true; // All authenticated users have basic user permissions
    default:
      return false;
  }
}

// Get user sessions
export function getUserSessions(userId: number): Session[] {
  const db = getDatabase();
  const result = db.query(
    `
    SELECT * FROM sessions 
    WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
    ORDER BY last_accessed DESC
  `,
    [userId],
  );

  return result.map((row) => {
    const r = row as unknown[];
    return {
      id: r[0] as string,
      user_id: r[1] as number,
      provider: r[2] as string,
      created_at: r[3] as string,
      last_accessed: r[4] as string,
      expires_at: r[5] as string,
      user_agent: r[6] as string,
      ip_address: r[7] as string,
    };
  });
}

// Middleware helper for requiring authentication
export function requireAuth(
  handler: (
    req: Request,
    user: AuthenticatedUser,
  ) => Response | Promise<Response>,
) {
  return (req: Request): Response | Promise<Response> => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return new Response("", {
        status: 302,
        headers: { "Location": "/auth/login" },
      });
    }

    return handler(req, user);
  };
}

// Middleware helper for requiring specific permissions
export function requirePermission(
  permission: "admin" | "host" | "user",
  handler: (
    req: Request,
    user: AuthenticatedUser,
  ) => Response | Promise<Response>,
) {
  return (req: Request): Response | Promise<Response> => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return new Response("", {
        status: 302,
        headers: { "Location": "/auth/login" },
      });
    }

    if (!hasPermission(req, permission)) {
      return new Response("Forbidden", { status: 403 });
    }

    return handler(req, user);
  };
}
