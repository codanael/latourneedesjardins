// API endpoint for cached event details
// Returns event with RSVPs and potluck items for caching

import { Handlers } from "$fresh/server.ts";
import {
  getEventById,
  getPotluckItemsByEvent,
  getRSVPsByEvent,
  getUserRSVP,
} from "../../../../utils/db-operations.ts";
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
      const id = parseInt(ctx.params.id);

      if (isNaN(id)) {
        return new Response(
          JSON.stringify({ error: "Invalid event ID" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const event = getEventById(id);

      if (!event) {
        return new Response(
          JSON.stringify({ error: "Event not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const rsvps = getRSVPsByEvent(id);
      const potluckItems = getPotluckItemsByEvent(id);
      const currentUserRsvp = getUserRSVP(id, user.id);

      const eventDetails = {
        event,
        rsvps,
        potluckItems,
        currentUserRsvp,
      };

      return new Response(
        JSON.stringify(eventDetails),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=120", // 2 minutes
          },
        },
      );
    } catch (error) {
      console.error("Failed to fetch event details:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch event details" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
