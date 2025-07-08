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
      <div class="min-h-screen bg-green-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-red-600 mb-4">
            Événement non trouvé
          </h1>
          <a href="/events" class="text-green-600 hover:text-green-800">
            ← Retour aux événements
          </a>
        </div>
      </div>
    );
  }

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
              href="/events"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              ← Tous les événements
            </a>
            <a
              href="/calendar"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Calendrier
            </a>
          </div>
        </nav>

        {/* Event Header */}
        <header class="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 class="text-3xl font-bold text-green-800 mb-4">
            {event.title}
          </h1>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                Détails de l'événement
              </h3>
              <p class="text-gray-600 mb-2">
                📅 {new Date(event.date).toLocaleDateString("fr-FR")} à{" "}
                {event.time}
              </p>
              <p class="text-gray-600 mb-2">
                📍 {event.location}
              </p>
              <p class="text-gray-600 mb-2">
                🌱 Hôte: {event.host_name}
              </p>
              {event.theme && (
                <p class="text-gray-600 mb-2">
                  🎨 Thème: {event.theme}
                </p>
              )}
              {event.max_attendees && (
                <p class="text-gray-600">
                  👥 Places disponibles: {event.max_attendees}
                </p>
              )}
            </div>

            <div class="flex flex-col justify-center">
              <a
                href={`/events/${event.id}/edit`}
                class="block w-full bg-orange-500 text-white text-center px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                ✏️ Modifier l'événement
              </a>
            </div>
          </div>

          <div class="border-t pt-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Description
            </h3>
            <p class="text-gray-700 mb-4">
              {event.description}
            </p>

            {event.special_instructions && (
              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h4 class="font-semibold text-yellow-800 mb-1">
                  Instructions spéciales
                </h4>
                <p class="text-yellow-700">{event.special_instructions}</p>
              </div>
            )}
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div class="space-y-8">
            {/* RSVP Section */}
            <section id="rsvp" class="bg-white rounded-lg shadow-md p-6">
              <CachedRSVPButton
                eventId={event.id}
                currentResponse={currentUserRsvp?.response}
              />
            </section>

            {/* Participants List */}
            <ParticipantsList
              eventId={event.id}
              initialParticipants={rsvps}
            />
          </div>

          {/* Right Column - Potluck List */}
          <div>
            <CachedPotluckManager
              eventId={event.id}
              currentUserId={currentUser?.id}
              initialItems={potluckItems}
            />
          </div>
        </div>

        {/* Weather Section */}
        <section class="mt-8">
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
