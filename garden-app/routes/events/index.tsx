import { Handlers, PageProps } from "$fresh/server.ts";
import {
  Event,
  getAllEvents,
  getEventStats,
} from "../../utils/db-operations.ts";

interface EventWithStats extends Event {
  rsvp_count: number;
}

export const handler: Handlers<EventWithStats[]> = {
  GET(_req, ctx) {
    const events = getAllEvents();

    // Add RSVP counts to events
    const eventsWithStats: EventWithStats[] = events.map((event) => {
      const stats = getEventStats(event.id);
      const rsvp_count = stats.rsvp_stats
        .filter((stat) => stat.response === "yes")
        .reduce((sum, stat) => sum + stat.count, 0);

      return {
        ...event,
        rsvp_count,
      };
    });

    return ctx.render(eventsWithStats);
  },
};

export default function EventsPage(
  { data: events }: PageProps<EventWithStats[]>,
) {
  return (
    <div class="min-h-screen bg-green-50">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <header class="text-center mb-8">
          <h1 class="text-3xl font-bold text-green-800 mb-2">
            Tous les Événements
          </h1>
          <p class="text-green-600">
            Découvrez tous les jardins ouverts à la visite
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
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Événements
            </a>
            <a
              href="/calendar"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Calendrier
            </a>
            <a
              href="/host"
              class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Devenir Hôte
            </a>
          </div>
        </nav>

        {/* Events List */}
        <section>
          {events.length > 0
            ? (
              <div class="space-y-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div class="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div class="flex-1">
                        <h3 class="text-2xl font-semibold text-green-800 mb-2">
                          {event.title}
                        </h3>
                        <p class="text-gray-700 mb-4">
                          {event.description}
                        </p>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p class="text-gray-600">
                              📅{" "}
                              {new Date(event.date).toLocaleDateString("fr-FR")}
                              {" "}
                              à {event.time}
                            </p>
                            <p class="text-gray-600">
                              📍 {event.location}
                            </p>
                            <p class="text-gray-600">
                              🌱 Hôte: {event.host_name}
                            </p>
                          </div>
                          <div>
                            {event.theme && (
                              <p class="text-gray-600">
                                🎨 Thème: {event.theme}
                              </p>
                            )}
                            <p class="text-gray-600">
                              👥 {event.rsvp_count}
                              {event.max_attendees
                                ? `/${event.max_attendees}`
                                : ""} participants
                            </p>
                          </div>
                        </div>
                      </div>

                      <div class="flex flex-col gap-2 md:ml-6">
                        <a
                          href={`/events/${event.id}`}
                          class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
                        >
                          Voir détails
                        </a>
                        <a
                          href={`/events/${event.id}/rsvp`}
                          class="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center"
                        >
                          RSVP
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
            : (
              <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <p class="text-gray-600 mb-4">
                  Aucun événement disponible pour le moment
                </p>
                <a
                  href="/host"
                  class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Organiser le premier événement
                </a>
              </div>
            )}
        </section>

        {/* Call to Action */}
        <section class="mt-12 text-center">
          <div class="bg-green-100 rounded-lg p-8">
            <h2 class="text-2xl font-semibold text-green-800 mb-4">
              Envie d'organiser un événement ?
            </h2>
            <p class="text-green-700 mb-6">
              Partagez votre jardin avec la communauté et créez des moments
              inoubliables
            </p>
            <a
              href="/host"
              class="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg"
            >
              Devenir Hôte
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
