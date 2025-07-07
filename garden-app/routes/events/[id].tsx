import { Handlers, PageProps } from "$fresh/server.ts";
import {
  Event,
  getEventById,
  getPotluckItemsByEvent,
  getRSVPsByEvent,
  getUserRSVP,
  PotluckItem,
  RSVP,
} from "../../utils/db-operations.ts";
import { getAuthenticatedUser } from "../../utils/session.ts";
import RSVPButton from "../../islands/RSVPButton.tsx";

interface EventPageData {
  event: Event | null;
  rsvps: RSVP[];
  potluckItems: PotluckItem[];
  currentUserRsvp: RSVP | null;
}

export const handler: Handlers<EventPageData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require authentication for all access
    if (!user) {
      return new Response("", {
        status: 302,
        headers: {
          "Location":
            "/auth/login?message=Vous devez vous connecter pour accéder à cette page",
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

    const rsvps = getRSVPsByEvent(id);
    const potluckItems = getPotluckItemsByEvent(id);

    // Get current user's RSVP
    const currentUserRsvp = getUserRSVP(id, user.id);

    return ctx.render({ event, rsvps, potluckItems, currentUserRsvp });
  },
};

export default function EventDetailPage({ data }: PageProps<EventPageData>) {
  const { event, rsvps, potluckItems, currentUserRsvp } = data;

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

  const yesRsvps = rsvps.filter((r) => r.response === "yes");
  const maybeRsvps = rsvps.filter((r) => r.response === "maybe");

  return (
    <div class="min-h-screen bg-green-50">
      <div class="container mx-auto px-4 py-8">
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
              ← Tous les événements
            </a>
            <a
              href="/calendar"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Calendrier
            </a>
          </div>
        </nav>

        {/* Event Header */}
        <header class="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 class="text-3xl font-bold text-green-800 mb-4">
            {event.title}
          </h1>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                Détails de l'événement
              </h3>
              <p class="text-gray-600 mb-2">
                📅 {new Date(event.date).toLocaleDateString("fr-FR")} à{" "}
                {event.time}
              </p>
              <p class="text-gray-600 mb-2">
                📍 {event.location}
              </p>
              <p class="text-gray-600 mb-2">
                🌱 Hôte: {event.host_name}
              </p>
              {event.theme && (
                <p class="text-gray-600 mb-2">
                  🎨 Thème: {event.theme}
                </p>
              )}
              {event.max_attendees && (
                <p class="text-gray-600">
                  👥 Places disponibles: {event.max_attendees}
                </p>
              )}
            </div>

            <div class="flex flex-col justify-center">
              <div class="space-y-3">
                <a
                  href={`/events/${event.id}/potluck`}
                  class="block w-full bg-blue-500 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Gérer le Potluck
                </a>
                <a
                  href={`/events/${event.id}/edit`}
                  class="block w-full bg-orange-500 text-white text-center px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  ✏️ Modifier l'événement
                </a>
              </div>
            </div>
          </div>

          <div class="border-t pt-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Description
            </h3>
            <p class="text-gray-700 mb-4">
              {event.description}
            </p>

            {event.special_instructions && (
              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h4 class="font-semibold text-yellow-800 mb-1">
                  Instructions spéciales
                </h4>
                <p class="text-yellow-700">{event.special_instructions}</p>
              </div>
            )}
          </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* RSVP Section */}
          <section class="bg-white rounded-lg shadow-md p-6 md:col-span-2 lg:col-span-1">
            <RSVPButton
              eventId={event.id}
              currentResponse={currentUserRsvp?.response}
            />
          </section>

          {/* Participants List */}
          <section class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-semibold text-green-800 mb-4">
              Participants ({yesRsvps.length} confirmés)
            </h2>

            <div class="space-y-4">
              <div>
                <h3 class="font-semibold text-green-700 mb-2">
                  ✅ Confirmés ({yesRsvps.length})
                </h3>
                <div class="grid grid-cols-2 gap-2">
                  {yesRsvps.map((rsvp) => (
                    <div key={rsvp.id} class="bg-green-50 px-3 py-2 rounded">
                      {rsvp.user_name}
                    </div>
                  ))}
                </div>
              </div>

              {maybeRsvps.length > 0 && (
                <div>
                  <h3 class="font-semibold text-yellow-700 mb-2">
                    🤔 Peut-être ({maybeRsvps.length})
                  </h3>
                  <div class="grid grid-cols-2 gap-2">
                    {maybeRsvps.map((rsvp) => (
                      <div key={rsvp.id} class="bg-yellow-50 px-3 py-2 rounded">
                        {rsvp.user_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Potluck List */}
          <section class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-semibold text-green-800 mb-4">
              Potluck ({potluckItems.length} contributions)
            </h2>

            <div class="space-y-4">
              {potluckItems.length > 0
                ? (
                  <div class="space-y-3">
                    {potluckItems.map((item) => (
                      <div
                        key={item.id}
                        class="flex justify-between items-center bg-blue-50 px-4 py-3 rounded"
                      >
                        <div>
                          <span class="font-medium">{item.item_name}</span>
                          <span class="text-sm text-gray-600 ml-2">
                            ({item.category})
                          </span>
                          {item.quantity > 1 && (
                            <span class="text-sm text-gray-600 ml-2">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                        <div class="text-sm text-gray-600">
                          {item.user_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : (
                  <p class="text-gray-600 text-center py-4">
                    Aucune contribution pour le moment
                  </p>
                )}

              <a
                href={`/events/${event.id}/potluck`}
                class="block w-full bg-blue-500 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Ajouter une contribution
              </a>
            </div>
          </section>
        </div>

        {/* Weather Widget Placeholder */}
        <section class="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-semibold text-green-800 mb-4">
            Météo prévue
          </h2>
          <div class="bg-blue-50 p-4 rounded-lg text-center">
            <p class="text-gray-600">
              🌤️ Widget météo à implémenter
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Les prévisions météo s'afficheront ici
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
