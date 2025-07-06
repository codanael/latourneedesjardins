import { Handlers, PageProps } from "$fresh/server.ts";
import { Event, getUpcomingEvents } from "../utils/db-operations.ts";
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
} from "../utils/session.ts";
import Navigation from "../components/Navigation.tsx";

interface HomeData {
  events: Event[];
  user: AuthenticatedUser | null;
}

export const handler: Handlers<HomeData> = {
  GET(req, ctx) {
    const upcomingEvents = getUpcomingEvents(6);
    const user = getAuthenticatedUser(req);
    return ctx.render({ events: upcomingEvents, user });
  },
};

export default function Home({ data }: PageProps<HomeData>) {
  const { events, user } = data;
  return (
    <div class="min-h-screen bg-green-50">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <header class="text-center mb-8">
          <h1 class="text-4xl font-bold text-green-800 mb-2">
            La Tournée des Jardins
          </h1>
          <p class="text-green-600 text-lg">
            Découvrez les plus beaux jardins entre amis
          </p>
        </header>

        {/* Navigation */}
        <Navigation currentPath="/" user={user} />

        {/* Upcoming Events */}
        <section class="mb-8">
          <h2 class="text-2xl font-semibold text-green-800 mb-4">
            Prochains Événements
          </h2>

          {events.length > 0
            ? (
              <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 class="text-xl font-semibold text-green-800 mb-2">
                      {event.title}
                    </h3>
                    <p class="text-gray-600 mb-2">
                      📅 {new Date(event.date).toLocaleDateString("fr-FR")}
                    </p>
                    <p class="text-gray-600 mb-2">
                      📍 {event.location}
                    </p>
                    <p class="text-gray-600 mb-4">
                      🌱 Hôte: {event.host_name}
                    </p>
                    <a
                      href={`/events/${event.id}`}
                      class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Voir détails
                    </a>
                  </div>
                ))}
              </div>
            )
            : (
              <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <p class="text-gray-600 mb-4">
                  Aucun événement prévu pour le moment
                </p>
                <a
                  href="/host"
                  class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Organiser un événement
                </a>
              </div>
            )}
        </section>

        {/* Quick Actions */}
        <section class="text-center">
          <h2 class="text-2xl font-semibold text-green-800 mb-4">
            Actions Rapides
          </h2>
          <div class="flex flex-wrap justify-center gap-4">
            <a
              href="/events"
              class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Voir tous les événements
            </a>
            <a
              href="/calendar"
              class="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Consulter le calendrier
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
