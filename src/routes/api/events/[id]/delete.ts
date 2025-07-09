import { Handlers } from "$fresh/server.ts";
import { deleteEvent, getEventById } from "../../../../utils/db-operations.ts";
import { hasEventPermission } from "../../../../utils/session.ts";

export const handler: Handlers = {
  async DELETE(req, ctx) {
    try {
      const eventId = parseInt(ctx.params.id);

      if (isNaN(eventId)) {
        return new Response(
          JSON.stringify({ error: "ID d'événement invalide" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Check if user has permission to delete this event
      const hasPermission = await hasEventPermission(req, eventId, "delete");
      if (!hasPermission) {
        return new Response(JSON.stringify({ error: "Permission refusée" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if event exists
      const event = getEventById(eventId);
      if (!event) {
        return new Response(JSON.stringify({ error: "Événement non trouvé" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Delete the event
      const success = deleteEvent(eventId);

      if (success) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Événement supprimé avec succès",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } else {
        return new Response(
          JSON.stringify({
            error: "Erreur lors de la suppression de l'événement",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      return new Response(
        JSON.stringify({
          error: "Erreur serveur lors de la suppression",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
