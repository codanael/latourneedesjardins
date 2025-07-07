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
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold text-green-800 mb-4">
          Météo prévue
        </h2>
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <p class="text-gray-600">
            ⚠️ Impossible de récupérer les données météo pour {location}
          </p>
          <p class="text-sm text-gray-500 mt-2">
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
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-semibold text-green-800 mb-4">
        Météo pour {location}
      </h2>

      {/* Current Weather */}
      <div class="mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-3">
          Météo actuelle
        </h3>
        <div class="bg-blue-50 p-4 rounded-lg">
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
            <div class="text-right text-sm text-gray-600">
              <p>💧 Humidité: {current.humidity}%</p>
              <p>🌪️ Vent: {current.windSpeed} m/s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Day Forecast */}
      {eventForecast && (
        <div class="mb-6">
          <h3 class="text-lg font-medium text-gray-800 mb-3">
            Météo prévue le jour de l'événement
          </h3>
          <div class="bg-green-50 p-4 rounded-lg border-2 border-green-200">
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
                  <p class="text-green-600 capitalize">
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
              <div class="text-right text-sm text-gray-600">
                <p>💧 {eventForecast.humidity}%</p>
                <p>🌪️ {eventForecast.windSpeed} m/s</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <div>
          <h3 class="text-lg font-medium text-gray-800 mb-3">
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
                  class={`p-3 rounded-lg text-center ${
                    isEventDay
                      ? "bg-green-100 border-2 border-green-300"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <p class="text-sm font-medium text-gray-800">
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
                  <p class="text-lg font-bold text-gray-800">
                    {formatTemperature(item.temperature)}
                  </p>
                  <p class="text-xs text-gray-600 capitalize">
                    {getWeatherDescription(item.description)}
                  </p>
                  {isEventDay && (
                    <p class="text-xs text-green-600 font-medium mt-1">
                      📅 Événement
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weather Tips */}
      <div class="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
        <h4 class="font-medium text-yellow-800 mb-2">
          💡 Conseils météo
        </h4>
        <ul class="text-sm text-yellow-700 space-y-1">
          {eventForecast
            ? (
              <>
                {eventForecast.temperature < 10 && (
                  <li>🧥 Pensez à vous couvrir, il fera frais</li>
                )}
                {eventForecast.temperature > 25 && (
                  <li>☀️ Protégez-vous du soleil et hydratez-vous</li>
                )}
                {eventForecast.description.includes("rain") && (
                  <li>☔ Prévoyez un parapluie ou un abri</li>
                )}
                {eventForecast.windSpeed > 5 && (
                  <li>🌪️ Attention au vent, sécurisez vos affaires</li>
                )}
              </>
            )
            : <li>🌤️ Consultez la météo la veille de l'événement</li>}
        </ul>
      </div>
    </div>
  );
}
