import { Handlers, PageProps } from "$fresh/server.ts";
import { Event, getUpcomingEvents } from "../utils/db-operations.ts";
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
} from "../utils/session.ts";
import MobileLayout from "../components/MobileLayout.tsx";

interface HomeData {
  events: Event[];
  user: AuthenticatedUser;
}

export const handler: Handlers<HomeData> = {
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

    const upcomingEvents = getUpcomingEvents(6);
    return ctx.render({ events: upcomingEvents, user });
  },
};

export default function Home({ data }: PageProps<HomeData>) {
  const { events, user } = data;

  return (
    <MobileLayout
      user={user}
      currentPath="/"
      title="La Tournée des Jardins"
    >
      {/* Subtitle */}
      <div class="text-center mb-6 sm:mb-8">
        <p class="text-green-600 text-base sm:text-lg">
          Découvrez les plus beaux jardins entre amis
        </p>
      </div>

      {/* Upcoming Events */}
      <section class="mb-6 sm:mb-8">
        <h2 class="text-xl sm:text-2xl font-semibold text-green-800 mb-4">
          Prochains Événements
        </h2>

        {events.length > 0
          ? (
            <div class="mobile-grid">
              {events.map((event) => (
                <div
                  key={event.id}
                  class="card touch-manipulation"
                >
                  <h3 class="text-lg sm:text-xl font-semibold text-green-800 mb-3">
                    {event.title}
                  </h3>
                  <div class="space-y-2 mb-4">
                    <p class="text-gray-600 text-sm sm:text-base flex items-center">
                      <span class="mr-2">📅</span>
                      <span>
                        {new Date(event.date).toLocaleDateString("fr-FR")}
                      </span>
                    </p>
                    <p class="text-gray-600 text-sm sm:text-base flex items-start">
                      <span class="mr-2 mt-0.5">📍</span>
                      <span class="flex-1 break-words">{event.location}</span>
                    </p>
                    <p class="text-gray-600 text-sm sm:text-base flex items-center">
                      <span class="mr-2">🌱</span>
                      <span>Hôte: {event.host_name}</span>
                    </p>
                  </div>
                  <a
                    href={`/events/${event.id}`}
                    class="btn btn-primary w-full justify-center inline-flex"
                  >
                    Voir détails
                  </a>
                </div>
              ))}
            </div>
          )
          : (
            <div class="card text-center">
              <div class="text-4xl mb-4">🌱</div>
              <p class="text-gray-600 mb-4">
                Aucun événement prévu pour le moment
              </p>
              <a
                href="/host"
                class="btn btn-primary inline-flex"
              >
                Organiser un événement
              </a>
            </div>
          )}
      </section>

      {/* Quick Actions */}
      <section class="text-center">
        <h2 class="text-xl sm:text-2xl font-semibold text-green-800 mb-4">
          Actions Rapides
        </h2>
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
          <a
            href="/events"
            class="btn bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 flex-1 justify-center inline-flex"
          >
            <span class="mr-2">📋</span>
            Tous les événements
          </a>
          <a
            href="/calendar"
            class="btn bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700 flex-1 justify-center inline-flex"
          >
            <span class="mr-2">📅</span>
            Calendrier
          </a>
        </div>
      </section>
    </MobileLayout>
  );
}
