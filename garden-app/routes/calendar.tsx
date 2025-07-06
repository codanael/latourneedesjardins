import { Handlers, PageProps } from "$fresh/server.ts";
import { Event, getAllEvents } from "../utils/db-operations.ts";

export const handler: Handlers<Event[]> = {
  GET(_req, ctx) {
    const events = getAllEvents();
    return ctx.render(events);
  },
};

export default function CalendarPage({ data: events }: PageProps<Event[]>) {
  // Group events by month
  const eventsByMonth = events.reduce((acc, event) => {
    const date = new Date(event.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  return (
    <div class="min-h-screen bg-green-50">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <header class="text-center mb-8">
          <h1 class="text-3xl font-bold text-green-800 mb-2">
            Calendrier des Événements
          </h1>
          <p class="text-green-600">
            Planifiez vos visites de jardins
          </p>
        </header>

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
              Événements
            </a>
            <a
              href="/calendar"
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Calendrier
            </a>
            <a
              href="/host"
              class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Devenir Hôte
            </a>
          </div>
        </nav>

        {/* Calendar View */}
        <section>
          {Object.keys(eventsByMonth).length > 0
            ? (
              <div class="space-y-8">
                {Object.entries(eventsByMonth)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([monthKey, monthEvents]) => {
                    const [year, monthIndex] = monthKey.split("-");
                    const monthName = months[parseInt(monthIndex)];

                    return (
                      <div
                        key={monthKey}
                        class="bg-white rounded-lg shadow-md p-6"
                      >
                        <h2 class="text-2xl font-semibold text-green-800 mb-6">
                          {monthName} {year}
                        </h2>

                        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {monthEvents
                            .sort((a, b) =>
                              new Date(a.date).getTime() -
                              new Date(b.date).getTime()
                            )
                            .map((event) => (
                              <div
                                key={event.id}
                                class="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors"
                              >
                                <div class="flex items-start justify-between mb-2">
                                  <div class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                    {new Date(event.date).getDate()}
                                  </div>
                                  <div class="text-sm text-gray-600">
                                    {event.time}
                                  </div>
                                </div>

                                <h3 class="text-lg font-semibold text-green-800 mb-2">
                                  {event.title}
                                </h3>

                                <p class="text-sm text-gray-600 mb-2">
                                  📍 {event.location}
                                </p>

                                <p class="text-sm text-gray-600 mb-3">
                                  🌱 {event.host_name}
                                </p>

                                <a
                                  href={`/events/${event.id}`}
                                  class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                                >
                                  Voir détails
                                </a>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )
            : (
              <div class="bg-white rounded-lg shadow-md p-8 text-center">
                <p class="text-gray-600 mb-4">
                  Aucun événement planifié pour le moment
                </p>
                <a
                  href="/host"
                  class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Organiser un événement
                </a>
              </div>
            )}
        </section>

        {/* Quick Actions */}
        <section class="mt-12">
          <div class="bg-green-100 rounded-lg p-8 text-center">
            <h2 class="text-2xl font-semibold text-green-800 mb-4">
              Ajouter à votre calendrier
            </h2>
            <p class="text-green-700 mb-6">
              Synchronisez les événements avec votre calendrier personnel
            </p>
            <div class="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                📅 Google Calendar
              </button>
              <button
                type="button"
                class="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                📅 Outlook
              </button>
              <button
                type="button"
                class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                📅 iCal
              </button>
            </div>
            <p class="text-sm text-green-600 mt-4">
              Fonctionnalité à implémenter
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
