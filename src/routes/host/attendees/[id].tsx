import { Handlers, PageProps } from "$fresh/server.ts";
import {
  Event,
  getEventById,
  getRSVPsByEvent,
  RSVP,
} from "../../../utils/db-operations.ts";
import { getAuthenticatedUser, hasPermission } from "../../../utils/session.ts";
import AttendeeActions from "../../../islands/AttendeeActions.tsx";

interface AttendeesData {
  event: Event | null;
  rsvps: RSVP[];
  isHost: boolean;
}

export const handler: Handlers<AttendeesData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require authentication
    if (!user) {
      return new Response("", {
        status: 302,
        headers: {
          "Location":
            "/auth/login?message=Vous devez vous connecter pour voir les participants",
        },
      });
    }

    // Require approved host permissions
    if (!hasPermission(req, "approved_host")) {
      return new Response(
        "Forbidden - Seuls les hôtes approuvés peuvent voir les participants",
        {
          status: 403,
        },
      );
    }

    const eventId = parseInt(ctx.params.id);

    if (isNaN(eventId)) {
      return new Response("Invalid event ID", { status: 400 });
    }

    const event = getEventById(eventId);
    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    // Check if current user is the host of this specific event
    const isHost = user.id === event.host_id;

    if (!isHost && !hasPermission(req, "admin")) {
      return new Response(
        "Forbidden - Seuls les hôtes de cet événement peuvent voir les participants",
        {
          status: 403,
        },
      );
    }

    const rsvps = getRSVPsByEvent(eventId);

    return ctx.render({ event, rsvps, isHost });
  },
};

export default function AttendeesPage({ data }: PageProps<AttendeesData>) {
  const { event, rsvps } = data;

  if (!event) {
    return (
      <div class="min-h-screen bg-green-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-red-600 mb-4">
            Événement non trouvé
          </h1>
          <a href="/host/dashboard" class="text-green-600 hover:text-green-800">
            ← Retour au tableau de bord
          </a>
        </div>
      </div>
    );
  }

  const yesRsvps = rsvps.filter((r) => r.response === "yes");
  const noRsvps = rsvps.filter((r) => r.response === "no");
  const totalAttendees = yesRsvps.reduce(
    (total, rsvp) => total + 1 + (rsvp.plus_one ? 1 : 0),
    0,
  );

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
              href="/host/dashboard"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              ← Tableau de bord
            </a>
            <a
              href={`/events/${event.id}`}
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Voir l'événement
            </a>
          </div>
        </nav>

        {/* Event Header */}
        <header class="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 class="text-3xl font-bold text-green-800 mb-2">
            Participants - {event.title}
          </h1>
          <div class="text-gray-600">
            <p class="mb-1">
              📅 {new Date(event.date).toLocaleDateString("fr-FR")} à{" "}
              {event.time}
            </p>
            <p>📍 {event.location}</p>
          </div>
        </header>

        {/* Summary Stats */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <div class="text-3xl font-bold text-green-600">
              {yesRsvps.length}
            </div>
            <div class="text-sm text-green-700">Confirmés</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <div class="text-3xl font-bold text-blue-600">
              {totalAttendees}
            </div>
            <div class="text-sm text-blue-700">Total présents</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <div class="text-3xl font-bold text-red-600">{noRsvps.length}</div>
            <div class="text-sm text-red-700">Absents</div>
          </div>
          <div class="bg-white rounded-lg shadow-md p-6 text-center">
            <div class="text-3xl font-bold text-blue-600">{rsvps.length}</div>
            <div class="text-sm text-blue-700">Total réponses</div>
          </div>
        </div>

        {/* Attendees Lists */}
        <div class="space-y-8">
          {/* Confirmed Attendees */}
          <section class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-semibold text-green-800 mb-4 flex items-center">
              <span class="mr-2">✅</span>
              Participants confirmés ({yesRsvps.length})
            </h2>
            {yesRsvps.length > 0
              ? (
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yesRsvps.map((rsvp) => (
                    <AttendeCard
                      key={rsvp.id}
                      rsvp={rsvp}
                      variant="confirmed"
                    />
                  ))}
                </div>
              )
              : (
                <p class="text-gray-600 text-center py-8">
                  Aucun participant confirmé pour le moment
                </p>
              )}
          </section>

          {/* Declined Attendees */}
          {noRsvps.length > 0 && (
            <section class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-2xl font-semibold text-red-700 mb-4 flex items-center">
                <span class="mr-2">❌</span>
                Participants absents ({noRsvps.length})
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {noRsvps.map((rsvp) => (
                  <AttendeCard key={rsvp.id} rsvp={rsvp} variant="declined" />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Export/Contact Actions */}
        <div class="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            Actions
          </h3>
          <AttendeeActions
            emails={yesRsvps.map((rsvp: RSVP) => rsvp.user_email || "")}
          />
        </div>
      </div>
    </div>
  );
}

function AttendeCard(
  { rsvp, variant }: {
    rsvp: RSVP;
    variant: "confirmed" | "declined";
  },
) {
  const bgColor = {
    confirmed: "bg-green-50 border-green-200",
    declined: "bg-red-50 border-red-200",
  }[variant];

  const textColor = {
    confirmed: "text-green-800",
    declined: "text-red-800",
  }[variant];

  return (
    <div class={`p-4 rounded-lg border-2 ${bgColor}`}>
      <div
        class={`font-semibold ${textColor} mb-2 flex items-center justify-between`}
      >
        <span>{rsvp.user_name || "Utilisateur"}</span>
        {rsvp.response === "yes" && rsvp.plus_one && (
          <span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
            +1
          </span>
        )}
      </div>
      <div class="text-sm text-gray-600">
        Répondu le {new Date(rsvp.created_at).toLocaleDateString("fr-FR")}
      </div>
      {rsvp.updated_at !== rsvp.created_at && (
        <div class="text-xs text-gray-500 mt-1">
          Modifié le {new Date(rsvp.updated_at).toLocaleDateString("fr-FR")}
        </div>
      )}
    </div>
  );
}
