import { Handlers } from "$fresh/server.ts";
import {
  createOrUpdateRSVP,
  createUser,
  getEventById,
  getUserByEmail,
} from "../../../../utils/db-operations.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    try {
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
      const response = formData.get("response") as string;

      // Validate response
      if (!response || !["yes", "no", "maybe"].includes(response)) {
        return new Response(
          JSON.stringify({ error: "Invalid RSVP response" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // For now, we'll create a demo user since we don't have authentication yet
      // In a real app, this would come from the authenticated user session
      const demoEmail = "demo@example.com";
      let user = getUserByEmail(demoEmail);

      if (!user) {
        user = createUser("Utilisateur Demo", demoEmail);
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

  async GET(_req, ctx) {
    try {
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

      // For demo purposes, check the demo user's RSVP
      const demoEmail = "demo@example.com";
      const user = getUserByEmail(demoEmail);

      if (!user) {
        return new Response(
          JSON.stringify({ rsvp: null }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Get user's current RSVP for this event
      const { getUserRSVP } = await import(
        "../../../../utils/db-operations.ts"
      );
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
