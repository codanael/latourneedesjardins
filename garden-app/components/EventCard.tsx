interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  host_name: string;
  theme?: string;
  rsvp_count?: number;
  max_attendees?: number;
}

interface EventCardProps {
  event: Event;
  variant?: "compact" | "detailed";
  showActions?: boolean;
  showRSVPCount?: boolean;
}

export default function EventCard(
  { event, variant = "detailed", showActions = true, showRSVPCount = false }:
    EventCardProps,
) {
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate >= new Date();
  const isPastEvent = !isUpcoming;

  const formatDate = (dateString: string, compact = false) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: compact ? "short" : "long",
      year: "numeric",
      month: compact ? "short" : "long",
      day: "numeric",
    });
  };

  if (variant === "compact") {
    return (
      <div
        class={`card touch-manipulation animate-fade-in ${
          isPastEvent ? "opacity-75" : ""
        }`}
      >
        <div class="flex items-start justify-between mb-3">
          <div class="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-semibold">
            {eventDate.getDate()}
          </div>
          {event.time && (
            <div class="text-sm text-gray-600 font-medium">
              {event.time}
            </div>
          )}
        </div>

        <h3 class="text-lg font-semibold text-green-800 mb-2 line-clamp-2">
          {event.title}
        </h3>

        <div class="space-y-1 mb-3 text-sm text-gray-600">
          <p class="flex items-start">
            <span class="mr-2 mt-0.5 flex-shrink-0">📍</span>
            <span class="break-words leading-tight">{event.location}</span>
          </p>
          <p class="flex items-center">
            <span class="mr-2 flex-shrink-0">🌱</span>
            <span class="truncate">{event.host_name}</span>
          </p>
        </div>

        {showRSVPCount && event.rsvp_count !== undefined && (
          <p class="text-xs text-gray-500 mb-3 flex items-center">
            <span class="mr-1">👥</span>
            {event.rsvp_count} participant{event.rsvp_count !== 1 ? "s" : ""}
          </p>
        )}

        {showActions && (
          <a
            href={`/events/${event.id}`}
            class="btn btn-primary text-sm w-full justify-center inline-flex"
            aria-label={`Voir détails de l'événement ${event.title}`}
          >
            Voir détails
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      class={`card touch-manipulation animate-slide-up ${
        isPastEvent ? "opacity-75" : ""
      }`}
    >
      <div class="flex flex-col">
        {/* Header */}
        <div class="flex justify-between items-start mb-3">
          <h3 class="text-xl sm:text-2xl font-semibold text-green-800 flex-1 mr-2">
            {event.title}
          </h3>
          {event.theme && (
            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex-shrink-0">
              {event.theme}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p class="text-gray-700 mb-4 text-sm sm:text-base line-clamp-3 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Event details */}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div class="space-y-2">
            <div class="flex items-center text-gray-600 text-sm sm:text-base">
              <span class="mr-2 flex-shrink-0">📅</span>
              <span class="flex-1">
                {formatDate(event.date)}
                {event.time && ` à ${event.time}`}
              </span>
            </div>
            <div class="flex items-start text-gray-600 text-sm sm:text-base">
              <span class="mr-2 mt-0.5 flex-shrink-0">📍</span>
              <span class="flex-1 break-words leading-tight">
                {event.location}
              </span>
            </div>
            <div class="flex items-center text-gray-600 text-sm sm:text-base">
              <span class="mr-2 flex-shrink-0">🌱</span>
              <span class="flex-1 truncate">Hôte: {event.host_name}</span>
            </div>
          </div>

          <div class="space-y-2">
            {(showRSVPCount && event.rsvp_count !== undefined) ||
                event.max_attendees
              ? (
                <div class="flex items-center text-gray-600 text-sm sm:text-base">
                  <span class="mr-2 flex-shrink-0">👥</span>
                  <span>
                    {showRSVPCount ? (event.rsvp_count || 0) : ""}
                    {event.max_attendees
                      ? `${showRSVPCount ? "/" : "Max "}${event.max_attendees}`
                      : ""} participants
                  </span>
                </div>
              )
              : null}

            {isPastEvent && (
              <span class="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                Événement passé
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div class="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
            <a
              href={`/events/${event.id}`}
              class="btn btn-primary flex-1 justify-center inline-flex"
              aria-label={`Voir détails de l'événement ${event.title}`}
            >
              <span class="mr-2">👁️</span>
              Voir détails
              {isUpcoming && <span class="ml-2 text-xs">(+ RSVP)</span>}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
