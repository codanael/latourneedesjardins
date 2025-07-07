import { Handlers, PageProps } from "$fresh/server.ts";
import {
  Event,
  getEventById,
  updateEvent,
} from "../../../utils/db-operations.ts";
import { getAuthenticatedUser, hasPermission } from "../../../utils/session.ts";

interface EditEventData {
  event: Event | null;
  success?: boolean;
  error?: string;
}

export const handler: Handlers<EditEventData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require authentication
    if (!user) {
      return new Response("", {
        status: 302,
        headers: {
          "Location":
            "/auth/login?message=Vous devez vous connecter pour modifier un événement",
        },
      });
    }

    const id = parseInt(ctx.params.id);

    if (isNaN(id)) {
      return new Response("Invalid event ID", { status: 400 });
    }

    const event = getEventById(id);

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    // Check if user is the host of this event or an admin
    if (event.host_id !== user.id && !hasPermission(req, "admin")) {
      return new Response(
        "Forbidden - Seuls les hôtes de l'événement peuvent le modifier",
        {
          status: 403,
        },
      );
    }

    return ctx.render({ event });
  },

  async POST(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require authentication
    if (!user) {
      return new Response("", {
        status: 302,
        headers: {
          "Location":
            "/auth/login?message=Vous devez vous connecter pour modifier un événement",
        },
      });
    }

    const id = parseInt(ctx.params.id);

    if (isNaN(id)) {
      return new Response("Invalid event ID", { status: 400 });
    }

    const event = getEventById(id);

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    // Check if user is the host of this event or an admin
    if (event.host_id !== user.id && !hasPermission(req, "admin")) {
      return new Response(
        "Forbidden - Seuls les hôtes de l'événement peuvent le modifier",
        {
          status: 403,
        },
      );
    }

    const formData = await req.formData();

    // Extract form data
    const eventData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      theme: formData.get("theme") as string,
      max_attendees: formData.get("max_attendees")
        ? parseInt(formData.get("max_attendees") as string)
        : undefined,
      weather_location: formData.get("weather_location") as string,
      special_instructions: formData.get("special_instructions") as string,
    };

    // Simple validation
    if (
      !eventData.title || !eventData.date || !eventData.time ||
      !eventData.location
    ) {
      return ctx.render({
        event,
        error: "Veuillez remplir tous les champs obligatoires",
      });
    }

    try {
      // Update the event
      const updatedEvent = updateEvent(id, eventData);

      if (!updatedEvent) {
        return ctx.render({
          event,
          error: "Erreur lors de la mise à jour de l'événement",
        });
      }

      return ctx.render({
        event: updatedEvent,
        success: true,
      });
    } catch (error) {
      console.error("Error updating event:", error);
      return ctx.render({
        event,
        error: "Erreur lors de la mise à jour de l'événement",
      });
    }
  },
};

export default function EditEventPage({ data }: PageProps<EditEventData>) {
  const { event, success, error } = data;

  if (!event) {
    return (
      <div class="min-h-screen bg-green-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-red-600 mb-4">
            Événement non trouvé
          </h1>
          <a href="/events" class="text-green-600 hover:text-green-800">
            ← Retour aux événements
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div class="min-h-screen bg-green-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div class="text-center">
            <div class="text-6xl mb-4">✅</div>
            <h1 class="text-2xl font-bold text-green-800 mb-4">
              Événement mis à jour !
            </h1>
            <p class="text-gray-600 mb-6">
              Les modifications ont été enregistrées avec succès.
            </p>
            <div class="space-y-3">
              <a
                href={`/events/${event.id}`}
                class="block w-full bg-green-600 text-white text-center px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Voir l'événement
              </a>
              <a
                href="/events"
                class="block w-full bg-green-100 text-green-800 text-center px-6 py-3 rounded-lg hover:bg-green-200 transition-colors"
              >
                Retour aux événements
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-green-50">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <header class="text-center mb-8">
          <h1 class="text-3xl font-bold text-green-800 mb-2">
            Modifier l'événement
          </h1>
          <p class="text-green-600">
            {event.title}
          </p>
        </header>

        {/* Navigation */}
        <nav class="mb-8">
          <div class="flex flex-wrap justify-center gap-4">
            <a
              href="/"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Accueil
            </a>
            <a
              href="/events"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Événements
            </a>
            <a
              href={`/events/${event.id}`}
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              ← Retour à l'événement
            </a>
          </div>
        </nav>

        <div class="max-w-4xl mx-auto">
          {/* Form */}
          <section class="bg-white rounded-lg shadow-md p-8">
            <h2 class="text-2xl font-semibold text-green-800 mb-6">
              Détails de l'événement
            </h2>

            {error && (
              <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <p class="text-red-700">{error}</p>
              </div>
            )}

            <form method="POST" class="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                  Informations de base
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Titre de l'événement *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={event.title}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Garden Party chez..."
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        defaultValue={event.date}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Heure *
                      </label>
                      <input
                        type="time"
                        name="time"
                        required
                        defaultValue={event.time}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Adresse *
                    </label>
                    <textarea
                      name="location"
                      required
                      rows={2}
                      defaultValue={event.location}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="123 Rue des Jardins, 75001 Paris"
                    >
                    </textarea>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      defaultValue={event.description || ""}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Décrivez votre jardin, l'ambiance prévue, ce qui rend votre événement spécial..."
                    >
                    </textarea>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                  Détails supplémentaires
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Thème (optionnel)
                    </label>
                    <input
                      type="text"
                      name="theme"
                      defaultValue={event.theme || ""}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Potluck, Barbecue, Brunch..."
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Nombre max de participants
                    </label>
                    <input
                      type="number"
                      name="max_attendees"
                      min="1"
                      max="100"
                      defaultValue={event.max_attendees?.toString() || ""}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="15"
                    />
                  </div>
                </div>

                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Localisation météo
                  </label>
                  <input
                    type="text"
                    name="weather_location"
                    defaultValue={event.weather_location || ""}
                    class="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Paris,FR"
                  />
                </div>

                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Instructions spéciales
                  </label>
                  <textarea
                    name="special_instructions"
                    rows={3}
                    defaultValue={event.special_instructions || ""}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Apportez vos couverts, parking disponible, accès PMR..."
                  >
                  </textarea>
                </div>
              </div>

              <div class="pt-6 border-t">
                <div class="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    class="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
                  >
                    Enregistrer les modifications
                  </button>
                  <a
                    href={`/events/${event.id}`}
                    class="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors text-lg font-semibold text-center"
                  >
                    Annuler
                  </a>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
