// API endpoint for cached events list
// Returns all events with RSVP counts for caching

import { Handlers } from "$fresh/server.ts";
import { getAllEvents, getEventStats } from "../../utils/db-operations.ts";

interface EventWithStats {
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
  rsvp_count: number;
}

export const handler: Handlers = {
  GET(_req) {
    // Authentication and permissions handled by middleware

    try {
      const events = getAllEvents();

      // Add RSVP counts to events
      const eventsWithStats: EventWithStats[] = events.map((event) => {
        const stats = getEventStats(event.id);
        const rsvp_count = stats.rsvp_stats
          .filter((stat) => stat.response === "yes")
          .reduce((sum, stat) => sum + (stat.total_attendees || stat.count), 0);

        return {
          ...event,
          rsvp_count,
        };
      });

      return new Response(
        JSON.stringify(eventsWithStats),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=300", // 5 minutes
          },
        },
      );
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch events" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
