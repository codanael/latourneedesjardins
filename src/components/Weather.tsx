import {
  formatTemperature,
  getWeatherDescription,
  getWeatherIconUrl,
  WeatherForecast,
} from "../utils/weather.ts";
import CollapsibleWeatherSection from "../islands/CollapsibleWeatherSection.tsx";

interface WeatherProps {
  weatherData: WeatherForecast | null;
  location: string;
  eventDate: string;
}

// Helper function to truncate location for mobile display
function truncateLocation(location: string): string {
  const parts = location.split(",");
  // Return city name or first meaningful part (skip numbers)
  return parts.find((part) => !part.trim().match(/^\d+/)) || parts[0];
}

export default function Weather(
  { weatherData, location, eventDate }: WeatherProps,
) {
  if (!weatherData) {
    return (
      <div class="card-elevated">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span class="mr-2">🌤️</span>
          Météo pour {truncateLocation(location)}
        </h2>
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-4 rounded-lg text-center">
          <div class="text-4xl mb-2">⚠️</div>
          <p class="text-gray-600 mb-2">
            Impossible de récupérer les données météo pour{" "}
            {truncateLocation(location)}
          </p>
          <p class="text-sm text-gray-500">
            Vérifiez votre connexion internet
          </p>
        </div>
      </div>
    );
  }

  const { current, forecast } = weatherData;
  const eventDateObj = new Date(eventDate);
  const eventDateStr = eventDateObj.toISOString().split("T")[0];

  // Find forecast for event date
  const eventForecast = forecast.find((item) => {
    const forecastDate = new Date(item.date).toISOString().split("T")[0];
    return forecastDate === eventDateStr;
  });

  return (
    <div class="card-elevated">
      <h2 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <span class="mr-2">🌤️</span>
        Météo pour {truncateLocation(location)}
      </h2>

      {/* Event Day Forecast */}
      {eventForecast && (
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <span class="mr-2">📅</span>
            Météo prévue le jour de l'événement
          </h3>
          <div class="bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-300 p-4 rounded-lg shadow-garden">
            <div class="flex items-center">
              <img
                src={getWeatherIconUrl(eventForecast.icon)}
                alt={eventForecast.description}
                class="w-16 h-16 mr-4"
              />
              <div>
                <p class="text-2xl font-bold text-green-800">
                  {formatTemperature(eventForecast.temperature)}
                </p>
                <p class="text-green-600 capitalize font-medium">
                  {getWeatherDescription(eventForecast.description)}
                </p>
                <p class="text-sm text-gray-600">
                  {eventDateObj.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Weather */}
      <CollapsibleWeatherSection
        title="Météo actuelle"
        icon="🌤️"
        isExpanded={false}
      >
        <div class="bg-gradient-to-r from-blue-50 to-sky-100 border border-blue-200 p-4 rounded-lg">
          <div class="flex items-center">
            <img
              src={getWeatherIconUrl(current.icon)}
              alt={current.description}
              class="w-16 h-16 mr-4"
            />
            <div>
              <p class="text-2xl font-bold text-blue-800">
                {formatTemperature(current.temperature)}
              </p>
              <p class="text-blue-600 capitalize">
                {getWeatherDescription(current.description)}
              </p>
            </div>
          </div>
        </div>
      </CollapsibleWeatherSection>

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <span class="mr-2">📊</span>
            Prévisions 5 jours
          </h3>
          <div class="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-x-visible">
            {forecast.map((item, index) => {
              const date = new Date(item.date);
              const isEventDay =
                date.toISOString().split("T")[0] === eventDateStr;

              return (
                <div
                  key={index}
                  class={`flex-shrink-0 w-24 p-3 rounded-lg text-center snap-center transition-all duration-200 touch-manipulation lg:w-auto lg:flex-shrink ${
                    isEventDay
                      ? "bg-gradient-to-b from-green-100 to-emerald-100 border-2 border-green-300 shadow-garden"
                      : "bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 hover:shadow-soft"
                  }`}
                >
                  <p class="text-sm font-medium text-gray-800 mb-1">
                    {date.toLocaleDateString("fr-FR", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <img
                    src={getWeatherIconUrl(item.icon)}
                    alt={item.description}
                    class="w-12 h-12 mx-auto my-2"
                  />
                  <p class="text-lg font-bold text-gray-800 mb-1">
                    {formatTemperature(item.temperature)}
                  </p>
                  <p class="text-xs text-gray-600 capitalize mb-1">
                    {getWeatherDescription(item.description)}
                  </p>
                  {isEventDay && (
                    <span class="badge-success text-xs">
                      📅 Événement
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
