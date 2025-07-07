import { Handlers } from "$fresh/server.ts";
import {
  createOrUpdateRSVP,
  getEventById,
  getUserRSVP,
} from "../../../../utils/db-operations.ts";
import { getAuthenticatedUser } from "../../../../utils/session.ts";
import { logSecurityEvent, sanitizeInput } from "../../../../utils/security.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    try {
      const user = getAuthenticatedUser(req);

      // Require authentication for RSVP
      if (!user) {
        // Log security event for unauthorized access attempt
        logSecurityEvent({
          type: "auth_failure",
          ip: req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          url: req.url,
          timestamp: new Date(),
          details: { endpoint: "rsvp_post" },
        });

        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const eventId = parseInt(ctx.params.id);

      if (isNaN(eventId)) {
        return new Response(
          JSON.stringify({ error: "Invalid event ID" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Check if event exists
      const event = getEventById(eventId);
      if (!event) {
        return new Response(
          JSON.stringify({ error: "Event not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      const formData = await req.formData();
      const response = sanitizeInput(formData.get("response") as string);

      // Validate response
      if (!response || !["yes", "no", "maybe"].includes(response)) {
        return new Response(
          JSON.stringify({ error: "Invalid RSVP response" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Create or update RSVP
      const rsvp = createOrUpdateRSVP(
        eventId,
        user.id,
        response as "yes" | "no" | "maybe",
      );

      return new Response(
        JSON.stringify({
          success: true,
          rsvp: {
            id: rsvp.id,
            response: rsvp.response,
            user_name: rsvp.user_name,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error handling RSVP:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  GET(req, ctx) {
    try {
      const user = getAuthenticatedUser(req);

      // Require authentication for RSVP retrieval
      if (!user) {
        // Log security event for unauthorized access attempt
        logSecurityEvent({
          type: "auth_failure",
          ip: req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          url: req.url,
          timestamp: new Date(),
          details: { endpoint: "rsvp_get" },
        });

        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const eventId = parseInt(ctx.params.id);

      if (isNaN(eventId)) {
        return new Response(
          JSON.stringify({ error: "Invalid event ID" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Check if event exists
      const event = getEventById(eventId);
      if (!event) {
        return new Response(
          JSON.stringify({ error: "Event not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      // Get user's current RSVP for this event
      const userRsvp = getUserRSVP(eventId, user.id);

      return new Response(
        JSON.stringify({
          rsvp: userRsvp
            ? {
              id: userRsvp.id,
              response: userRsvp.response,
              user_name: userRsvp.user_name,
            }
            : null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error getting RSVP:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
