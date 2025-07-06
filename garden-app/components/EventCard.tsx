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
}

export default function EventCard({ event, variant = "detailed", showActions = true }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (variant === "compact") {
    return (
      <div class="border border-green-200 rounded-lg p-4 hover:bg-green-50 transition-colors">
        <div class="flex items-start justify-between mb-2">
          <div class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
            {new Date(event.date).getDate()}
          </div>
          {event.time && (
            <div class="text-sm text-gray-600">
              {event.time}
            </div>
          )}
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
        
        {showActions && (
          <a 
            href={`/events/${event.id}`}
            class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
          >
            Voir détails
          </a>
        )}
      </div>
    );
  }

  return (
    <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div class="flex flex-col md:flex-row md:justify-between md:items-start">
        <div class="flex-1">
          <h3 class="text-2xl font-semibold text-green-800 mb-2">
            {event.title}
          </h3>
          
          {event.description && (
            <p class="text-gray-700 mb-4">
              {event.description}
            </p>
          )}
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-gray-600 mb-1">
                📅 {formatDate(event.date)}
                {event.time && ` à ${event.time}`}
              </p>
              <p class="text-gray-600 mb-1">
                📍 {event.location}
              </p>
              <p class="text-gray-600">
                🌱 Hôte: {event.host_name}
              </p>
            </div>
            <div>
              {event.theme && (
                <p class="text-gray-600 mb-1">
                  🎨 Thème: {event.theme}
                </p>
              )}
              {(event.rsvp_count !== undefined || event.max_attendees) && (
                <p class="text-gray-600">
                  👥 {event.rsvp_count || 0}
                  {event.max_attendees ? `/${event.max_attendees}` : ''} participants
                </p>
              )}
            </div>
          </div>
        </div>
        
        {showActions && (
          <div class="flex flex-col gap-2 md:ml-6">
            <a 
              href={`/events/${event.id}`}
              class="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
            >
              Voir détails
            </a>
            <a 
              href={`/events/${event.id}/rsvp`}
              class="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center"
            >
              RSVP
            </a>
          </div>
        )}
      </div>
    </div>
  );
}