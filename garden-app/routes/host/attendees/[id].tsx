import { Handlers, PageProps } from "$fresh/server.ts";
import {
  Event,
  getEventById,
  getRSVPsByEvent,
  getUserByEmail,
  RSVP,
} from "../../../utils/db-operations.ts";

interface AttendeesData {
  event: Event | null;
  rsvps: RSVP[];
  isHost: boolean;
}

export const handler: Handlers<AttendeesData> = {
  GET(_req, ctx) {
    const eventId = parseInt(ctx.params.id);

    if (isNaN(eventId)) {
      return new Response("Invalid event ID", { status: 400 });
    }

    const event = getEventById(eventId);
    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    // Check if current user is the host
    // For now, using demo user
    const demoEmail = "demo@example.com";
    const user = getUserByEmail(demoEmail);
    const isHost = user ? user.id === event.host_id : false;

    if (!isHost) {
      return new Response("Unauthorized - Only hosts can view attendees", {
        status: 403,
      });
    }

    const rsvps = getRSVPsByEvent(eventId);

    return ctx.render({ event, rsvps, isHost });
  },
};

export default function AttendeesPage({ data }: PageProps<AttendeesData>) {
  const { event, rsvps, isHost } = data;

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
  const maybeRsvps = rsvps.filter((r) => r.response === "maybe");
  const noRsvps = rsvps.filter((r) => r.response === "no");

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
            <div class="text-3xl font-bold text-yellow-600">
              {maybeRsvps.length}
            </div>
            <div class="text-sm text-yellow-700">Peut-être</div>
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

          {/* Maybe Attendees */}
          {maybeRsvps.length > 0 && (
            <section class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-2xl font-semibold text-yellow-700 mb-4 flex items-center">
                <span class="mr-2">🤔</span>
                Participants incertains ({maybeRsvps.length})
              </h2>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maybeRsvps.map((rsvp) => (
                  <AttendeCard key={rsvp.id} rsvp={rsvp} variant="maybe" />
                ))}
              </div>
            </section>
          )}

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
          <div class="flex flex-wrap gap-4">
            <button
              type="button"
              onclick="window.print()"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              📄 Imprimer la liste
            </button>
            <button
              type="button"
              onclick="copyEmailList()"
              class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              📧 Copier les emails
            </button>
          </div>
        </div>
      </div>

      {/* Hidden email list for copying */}
      <div id="email-list" class="hidden">
        {yesRsvps.map((rsvp) => rsvp.user_name).join(", ")}
      </div>

      <script>
        {`
          function copyEmailList() {
            const emailList = document.getElementById('email-list');
            if (emailList) {
              navigator.clipboard.writeText(emailList.textContent)
                .then(() => {
                  alert('Liste des participants copiée dans le presse-papiers!');
                })
                .catch(() => {
                  alert('Erreur lors de la copie');
                });
            }
          }
        `}
      </script>
    </div>
  );
}

function AttendeCard(
  { rsvp, variant }: {
    rsvp: RSVP;
    variant: "confirmed" | "maybe" | "declined";
  },
) {
  const bgColor = {
    confirmed: "bg-green-50 border-green-200",
    maybe: "bg-yellow-50 border-yellow-200",
    declined: "bg-red-50 border-red-200",
  }[variant];

  const textColor = {
    confirmed: "text-green-800",
    maybe: "text-yellow-800",
    declined: "text-red-800",
  }[variant];

  return (
    <div class={`p-4 rounded-lg border-2 ${bgColor}`}>
      <div class={`font-semibold ${textColor} mb-2`}>
        {rsvp.user_name || "Utilisateur"}
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
