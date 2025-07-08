import { Handlers, PageProps } from "$fresh/server.ts";
import {
  Event,
  getEventsByHost,
  getEventStats,
} from "../../utils/db-operations.ts";
import { getAuthenticatedUser, hasPermission } from "../../utils/session.ts";
import MobileLayout from "../../components/MobileLayout.tsx";

interface EventWithStats extends Event {
  rsvp_stats: { response: string; count: number }[];
  potluck_count: number;
  total_rsvps: number;
}

interface DashboardData {
  events: EventWithStats[];
  hostName: string;
  user: ReturnType<typeof getAuthenticatedUser>;
}

export const handler: Handlers<DashboardData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require authentication
    if (!user) {
      return new Response("", {
        status: 302,
        headers: {
          "Location":
            "/auth/login?message=Vous devez vous connecter pour accéder au tableau de bord",
        },
      });
    }

    // Require approved host permissions
    if (!hasPermission(req, "approved_host")) {
      return new Response("", {
        status: 302,
        headers: {
          "Location":
            "/host?error=Vous devez être un hôte approuvé pour accéder à cette page",
        },
      });
    }

    const events = getEventsByHost(user.id);
    const eventsWithStats: EventWithStats[] = events.map((event) => {
      const stats = getEventStats(event.id);
      const totalRsvps = stats.rsvp_stats.reduce(
        (sum, stat) => sum + stat.count,
        0,
      );

      return {
        ...event,
        rsvp_stats: stats.rsvp_stats,
        potluck_count: stats.potluck_count,
        total_rsvps: totalRsvps,
      };
    });

    return ctx.render({ events: eventsWithStats, hostName: user.name, user });
  },
};

export default function HostDashboard({ data }: PageProps<DashboardData>) {
  const { events, hostName, user } = data;

  return (
    <MobileLayout
      user={user}
      currentPath="/host/dashboard"
      title={`Tableau de bord - ${hostName}`}
    >
      <div class="mb-4">
        <p class="text-gray-600 text-center">
          Gérez vos événements et consultez les réponses des participants
        </p>
      </div>

      {/* Events Dashboard */}
      <div class="space-y-6">
        {events.length === 0
          ? (
            <div class="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                Aucun événement
              </h2>
              <p class="text-gray-600 mb-6">
                Vous n'avez pas encore créé d'événement.
              </p>
              <a
                href="/host"
                class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Créer votre premier événement
              </a>
            </div>
          )
          : (
            events.map((event) => <EventCard key={event.id} event={event} />)
          )}
      </div>
    </MobileLayout>
  );
}

function EventCard({ event }: { event: EventWithStats }) {
  const yesCount = event.rsvp_stats.find((s) => s.response === "yes")?.count ||
    0;
  const noCount = event.rsvp_stats.find((s) => s.response === "no")?.count || 0;
  const maybeCount =
    event.rsvp_stats.find((s) => s.response === "maybe")?.count || 0;

  const isUpcoming = new Date(event.date) >= new Date();
  const isPast = new Date(event.date) < new Date();

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-green-800 mb-2">
            {event.title}
          </h3>
          <div class="flex flex-wrap gap-4 text-sm text-gray-600">
            <span class="flex items-center">
              📅 {new Date(event.date).toLocaleDateString("fr-FR")} à{" "}
              {event.time}
            </span>
            <span class="flex items-center">
              📍 {event.location}
            </span>
            {isPast && (
              <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                Événement passé
              </span>
            )}
            {isUpcoming && (
              <span class="bg-green-100 text-green-600 px-2 py-1 rounded text-xs">
                À venir
              </span>
            )}
          </div>
        </div>

        <div class="flex gap-2 mt-4 lg:mt-0">
          <a
            href={`/events/${event.id}`}
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Voir l'événement
          </a>
          <a
            href={`/events/${event.id}/edit`}
            class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            Modifier
          </a>
        </div>
      </div>

      {/* Statistics */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="bg-green-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{yesCount}</div>
          <div class="text-sm text-green-700">Participants confirmés</div>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-yellow-600">{maybeCount}</div>
          <div class="text-sm text-yellow-700">Peut-être</div>
        </div>

        <div class="bg-red-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-red-600">{noCount}</div>
          <div class="text-sm text-red-700">Absents</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">
            {event.potluck_count}
          </div>
          <div class="text-sm text-blue-700">Contributions potluck</div>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">
            {event.total_rsvps}
          </div>
          <div class="text-sm text-purple-700">Réponses totales</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
        <a
          href={`/host/attendees/${event.id}`}
          class="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
        >
          👥 Voir les participants
        </a>
        <a
          href={`/events/${event.id}/potluck`}
          class="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
        >
          🍽️ Gérer le potluck
        </a>
      </div>
    </div>
  );
}
