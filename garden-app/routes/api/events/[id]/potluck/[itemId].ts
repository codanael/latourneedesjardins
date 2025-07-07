import { Handlers } from "$fresh/server.ts";
import {
  deletePotluckItem,
  getEventById,
} from "../../../../../utils/db-operations.ts";
import { getAuthenticatedUser } from "../../../../../utils/session.ts";
import { logSecurityEvent } from "../../../../../utils/security.ts";

export const handler: Handlers = {
  DELETE(req, ctx) {
    try {
      const user = getAuthenticatedUser(req);

      // Require authentication for deleting potluck items
      if (!user) {
        logSecurityEvent({
          type: "auth_failure",
          ip: req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          url: req.url,
          timestamp: new Date(),
          details: { endpoint: "potluck_delete" },
        });

        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const eventId = parseInt(ctx.params.id);
      const itemId = parseInt(ctx.params.itemId);

      if (isNaN(eventId) || isNaN(itemId)) {
        return new Response(
          JSON.stringify({ error: "Invalid event ID or item ID" }),
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

      // Delete potluck item (with user ownership validation)
      const success = deletePotluckItem(itemId, user.id);

      if (!success) {
        return new Response(
          JSON.stringify({ error: "Failed to delete item or item not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Potluck item deleted successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error deleting potluck item:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
