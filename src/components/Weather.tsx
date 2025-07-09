import {
  formatTemperature,
  getWeatherDescription,
  getWeatherIconUrl,
  WeatherForecast,
} from "../utils/weather.ts";

interface WeatherProps {
  weatherData: WeatherForecast | null;
  location: string;
  eventDate: string;
}

export default function Weather(
  { weatherData, location, eventDate }: WeatherProps,
) {
  if (!weatherData) {
    return (
      <div class="card-elevated">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span class="mr-2">🌤️</span>
          Météo pour {location}
        </h2>
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-4 rounded-lg text-center">
          <div class="text-4xl mb-2">⚠️</div>
          <p class="text-gray-600 mb-2">
            Impossible de récupérer les données météo pour {location}
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
        Météo pour {location}
      </h2>

      {/* Current Weather */}
      <div class="mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-3">
          Météo actuelle
        </h3>
        <div class="bg-gradient-to-r from-blue-50 to-sky-100 border border-blue-200 p-4 rounded-lg">
          <div class="flex items-center justify-between">
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
            <div class="text-right text-sm">
              <div class="bg-white/50 backdrop-blur-sm rounded-lg p-2 space-y-1">
                <p class="text-blue-700">💧 Humidité: {current.humidity}%</p>
                <p class="text-blue-700">🌪️ Vent: {current.windSpeed} m/s</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Day Forecast */}
      {eventForecast && (
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <span class="mr-2">📅</span>
            Météo prévue le jour de l'événement
          </h3>
          <div class="bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-300 p-4 rounded-lg shadow-garden">
            <div class="flex items-center justify-between">
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
              <div class="text-right text-sm">
                <div class="bg-white/50 backdrop-blur-sm rounded-lg p-2 space-y-1">
                  <p class="text-green-700">💧 {eventForecast.humidity}%</p>
                  <p class="text-green-700">🌪️ {eventForecast.windSpeed} m/s</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <span class="mr-2">📊</span>
            Prévisions 5 jours
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {forecast.map((item, index) => {
              const date = new Date(item.date);
              const isEventDay =
                date.toISOString().split("T")[0] === eventDateStr;

              return (
                <div
                  key={index}
                  class={`p-3 rounded-lg text-center transition-all duration-200 hover:scale-105 ${
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

      {/* Weather Tips */}
      <div class="bg-gradient-to-r from-amber-50 to-yellow-100 border border-amber-200 rounded-lg p-4">
        <h4 class="font-medium text-amber-800 mb-3 flex items-center">
          <span class="mr-2">💡</span>
          Conseils météo
        </h4>
        <ul class="text-sm text-amber-700 space-y-2">
          {eventForecast
            ? (
              <>
                {eventForecast.temperature < 10 && (
                  <li class="flex items-center">
                    <span class="mr-2">🧥</span>
                    Pensez à vous couvrir, il fera frais
                  </li>
                )}
                {eventForecast.temperature > 25 && (
                  <li class="flex items-center">
                    <span class="mr-2">☀️</span>
                    Protégez-vous du soleil et hydratez-vous
                  </li>
                )}
                {eventForecast.description.includes("rain") && (
                  <li class="flex items-center">
                    <span class="mr-2">☔</span>
                    Prévoyez un parapluie ou un abri
                  </li>
                )}
                {eventForecast.windSpeed > 5 && (
                  <li class="flex items-center">
                    <span class="mr-2">🌪️</span>
                    Attention au vent, sécurisez vos affaires
                  </li>
                )}
              </>
            )
            : <li class="flex items-center">
              <span class="mr-2">🌤️</span>
              Consultez la météo la veille de l'événement
            </li>}
        </ul>
      </div>
    </div>
  );
}
