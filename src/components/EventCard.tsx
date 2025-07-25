interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  host_name?: string;
  theme?: string;
  rsvp_count?: number;
  max_attendees?: number;
}

interface EventCardProps {
  event: Event;
  variant?: "compact" | "detailed";
  showRSVPCount?: boolean;
}

export default function EventCard(
  { event, variant = "detailed", showRSVPCount = false }: EventCardProps,
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

  const truncateAddress = (address: string, maxLength = 80) => {
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + "...";
  };

  if (variant === "compact") {
    return (
      <a
        href={`/events/${event.id}`}
        class={`card-interactive touch-manipulation animate-fade-in block hover:shadow-lg transition-shadow ${
          isPastEvent ? "opacity-75" : ""
        }`}
      >
        {/* Header with date badge */}
        <div class="flex items-start justify-between mb-3">
          <div class="badge-primary text-sm font-bold px-3 py-1.5 rounded-xl">
            <div class="text-center">
              <div class="text-xs leading-tight">
                {eventDate.toLocaleDateString("fr-FR", { month: "short" })
                  .toUpperCase()}
              </div>
              <div class="text-base leading-tight font-bold">
                {eventDate.getDate()}
              </div>
            </div>
          </div>
          {event.time && (
            <div class="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-lg">
              {event.time}
            </div>
          )}
        </div>

        {/* Title with theme */}
        <div class="flex items-start justify-between mb-3">
          <h3 class="text-lg font-semibold text-green-800 line-clamp-2 flex-1">
            {event.title}
          </h3>
          {event.theme && (
            <span class="badge-accent text-xs ml-2 shrink-0">
              {event.theme}
            </span>
          )}
        </div>

        {/* Event details */}
        <div class="space-y-2 mb-4 text-sm text-gray-600">
          <p class="flex items-start">
            <span class="mr-2 mt-0.5 flex-shrink-0 text-green-600">📍</span>
            <span class="break-words leading-tight" title={event.location}>
              {truncateAddress(event.location, 50)}
            </span>
          </p>
          <p class="flex items-center">
            <span class="mr-2 flex-shrink-0 text-green-600">🌱</span>
            <span class="truncate font-medium">
              {event.host_name || "Hôte inconnu"}
            </span>
          </p>
        </div>

        {/* RSVP count */}
        {showRSVPCount && event.rsvp_count !== undefined && (
          <div class="flex items-center mb-3">
            <span class="badge-secondary text-xs">
              <span class="mr-1">👥</span>
              {event.rsvp_count} participant{event.rsvp_count !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </a>
    );
  }

  return (
    <a
      href={`/events/${event.id}`}
      class={`card-elevated touch-manipulation animate-slide-up block hover:shadow-xl transition-shadow ${
        isPastEvent ? "opacity-75" : ""
      }`}
    >
      <div class="flex flex-col">
        {/* Header with theme badge */}
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl sm:text-2xl font-bold text-green-800 flex-1 mr-2">
            {event.title}
          </h3>
          {event.theme && (
            <span class="badge-accent text-sm font-semibold px-3 py-1.5 rounded-xl flex-shrink-0">
              {event.theme}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div class="bg-garden-gradient p-4 rounded-lg mb-4">
            <p class="text-gray-700 text-sm sm:text-base line-clamp-3 leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        {/* Event details in enhanced grid */}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div class="space-y-3">
            <div class="flex items-center text-gray-600 text-sm sm:text-base bg-white p-3 rounded-lg shadow-inner-soft">
              <span class="mr-3 flex-shrink-0 text-lg">📅</span>
              <div>
                <div class="font-medium text-gray-800">
                  {formatDate(event.date)}
                </div>
                {event.time && (
                  <div class="text-sm text-gray-600">à {event.time}</div>
                )}
              </div>
            </div>

            <div class="flex items-start text-gray-600 text-sm sm:text-base bg-white p-3 rounded-lg shadow-inner-soft">
              <span class="mr-3 mt-0.5 flex-shrink-0 text-lg">📍</span>
              <div class="flex-1 break-words leading-tight">
                <div class="font-medium text-gray-800">Lieu</div>
                <div class="text-sm" title={event.location}>
                  {truncateAddress(event.location, 80)}
                </div>
              </div>
            </div>

            <div class="flex items-center text-gray-600 text-sm sm:text-base bg-white p-3 rounded-lg shadow-inner-soft">
              <span class="mr-3 flex-shrink-0 text-lg">🌱</span>
              <div>
                <div class="font-medium text-gray-800">Hôte</div>
                <div class="text-sm">{event.host_name || "Hôte inconnu"}</div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            {(showRSVPCount && event.rsvp_count !== undefined) ||
                event.max_attendees
              ? (
                <div class="flex items-center text-gray-600 text-sm sm:text-base bg-white p-3 rounded-lg shadow-inner-soft">
                  <span class="mr-3 flex-shrink-0 text-lg">👥</span>
                  <div>
                    <div class="font-medium text-gray-800">Participants</div>
                    <div class="text-sm">
                      {showRSVPCount ? (event.rsvp_count || 0) : ""}
                      {event.max_attendees
                        ? `${
                          showRSVPCount ? "/" : "Max "
                        }${event.max_attendees}`
                        : ""} participants
                    </div>
                  </div>
                </div>
              )
              : null}

            {isPastEvent && (
              <div class="badge-secondary px-3 py-2 text-center w-full">
                Événement passé
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
