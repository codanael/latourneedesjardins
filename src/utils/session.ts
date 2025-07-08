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
  // Test mode bypass - check for test headers
  const testUserEmail = req.headers.get("x-test-user-email");
  if (testUserEmail && Deno.env.get("DENO_ENV") === "test") {
    const db = getDatabase();
    const userResult = db.query(
      `SELECT * FROM users WHERE email = ?`,
      [testUserEmail],
    );

    if (userResult.length > 0) {
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
        role: (userRow[8] as string) || "user",
      };

      return {
        ...user,
        session: {
          id: "test-session",
          user_id: user.id,
          provider: "test",
          created_at: new Date().toISOString(),
          last_accessed: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }
  }

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
    role: (userRow[8] as string) || "user",
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
  permission: "admin" | "approved_host" | "pending_host" | "user",
): boolean {
  const user = getAuthenticatedUser(req);
  if (!user) return false;

  switch (permission) {
    case "admin":
      // Check if user has admin role
      return user.role === "admin";
    case "approved_host":
      // Only approved hosts and admins can create events
      return user.host_status === "approved" || user.role === "admin";
    case "pending_host":
      // Only pending hosts (for review purposes)
      return user.host_status === "pending";
    case "user":
      // Only approved hosts and admins can see events and interact with the app
      return user.host_status === "approved" || user.role === "admin";
    default:
      return false;
  }
}

// Helper functions for role management (to be implemented as needed)
export function updateUserRole(userId: number, role: string): boolean {
  const db = getDatabase();
  try {
    db.query(`UPDATE users SET role = ? WHERE id = ?`, [role, userId]);
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
}

export function updateUserHostStatus(userId: number, status: string): boolean {
  const db = getDatabase();
  try {
    db.query(`UPDATE users SET host_status = ? WHERE id = ?`, [status, userId]);
    return true;
  } catch (error) {
    console.error("Error updating user host status:", error);
    return false;
  }
}

// Enhanced permission checking with event-specific permissions
export async function hasEventPermission(
  req: Request,
  eventId: number,
  permission: "view" | "edit" | "delete" | "manage_attendees",
): Promise<boolean> {
  const user = getAuthenticatedUser(req);
  if (!user) return false;

  // Admins can do everything
  if (hasPermission(req, "admin")) return true;

  // Get event to check ownership
  const { getEventById } = await import("./db-operations.ts");
  const event = getEventById(eventId);

  if (!event) return false;

  const isEventHost = event.host_id === user.id;

  switch (permission) {
    case "view":
      // All authenticated users can view events
      return true;
    case "edit":
    case "delete":
    case "manage_attendees":
      // Only the event host or admins can edit/delete/manage
      return isEventHost;
    default:
      return false;
  }
}

// Rate limiting helper for security
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function isRateLimited(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (record.count >= maxRequests) {
    return true; // Rate limited
  }

  record.count++;
  return false;
}

// Security audit logging
export function logSecurityEvent(
  event: string,
  user: AuthenticatedUser | null,
  details: Record<string, unknown> = {},
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    user: user
      ? {
        id: user.id,
        email: user.email,
        host_status: user.host_status,
      }
      : null,
    details,
  };

  // In production, this should go to a proper logging service
  console.log("[SECURITY AUDIT]", JSON.stringify(logEntry));
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
  permission: "admin" | "approved_host" | "user",
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
        headers: {
          "Location":
            "/auth/login?message=Vous devez vous connecter pour accéder à cette page",
        },
      });
    }

    if (!hasPermission(req, permission)) {
      if (user.host_status === "pending") {
        return new Response("", {
          status: 302,
          headers: {
            "Location":
              "/auth/login?message=Votre compte est en attente d'approbation",
          },
        });
      }
      return new Response("Accès interdit", { status: 403 });
    }

    return handler(req, user);
  };
}
