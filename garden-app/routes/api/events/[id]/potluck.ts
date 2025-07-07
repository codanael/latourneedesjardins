import { Handlers } from "$fresh/server.ts";
import {
  createPotluckItem,
  getEventById,
  getPotluckItemsByEvent,
} from "../../../../utils/db-operations.ts";
import { getAuthenticatedUser } from "../../../../utils/session.ts";
import { logSecurityEvent, sanitizeInput } from "../../../../utils/security.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    try {
      const user = getAuthenticatedUser(req);

      // Require authentication for potluck items
      if (!user) {
        logSecurityEvent({
          type: "auth_failure",
          ip: req.headers.get("x-forwarded-for") ||
            req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          url: req.url,
          timestamp: new Date(),
          details: { endpoint: "potluck_post" },
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
      const itemName = sanitizeInput(formData.get("item_name") as string);
      const category = sanitizeInput(formData.get("category") as string);
      const quantity = parseInt(formData.get("quantity") as string) || 1;
      const notes = sanitizeInput(formData.get("notes") as string);

      // Validate required fields
      if (!itemName || !category) {
        return new Response(
          JSON.stringify({ error: "Item name and category are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Validate category
      const validCategories = [
        "appetizer",
        "main",
        "side",
        "dessert",
        "drinks",
        "bread",
        "other",
      ];
      if (!validCategories.includes(category)) {
        return new Response(
          JSON.stringify({ error: "Invalid category" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Validate quantity
      if (quantity < 1 || quantity > 100) {
        return new Response(
          JSON.stringify({ error: "Quantity must be between 1 and 100" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Create potluck item
      const item = createPotluckItem({
        event_id: eventId,
        user_id: user.id,
        item_name: itemName,
        category,
        quantity,
        notes: notes || undefined,
      });

      return new Response(
        JSON.stringify({
          success: true,
          item: {
            id: item.id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            notes: item.notes,
            user_name: item.user_name,
          },
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error adding potluck item:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  GET(_req, ctx) {
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

      // Get potluck items for this event
      const items = getPotluckItemsByEvent(eventId);

      return new Response(
        JSON.stringify({
          success: true,
          items: items.map((item) => ({
            id: item.id,
            item_name: item.item_name,
            category: item.category,
            quantity: item.quantity,
            notes: item.notes,
            user_name: item.user_name,
          })),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error getting potluck items:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
