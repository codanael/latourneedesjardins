import { Handlers, PageProps } from "$fresh/server.ts";
import {
  Event,
  getAllEvents,
  getEventStats,
} from "../../utils/db-operations.ts";
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
} from "../../utils/session.ts";
import MobileLayout from "../../components/MobileLayout.tsx";
import EventCard from "../../components/EventCard.tsx";

interface EventWithStats extends Event {
  rsvp_count: number;
}

interface EventsPageData {
  events: EventWithStats[];
  user: AuthenticatedUser;
}

export const handler: Handlers<EventsPageData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req)!; // Guaranteed by middleware

    // Authentication and permissions handled by middleware

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

    return ctx.render({ events: eventsWithStats, user });
  },
};

export default function EventsPage(
  { data }: PageProps<EventsPageData>,
) {
  const { events, user } = data;
  return (
    <MobileLayout
      user={user}
      currentPath="/events"
      title="Tous les Événements"
    >
      <div class="mb-6">
        <p class="text-green-600 text-center">
          Découvrez tous les jardins ouverts à la visite
        </p>
      </div>

      {/* Events List */}
      <section>
        {events.length > 0
          ? (
            <div class="space-y-4 sm:space-y-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="detailed"
                  showRsvpCount={true}
                />
              ))}
            </div>
          )
          : (
            <div class="text-center py-12">
              <div class="text-6xl mb-4">🌱</div>
              <p class="text-gray-500 text-lg mb-6">
                Aucun événement disponible pour le moment
              </p>
              <a
                href="/host"
                class="btn btn-primary inline-flex items-center"
              >
                <span class="mr-2">🌱</span>
                Organiser le premier événement
              </a>
            </div>
          )}
      </section>

      {/* Call to Action */}
      <section class="mt-12">
        <div class="card-elevated text-center">
          <div class="text-4xl mb-4">🌱</div>
          <h2 class="text-2xl font-bold text-green-800 mb-4">
            Envie d'organiser un événement ?
          </h2>
          <p class="text-green-700 mb-6">
            Partagez votre jardin avec la communauté et créez des moments
            inoubliables
          </p>
          <a
            href="/host"
            class="btn btn-primary inline-flex items-center"
          >
            <span class="mr-2">🌱</span>
            Devenir Hôte
          </a>
        </div>
      </section>
    </MobileLayout>
  );
}
