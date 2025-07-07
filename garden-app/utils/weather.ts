import { validateEnv } from "./env.ts";

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  date: string;
}

export interface WeatherForecast {
  current: WeatherData;
  forecast: WeatherData[];
}

export interface LocationCoords {
  lat: number;
  lon: number;
}

// Get coordinates for a location using OpenWeatherMap Geocoding API
export async function getLocationCoords(
  location: string,
): Promise<LocationCoords | null> {
  try {
    const env = validateEnv();
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${
        encodeURIComponent(location)
      }&limit=1&appid=${env.WEATHER_API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      lat: data[0].lat,
      lon: data[0].lon,
    };
  } catch (error) {
    console.error("Error fetching location coordinates:", error);
    return null;
  }
}

// Get current weather for coordinates
export async function getCurrentWeather(
  lat: number,
  lon: number,
): Promise<WeatherData | null> {
  try {
    const env = validateEnv();
    const response = await fetch(
      `${env.WEATHER_API_URL}/weather?lat=${lat}&lon=${lon}&appid=${env.WEATHER_API_KEY}&units=metric&lang=fr`,
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching current weather:", error);
    return null;
  }
}

// Get 5-day weather forecast for coordinates
export async function getWeatherForecast(
  lat: number,
  lon: number,
): Promise<WeatherData[]> {
  try {
    const env = validateEnv();
    const response = await fetch(
      `${env.WEATHER_API_URL}/forecast?lat=${lat}&lon=${lon}&appid=${env.WEATHER_API_KEY}&units=metric&lang=fr`,
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Process forecast data - take one forecast per day at midday
    const dailyForecasts: WeatherData[] = [];
    const processedDates = new Set<string>();

    for (const item of data.list) {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().split("T")[0];

      // Skip if we already have a forecast for this day
      if (processedDates.has(dateStr)) {
        continue;
      }

      // Only take forecasts around midday (12:00 or closest)
      const hour = date.getHours();
      if (hour >= 11 && hour <= 13) {
        dailyForecasts.push({
          temperature: Math.round(item.main.temp),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          date: date.toISOString(),
        });
        processedDates.add(dateStr);
      }

      // Limit to 5 days
      if (dailyForecasts.length >= 5) {
        break;
      }
    }

    return dailyForecasts;
  } catch (error) {
    console.error("Error fetching weather forecast:", error);
    return [];
  }
}

// Get complete weather data for a location
export async function getWeatherForLocation(
  location: string,
): Promise<WeatherForecast | null> {
  try {
    const coords = await getLocationCoords(location);
    if (!coords) {
      return null;
    }

    const [current, forecast] = await Promise.all([
      getCurrentWeather(coords.lat, coords.lon),
      getWeatherForecast(coords.lat, coords.lon),
    ]);

    if (!current) {
      return null;
    }

    return {
      current,
      forecast,
    };
  } catch (error) {
    console.error("Error fetching weather for location:", error);
    return null;
  }
}

// Get weather icon URL
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Format temperature for display
export function formatTemperature(temp: number): string {
  return `${temp}°C`;
}

// Get French weather description
export function getWeatherDescription(description: string): string {
  const descriptions: Record<string, string> = {
    "clear sky": "Ciel dégagé",
    "few clouds": "Quelques nuages",
    "scattered clouds": "Nuages épars",
    "broken clouds": "Nuages fragmentés",
    "shower rain": "Averses",
    "rain": "Pluie",
    "thunderstorm": "Orage",
    "snow": "Neige",
    "mist": "Brume",
    "overcast clouds": "Ciel couvert",
    "light rain": "Pluie légère",
    "moderate rain": "Pluie modérée",
    "heavy rain": "Pluie forte",
  };

  return descriptions[description.toLowerCase()] || description;
}
