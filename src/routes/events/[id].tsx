import { Handlers, PageProps } from "$fresh/server.ts";
import {
  Event,
  getEventById,
  getPotluckItemsByEvent,
  getRSVPsByEvent,
  getUserRSVP,
  PotluckItem,
  RSVP,
} from "../../utils/db-operations.ts";
import {
  AuthenticatedUser,
  getAuthenticatedUser,
} from "../../utils/session.ts";
import { getWeatherForEvent } from "../../utils/cached-weather.ts";
import { WeatherForecast } from "../../utils/weather.ts";
import CachedPotluckManager from "../../islands/CachedPotluckManager.tsx";
import ParticipantsList from "../../islands/ParticipantsList.tsx";
import Weather from "../../components/Weather.tsx";
import CachedRSVPButton from "../../islands/CachedRSVPButton.tsx";

interface EventPageData {
  event: Event | null;
  rsvps: RSVP[];
  potluckItems: PotluckItem[];
  currentUserRsvp: RSVP | null;
  currentUser: AuthenticatedUser;
  weatherData: WeatherForecast | null;
}

export const handler: Handlers<EventPageData> = {
  async GET(req, ctx) {
    const user = getAuthenticatedUser(req)!; // Guaranteed by middleware

    // Authentication and permissions handled by middleware

    const id = parseInt(ctx.params.id);

    if (isNaN(id)) {
      return new Response("Invalid event ID", { status: 400 });
    }

    const event = getEventById(id);

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    const rsvps = getRSVPsByEvent(id);
    const potluckItems = getPotluckItemsByEvent(id);

    // Get current user's RSVP
    const currentUserRsvp = getUserRSVP(id, user.id);

    // Get weather data for event using coordinates if available
    const weatherData = await getWeatherForEvent(event);

    return ctx.render({
      event,
      rsvps,
      potluckItems,
      currentUserRsvp,
      currentUser: user,
      weatherData,
    });
  },
};

export default function EventDetailPage({ data }: PageProps<EventPageData>) {
  const {
    event,
    rsvps,
    potluckItems,
    currentUserRsvp,
    currentUser,
    weatherData,
  } = data;

  if (!event) {
    return (
      <div class="min-h-screen bg-garden-gradient flex items-center justify-center">
        <div class="card-elevated text-center max-w-md mx-4 animate-scale-in">
          <div class="text-6xl mb-4">😕</div>
          <h1 class="text-2xl font-bold text-red-600 mb-4">
            Événement non trouvé
          </h1>
          <p class="text-gray-600 mb-6">
            L'événement que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <a href="/events" class="btn btn-primary inline-flex">
            ← Retour aux événements
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-garden-gradient">
      <div class="container mx-auto px-4 py-8">
        {/* Navigation */}
        <nav class="mb-8">
          <div class="flex flex-wrap justify-center gap-4">
            <a
              href="/"
              class="btn btn-secondary"
            >
              <span class="mr-1">🏠</span>
              Accueil
            </a>
            <a
              href="/events"
              class="btn btn-secondary"
            >
              <span class="mr-1">🌻</span>
              ← Tous les événements
            </a>
            <a
              href="/calendar"
              class="btn btn-secondary"
            >
              <span class="mr-1">📅</span>
              Calendrier
            </a>
          </div>
        </nav>

        {/* Event Header */}
        <header class="card-elevated mb-8 animate-fade-in">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-green-800 mb-2">
                {event.title}
              </h1>
              {event.theme && (
                <span class="badge-accent text-lg font-semibold px-4 py-2 rounded-xl inline-block">
                  {event.theme}
                </span>
              )}
            </div>
            <div class="mt-4 md:mt-0">
              <a
                href={`/events/${event.id}/edit`}
                class="btn btn-accent inline-flex"
              >
                <span class="mr-1">✏️</span>
                Modifier l'événement
              </a>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-4">
                Détails de l'événement
              </h3>
              <div class="space-y-3">
                <div class="flex items-center bg-gray-50 p-3 rounded-lg">
                  <span class="mr-3 text-lg text-green-600">📅</span>
                  <div>
                    <div class="font-medium text-gray-800">
                      {new Date(event.date).toLocaleDateString("fr-FR")}
                    </div>
                    <div class="text-sm text-gray-600">à {event.time}</div>
                  </div>
                </div>
                <div class="flex items-start bg-gray-50 p-3 rounded-lg">
                  <span class="mr-3 mt-0.5 text-lg text-green-600">📍</span>
                  <div>
                    <div class="font-medium text-gray-800">Lieu</div>
                    <div class="text-sm text-gray-600">{event.location}</div>
                  </div>
                </div>
                <div class="flex items-center bg-gray-50 p-3 rounded-lg">
                  <span class="mr-3 text-lg text-green-600">🌱</span>
                  <div>
                    <div class="font-medium text-gray-800">Hôte</div>
                    <div class="text-sm text-gray-600">{event.host_name}</div>
                  </div>
                </div>
                {event.max_attendees && (
                  <div class="flex items-center bg-gray-50 p-3 rounded-lg">
                    <span class="mr-3 text-lg text-green-600">👥</span>
                    <div>
                      <div class="font-medium text-gray-800">Places disponibles</div>
                      <div class="text-sm text-gray-600">{event.max_attendees} participants max</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-4">
                Description
              </h3>
              <div class="bg-garden-gradient p-4 rounded-lg">
                <p class="text-gray-700 leading-relaxed">
                  {event.description}
                </p>
              </div>

              {event.special_instructions && (
                <div class="mt-4 bg-gradient-to-r from-amber-50 to-yellow-100 border border-amber-200 rounded-lg p-4">
                  <h4 class="font-semibold text-amber-800 mb-2 flex items-center">
                    <span class="mr-2">💡</span>
                    Instructions spéciales
                  </h4>
                  <p class="text-amber-700">{event.special_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div class="space-y-8">
            {/* RSVP Section */}
            <section id="rsvp" class="card-elevated animate-slide-up">
              <h2 class="text-xl font-semibold text-gray-800 mb-4">
                Votre participation
              </h2>
              <CachedRSVPButton
                eventId={event.id}
                currentResponse={currentUserRsvp?.response}
              />
            </section>

            {/* Participants List */}
            <div class="animate-slide-up" style="animation-delay: 0.1s">
              <ParticipantsList
                eventId={event.id}
                initialParticipants={rsvps}
              />
            </div>
          </div>

          {/* Right Column - Potluck List */}
          <div class="animate-slide-up" style="animation-delay: 0.2s">
            <CachedPotluckManager
              eventId={event.id}
              currentUserId={currentUser?.id}
              initialItems={potluckItems}
            />
          </div>
        </div>

        {/* Weather Section */}
        <section class="mt-8 animate-slide-up" style="animation-delay: 0.3s">
          <Weather
            weatherData={weatherData}
            location={event.location}
            eventDate={event.date}
          />
        </section>
      </div>
    </div>
  );
}
