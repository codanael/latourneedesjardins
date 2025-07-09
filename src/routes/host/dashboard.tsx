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
            <div class="card-elevated text-center animate-fade-in">
              <div class="text-6xl mb-4">🌱</div>
              <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                Aucun événement
              </h2>
              <p class="text-gray-600 mb-6 leading-relaxed">
                Vous n'avez pas encore créé d'événement. Commencez par partager votre jardin avec la communauté !
              </p>
              <a
                href="/host"
                class="btn btn-primary inline-flex"
              >
                <span class="mr-2">🌻</span>
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
    <div class="card-elevated animate-slide-up">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div class="flex-1">
          <div class="flex items-start justify-between mb-3">
            <h3 class="text-xl font-bold text-green-800 flex-1">
              {event.title}
            </h3>
            {event.theme && (
              <span class="badge-accent text-sm font-semibold px-3 py-1.5 rounded-xl flex-shrink-0 ml-2">
                {event.theme}
              </span>
            )}
          </div>
          <div class="flex flex-wrap gap-3 text-sm text-gray-600">
            <span class="flex items-center bg-gray-50 px-3 py-1 rounded-lg">
              <span class="mr-2 text-green-600">📅</span>
              {new Date(event.date).toLocaleDateString("fr-FR")} à{" "}
              {event.time}
            </span>
            <span class="flex items-center bg-gray-50 px-3 py-1 rounded-lg">
              <span class="mr-2 text-green-600">📍</span>
              {event.location}
            </span>
            {isPast && (
              <span class="badge-secondary">
                Événement passé
              </span>
            )}
            {isUpcoming && (
              <span class="badge-success">
                À venir
              </span>
            )}
          </div>
        </div>

        <div class="flex gap-2 mt-4 lg:mt-0">
          <a
            href={`/events/${event.id}`}
            class="btn btn-primary text-sm"
          >
            <span class="mr-1">👁️</span>
            Voir l'événement
          </a>
          <a
            href={`/events/${event.id}/edit`}
            class="btn btn-accent text-sm"
          >
            <span class="mr-1">✏️</span>
            Modifier
          </a>
        </div>
      </div>

      {/* Statistics */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="metric-card bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 hover:shadow-garden transition-all duration-200">
          <div class="metric-value text-green-700">{yesCount}</div>
          <div class="metric-label text-green-600">Participants confirmés</div>
          <div class="text-xs text-green-500 mt-1">✓ Présents</div>
        </div>

        <div class="metric-card bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 hover:shadow-accent transition-all duration-200">
          <div class="metric-value text-amber-700">{maybeCount}</div>
          <div class="metric-label text-amber-600">Peut-être</div>
          <div class="text-xs text-amber-500 mt-1">? Incertains</div>
        </div>

        <div class="metric-card bg-gradient-to-br from-red-50 to-rose-100 border border-red-200 hover:shadow-soft transition-all duration-200">
          <div class="metric-value text-red-700">{noCount}</div>
          <div class="metric-label text-red-600">Absents</div>
          <div class="text-xs text-red-500 mt-1">✗ Ne viennent pas</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="metric-card bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-200 hover:shadow-soft transition-all duration-200">
          <div class="metric-value text-blue-700">
            {event.potluck_count}
          </div>
          <div class="metric-label text-blue-600">Contributions potluck</div>
          <div class="text-xs text-blue-500 mt-1">🍽️ Plats apportés</div>
        </div>

        <div class="metric-card bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 hover:shadow-soft transition-all duration-200">
          <div class="metric-value text-purple-700">
            {event.total_rsvps}
          </div>
          <div class="metric-label text-purple-600">Réponses totales</div>
          <div class="text-xs text-purple-500 mt-1">📊 Total des réponses</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
        <a
          href={`/host/attendees/${event.id}`}
          class="btn btn-ghost text-sm"
        >
          <span class="mr-1">👥</span>
          Voir les participants
        </a>
        <a
          href={`/events/${event.id}/potluck`}
          class="btn btn-ghost text-sm"
        >
          <span class="mr-1">🍽️</span>
          Gérer le potluck
        </a>
      </div>
    </div>
  );
}
