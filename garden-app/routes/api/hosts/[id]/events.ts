import { Handlers } from "$fresh/server.ts";
import { getEventsByHost, getUserById, getEventById, deleteEvent } from "../../../../utils/db-operations.ts";

export const handler: Handlers = {
  // GET /api/hosts/[id]/events - Get all events for a specific host
  GET(_req, ctx) {
    const hostId = parseInt(ctx.params.id);
    
    if (isNaN(hostId)) {
      return new Response(
        JSON.stringify({ error: "Invalid host ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // Verify host exists
      const host = getUserById(hostId);
      if (!host) {
        return new Response(
          JSON.stringify({ error: "Host not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const events = getEventsByHost(hostId);
      
      // Calculate stats
      const now = new Date();
      const upcomingEvents = events.filter(event => new Date(event.date) >= now);
      const pastEvents = events.filter(event => new Date(event.date) < now);

      return new Response(
        JSON.stringify({
          host: {
            id: host.id,
            name: host.name,
            email: host.email,
          },
          events: events,
          stats: {
            totalEvents: events.length,
            upcomingEvents: upcomingEvents.length,
            pastEvents: pastEvents.length,
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching host events:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  // DELETE /api/hosts/[id]/events?eventId=X - Delete a specific event for a host
  DELETE(req, ctx) {
    const hostId = parseInt(ctx.params.id);
    const url = new URL(req.url);
    const eventId = parseInt(url.searchParams.get("eventId") || "");
    
    if (isNaN(hostId) || isNaN(eventId)) {
      return new Response(
        JSON.stringify({ error: "Invalid host ID or event ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // Verify host exists
      const host = getUserById(hostId);
      if (!host) {
        return new Response(
          JSON.stringify({ error: "Host not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Verify event exists and belongs to host
      const event = getEventById(eventId);
      if (!event) {
        return new Response(
          JSON.stringify({ error: "Event not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (event.host_id !== hostId) {
        return new Response(
          JSON.stringify({ error: "Event does not belong to this host" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check if event is in the future (optional protection)
      const eventDate = new Date(event.date);
      const now = new Date();
      if (eventDate < now) {
        return new Response(
          JSON.stringify({ error: "Cannot delete past events" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Delete the event
      deleteEvent(eventId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Event deleted successfully" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error deleting host event:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};