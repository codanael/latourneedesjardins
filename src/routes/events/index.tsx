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
import FilteredEventsList from "../../islands/FilteredEventsList.tsx";

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

      {/* Events List with Search and Filters */}
      <FilteredEventsList initialEvents={events} />

      {/* Quick Actions */}
      <section class="mt-12">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="card-elevated text-center">
            <div class="text-4xl mb-4">🌱</div>
            <h2 class="text-xl font-bold text-green-800 mb-4">
              Organiser un événement
            </h2>
            <p class="text-green-700 mb-6 text-sm">
              Partagez votre jardin avec la communauté
            </p>
            <a
              href="/host"
              class="btn btn-primary inline-flex items-center"
            >
              <span class="mr-2">🌱</span>
              Devenir Hôte
            </a>
          </div>

          <div class="card-elevated text-center">
            <div class="text-4xl mb-4">📅</div>
            <h2 class="text-xl font-bold text-green-800 mb-4">
              Vue calendrier
            </h2>
            <p class="text-green-700 mb-6 text-sm">
              Visualisez tous les événements par date
            </p>
            <a
              href="/calendar"
              class="btn btn-secondary inline-flex items-center"
            >
              <span class="mr-2">📅</span>
              Voir le calendrier
            </a>
          </div>
        </div>
      </section>
    </MobileLayout>
  );
}
