import { Handlers, PageProps } from "$fresh/server.ts";
import { Event, getUpcomingEvents } from "../utils/db-operations.ts";
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
  hasPermission,
} from "../utils/session.ts";
import MobileLayout from "../components/MobileLayout.tsx";
import EventCard from "../components/EventCard.tsx";

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
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    style={`animation-delay: ${index * 0.1}s`}
                    class="animate-slide-up"
                  >
                    <EventCard
                      event={event}
                      variant="compact"
                    />
                  </div>
                ))}
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
