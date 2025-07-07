// API endpoint for cached user RSVP data
// Returns user's RSVP responses for caching

import { Handlers } from "$fresh/server.ts";
import { getDatabase } from "../../../../utils/database.ts";
import { getAuthenticatedUser } from "../../../../utils/session.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require authentication
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      const requestedUserId = parseInt(ctx.params.id);

      if (isNaN(requestedUserId)) {
        return new Response(
          JSON.stringify({ error: "Invalid user ID" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Users can only access their own RSVP data (unless admin)
      if (requestedUserId !== user.id && user.role !== "admin") {
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const db = getDatabase();
      const rsvps = db.prepare(`
        SELECT r.*, e.title as event_title, e.date as event_date
        FROM rsvps r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = ?
        ORDER BY e.date DESC
      `).all(requestedUserId);

      return new Response(
        JSON.stringify(rsvps),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=60", // 1 minute
          },
        },
      );
    } catch (error) {
      console.error("Failed to fetch user RSVPs:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user RSVPs" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
