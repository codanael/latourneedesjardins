import { Handlers, PageProps } from "$fresh/server.ts";
import { Event, getAllEvents } from "../utils/db-operations.ts";

interface CalendarData {
  events: Event[];
  currentMonth: number;
  currentYear: number;
}

export const handler: Handlers<CalendarData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const currentDate = new Date();
    const currentMonth = parseInt(
      url.searchParams.get("month") || currentDate.getMonth().toString(),
    );
    const currentYear = parseInt(
      url.searchParams.get("year") || currentDate.getFullYear().toString(),
    );

    const events = getAllEvents();
    return ctx.render({ events, currentMonth, currentYear });
  },
};

export default function CalendarPage({ data }: PageProps<CalendarData>) {
  const { events, currentMonth, currentYear } = data;

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

  const weekdays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  // Get events for current month
  const monthEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth &&
      eventDate.getFullYear() === currentYear;
  });

  // Group events by day
  const eventsByDay = monthEvents.reduce((acc, event) => {
    const day = new Date(event.date).getDate();
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(event);
    return acc;
  }, {} as Record<number, Event[]>);

  // Calculate calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous month navigation
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Next month navigation
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  // Generate calendar days
  const calendarDays = [];

  // Previous month's trailing days
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isPrevMonth: true,
      events: [],
    });
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isPrevMonth: false,
      events: eventsByDay[day] || [],
    });
  }

  // Next month's leading days to fill the grid
  const remainingCells = 42 - calendarDays.length; // 6 weeks × 7 days
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isPrevMonth: false,
      events: [],
    });
  }

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

        {/* Calendar Navigation */}
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center justify-between">
            <a
              href={`/calendar?month=${prevMonth}&year=${prevYear}`}
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              ← Mois précédent
            </a>

            <h2 class="text-2xl font-semibold text-green-800">
              {months[currentMonth]} {currentYear}
            </h2>

            <a
              href={`/calendar?month=${nextMonth}&year=${nextYear}`}
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Mois suivant →
            </a>
          </div>
        </div>

        {/* Calendar Grid */}
        <section class="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Weekday Headers */}
          <div class="grid grid-cols-7 gap-2 mb-4">
            {weekdays.map((day) => (
              <div
                key={day}
                class="text-center font-semibold text-gray-700 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div class="grid grid-cols-7 gap-2">
            {calendarDays.map((dayData, index) => (
              <CalendarDay key={index} dayData={dayData} />
            ))}
          </div>
        </section>

        {/* Events List for Current Month */}
        <section class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-semibold text-green-800 mb-4">
            Événements de {months[currentMonth]} {currentYear}
          </h3>

          {monthEvents.length > 0
            ? (
              <div class="space-y-4">
                {monthEvents
                  .sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      class="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors"
                    >
                      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div class="flex-1">
                          <h4 class="text-lg font-semibold text-green-800 mb-1">
                            {event.title}
                          </h4>
                          <div class="text-sm text-gray-600 space-y-1">
                            <p>
                              📅{" "}
                              {new Date(event.date).toLocaleDateString("fr-FR")}
                              {" "}
                              à {event.time}
                            </p>
                            <p>📍 {event.location}</p>
                            <p>🌱 {event.host_name}</p>
                          </div>
                        </div>
                        <div class="mt-3 md:mt-0">
                          <a
                            href={`/events/${event.id}`}
                            class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            Voir détails
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )
            : (
              <p class="text-gray-600 text-center py-8">
                Aucun événement prévu pour ce mois
              </p>
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

function CalendarDay(
  { dayData }: {
    dayData: {
      day: number;
      isCurrentMonth: boolean;
      isPrevMonth: boolean;
      events: Event[];
    };
  },
) {
  const today = new Date();
  const isToday = dayData.isCurrentMonth &&
    dayData.day === today.getDate() &&
    today.getMonth() === new Date().getMonth() &&
    today.getFullYear() === new Date().getFullYear();

  const dayClass = `
    min-h-[120px] p-2 border border-gray-200 rounded-lg transition-colors
    ${
    dayData.isCurrentMonth
      ? (isToday
        ? "bg-green-100 border-green-300"
        : "bg-white hover:bg-gray-50")
      : "bg-gray-50 text-gray-400"
  }
  `;

  return (
    <div class={dayClass}>
      <div
        class={`text-sm font-medium mb-2 ${isToday ? "text-green-800" : ""}`}
      >
        {dayData.day}
      </div>

      <div class="space-y-1">
        {dayData.events.slice(0, 3).map((event) => (
          <a
            key={event.id}
            href={`/events/${event.id}`}
            class="block text-xs bg-green-200 text-green-800 px-2 py-1 rounded truncate hover:bg-green-300 transition-colors"
            title={`${event.title} - ${event.time}`}
          >
            {event.title}
          </a>
        ))}

        {dayData.events.length > 3 && (
          <div class="text-xs text-gray-600 text-center">
            +{dayData.events.length - 3} autres
          </div>
        )}
      </div>
    </div>
  );
}
