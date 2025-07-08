// Cached weather utilities for Garden App
// Implements client-side caching for weather data to reduce API calls and improve performance

import {
  getCurrentWeather as _getCurrentWeather,
  getLocationCoords as _getLocationCoords,
  getWeatherForecast as _getWeatherForecast,
  getWeatherForEvent as _getWeatherForEvent,
  type LocationCoords,
  type WeatherData,
  type WeatherForecast,
} from "./weather.ts";
import { CACHE_TTL, weatherCache } from "./cache.ts";

/**
 * Generate cache key for location coordinates
 */
function getLocationCoordsKey(location: string): string {
  return `coords_${location.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

/**
 * Generate cache key for current weather
 */
function getCurrentWeatherKey(lat: number, lon: number): string {
  return `current_${lat.toFixed(4)}_${lon.toFixed(4)}`;
}

/**
 * Generate cache key for weather forecast
 */
function getWeatherForecastKey(lat: number, lon: number): string {
  return `forecast_${lat.toFixed(4)}_${lon.toFixed(4)}`;
}

/**
 * Cached version of getLocationCoords with 24h TTL
 * Location coordinates rarely change, so we can cache them for a long time
 */
export async function getLocationCoords(
  location: string,
): Promise<LocationCoords | null> {
  const cacheKey = getLocationCoordsKey(location);

  // Try cache first
  const cached = weatherCache.get<LocationCoords>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const coords = await _getLocationCoords(location);

  // Cache the result (even if null, to avoid repeated failed requests)
  if (coords) {
    weatherCache.set(cacheKey, coords, CACHE_TTL.WEATHER_COORDS);
  }

  return coords;
}

/**
 * Cached version of getCurrentWeather with 10 minute TTL
 * Current weather changes frequently but not every minute
 */
export async function getCurrentWeather(
  lat: number,
  lon: number,
): Promise<WeatherData | null> {
  const cacheKey = getCurrentWeatherKey(lat, lon);

  // Try cache first
  const cached = weatherCache.get<WeatherData>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const weather = await _getCurrentWeather(lat, lon);

  // Cache the result
  if (weather) {
    weatherCache.set(cacheKey, weather, CACHE_TTL.WEATHER_CURRENT);
  }

  return weather;
}

/**
 * Cached version of getWeatherForecast with 30 minute TTL
 * Forecast data is less time-sensitive than current weather
 */
export async function getWeatherForecast(
  lat: number,
  lon: number,
): Promise<WeatherData[]> {
  const cacheKey = getWeatherForecastKey(lat, lon);

  // Try cache first
  const cached = weatherCache.get<WeatherData[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const forecast = await _getWeatherForecast(lat, lon);

  // Cache the result
  if (forecast && forecast.length > 0) {
    weatherCache.set(cacheKey, forecast, CACHE_TTL.WEATHER_FORECAST);
  }

  return forecast;
}

/**
 * Cached version of getWeatherForLocation
 * Combines all weather data with intelligent caching
 */
export async function getWeatherForLocation(
  location: string,
): Promise<WeatherForecast | null> {
  try {
    const coords = await getLocationCoords(location);
    if (!coords) {
      return null;
    }

    // Fetch current weather and forecast in parallel
    // Each will use its own cache
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
    console.error("Error fetching cached weather for location:", error);
    return null;
  }
}

/**
 * Cached version of getWeatherForEvent
 * Prioritizes coordinates over location text with intelligent caching
 */
export async function getWeatherForEvent(
  event: {
    latitude?: number;
    longitude?: number;
    weather_location?: string;
    location: string;
  },
): Promise<WeatherForecast | null> {
  try {
    // Priority 1: Use stored coordinates if available
    if (event.latitude && event.longitude) {
      const [current, forecast] = await Promise.all([
        getCurrentWeather(event.latitude, event.longitude),
        getWeatherForecast(event.latitude, event.longitude),
      ]);

      if (current) {
        return {
          current,
          forecast,
        };
      }
    }

    // Priority 2: Try weather_location if available
    if (event.weather_location) {
      // Check if weather_location is coordinates (lat,lon format)
      const coordsMatch = event.weather_location.match(
        /^(-?\d+\.?\d*),(-?\d+\.?\d*)$/,
      );
      if (coordsMatch) {
        const lat = parseFloat(coordsMatch[1]);
        const lon = parseFloat(coordsMatch[2]);
        const [current, forecast] = await Promise.all([
          getCurrentWeather(lat, lon),
          getWeatherForecast(lat, lon),
        ]);

        if (current) {
          return {
            current,
            forecast,
          };
        }
      } else {
        // Try as location string
        const result = await getWeatherForLocation(event.weather_location);
        if (result) {
          return result;
        }
      }
    }

    // Priority 3: Fallback to main location
    return await getWeatherForLocation(event.location);
  } catch (error) {
    console.error("Error fetching cached weather for event:", error);
    return null;
  }
}

/**
 * Preload weather data for multiple locations
 * Useful for calendar page with multiple events
 */
export async function preloadWeatherData(locations: string[]): Promise<void> {
  const uniqueLocations = [...new Set(locations)];

  try {
    // Preload coordinates for all locations in parallel
    const coordsPromises = uniqueLocations.map((location) =>
      getLocationCoords(location)
    );
    const coordsResults = await Promise.allSettled(coordsPromises);

    // Get valid coordinates
    const validCoords = coordsResults
      .map((result, index) => ({
        location: uniqueLocations[index],
        coords: result.status === "fulfilled" ? result.value : null,
      }))
      .filter((item) => item.coords !== null);

    // Preload weather data for all valid coordinates
    const weatherPromises = validCoords.flatMap((item) => [
      getCurrentWeather(item.coords!.lat, item.coords!.lon),
      getWeatherForecast(item.coords!.lat, item.coords!.lon),
    ]);

    await Promise.allSettled(weatherPromises);
  } catch (error) {
    console.warn("Weather preload failed:", error);
  }
}

/**
 * Invalidate weather cache for a specific location
 * Useful when weather data seems outdated
 */
export function invalidateWeatherCache(location?: string): void {
  if (location) {
    const locationKey = getLocationCoordsKey(location);
    weatherCache.delete(locationKey);

    // We can't easily invalidate by coordinates without knowing them,
    // but location cache invalidation will force a fresh fetch
  } else {
    // Clear all weather cache
    weatherCache.clear();
  }
}

/**
 * Get weather cache statistics
 */
export function getWeatherCacheStats() {
  return {
    ...weatherCache.getStats(),
    cacheType: "weather",
  };
}
