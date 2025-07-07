// Cache Provider component for initializing and managing client-side caches
// Provides cache cleanup and performance monitoring

import { useEffect } from "preact/hooks";
import { Signal, useSignal } from "@preact/signals";
import { initializeCacheCleanup } from "../utils/cache.ts";
import { getWeatherCacheStats } from "../utils/cached-weather.ts";
import { getEventsCacheStats } from "../utils/cached-events.ts";

interface CacheProviderProps {
  children: any;
  enableStats?: boolean;
}

export default function CacheProvider(
  { children, enableStats = false }: CacheProviderProps,
) {
  const cacheStats: Signal<any> = useSignal(null);

  useEffect(() => {
    // Initialize cache cleanup on component mount
    initializeCacheCleanup();

    if (enableStats) {
      // Update cache stats periodically
      const updateStats = () => {
        try {
          const stats = {
            weather: getWeatherCacheStats(),
            events: getEventsCacheStats(),
            timestamp: new Date().toISOString(),
          };
          cacheStats.value = stats;
        } catch (error) {
          console.warn("Failed to update cache stats:", error);
        }
      };

      // Initial stats update
      updateStats();

      // Update stats every 30 seconds
      const interval = setInterval(updateStats, 30000);

      return () => clearInterval(interval);
    }
  }, [enableStats]);

  return (
    <>
      {children}
      {enableStats && cacheStats.value &&
        process.env.NODE_ENV === "development" && (
        <CacheStatsDisplay stats={cacheStats.value} />
      )}
    </>
  );
}

// Development-only cache statistics display
function CacheStatsDisplay({ stats }: { stats: any }) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div class="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg max-w-xs">
      <div class="font-bold mb-2">🗄️ Cache Stats</div>

      <div class="space-y-1">
        <div>
          <strong>Weather:</strong> {stats.weather.totalItems} items,{" "}
          {formatBytes(stats.weather.totalSize)}
          {stats.weather.expiredItems > 0 && (
            <span class="text-yellow-300">
              ({stats.weather.expiredItems} expired)
            </span>
          )}
        </div>

        <div>
          <strong>Events:</strong> {stats.events.events.totalItems} items,{" "}
          {formatBytes(stats.events.events.totalSize)}
          {stats.events.events.expiredItems > 0 && (
            <span class="text-yellow-300">
              ({stats.events.events.expiredItems} expired)
            </span>
          )}
        </div>

        <div>
          <strong>Users:</strong> {stats.events.users.totalItems} items,{" "}
          {formatBytes(stats.events.users.totalSize)}
          {stats.events.users.expiredItems > 0 && (
            <span class="text-yellow-300">
              ({stats.events.users.expiredItems} expired)
            </span>
          )}
        </div>
      </div>

      <div class="text-gray-300 mt-2 text-xs">
        Updated: {new Date(stats.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
