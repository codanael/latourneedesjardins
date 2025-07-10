import { Handlers, PageProps } from "$fresh/server.ts";
import { Event, getUpcomingEvents } from "../utils/db-operations.ts";
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
  hasPermission,
} from "../utils/session.ts";
import MobileLayout from "../components/MobileLayout.tsx";

interface HomeData {
  events: Event[];
  user: AuthenticatedUser | null;
  isApproved: boolean;
}

export const handler: Handlers<HomeData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require authentication for all access
    if (!user) {
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/auth/login?message=" +
            encodeURIComponent(
              "Vous devez vous connecter pour accéder à cette page",
            ),
        },
      });
    }

    // Check if user is approved to see events
    const isApproved = hasPermission(req, "user");
    const upcomingEvents = isApproved ? getUpcomingEvents(6) : [];

    return ctx.render({ events: upcomingEvents, user, isApproved });
  },
};

export default function Home({ data }: PageProps<HomeData>) {
  const { events, user, isApproved } = data;

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

      {/* Pending Approval Message */}
      {!isApproved && user?.host_status === "pending" && (
        <section class="mb-6 sm:mb-8">
          <div class="card-elevated bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 animate-scale-in">
            <div class="text-center">
              <div class="text-4xl mb-4 animate-bounce-gentle">⏳</div>
              <h2 class="text-xl sm:text-2xl font-semibold text-amber-800 mb-4">
                Compte en attente d'approbation
              </h2>
              <p class="text-amber-700 mb-4 leading-relaxed">
                Votre compte a été créé avec succès ! Un administrateur doit
                approuver votre accès avant que vous puissiez voir les
                événements et participer à la communauté.
              </p>
              <p class="text-amber-600 text-sm">
                Vous recevrez une notification par email une fois votre compte
                approuvé.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events - Only for approved users */}
      {isApproved && (
        <section class="mb-6 sm:mb-8">
          <h2 class="text-xl sm:text-2xl font-semibold text-green-800 mb-4">
            Prochains Événements
          </h2>

          {events.length > 0
            ? (
              <div class="mobile-grid">
                {events.map((event, index) => {
                  const eventDate = new Date(event.date);
                  return (
                    <a
                      key={event.id}
                      href={`/events/${event.id}`}
                      class="card-interactive touch-manipulation animate-slide-up block hover:shadow-lg transition-shadow"
                      style={`animation-delay: ${index * 0.1}s`}
                    >
                      {/* Header with date badge and time */}
                      <div class="flex items-start justify-between mb-3">
                        <div class="badge-primary text-sm font-bold px-3 py-1.5 rounded-xl">
                          <div class="text-center">
                            <div class="text-xs leading-tight">
                              {eventDate.toLocaleDateString("fr-FR", {
                                month: "short",
                              }).toUpperCase()}
                            </div>
                            <div class="text-base leading-tight font-bold">
                              {eventDate.getDate()}
                            </div>
                          </div>
                        </div>
                        {event.time && (
                          <div class="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-lg">
                            {event.time}
                          </div>
                        )}
                      </div>

                      {/* Title with theme */}
                      <div class="flex items-start justify-between mb-3">
                        <h3 class="text-lg sm:text-xl font-semibold text-green-800 flex-1">
                          {event.title}
                        </h3>
                        {event.theme && (
                          <span class="badge-accent text-xs ml-2 shrink-0">
                            {event.theme}
                          </span>
                        )}
                      </div>

                      {/* Event details */}
                      <div class="space-y-2 mb-4 text-sm text-gray-600">
                        <p class="flex items-start">
                          <span class="mr-2 mt-0.5 flex-shrink-0 text-green-600">
                            📍
                          </span>
                          <span
                            class="break-words leading-tight"
                            title={event.location}
                          >
                            {event.location.length > 50
                              ? event.location.substring(0, 50) + "..."
                              : event.location}
                          </span>
                        </p>
                        <p class="flex items-center">
                          <span class="mr-2 flex-shrink-0 text-green-600">
                            🌱
                          </span>
                          <span class="truncate font-medium">
                            {event.host_name || "Hôte inconnu"}
                          </span>
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )
            : (
              <div class="card-elevated text-center animate-fade-in">
                <div class="text-6xl mb-4">🌱</div>
                <p class="text-gray-600 mb-4 leading-relaxed">
                  Aucun événement prévu pour le moment
                </p>
                <a
                  href="/host"
                  class="btn btn-primary inline-flex"
                >
                  <span class="mr-2">🌻</span>
                  Organiser un événement
                </a>
              </div>
            )}
        </section>
      )}
    </MobileLayout>
  );
}
