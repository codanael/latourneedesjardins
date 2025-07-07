// Client-side caching utilities for Garden App performance optimization
// Implements localStorage-based caching with TTL and cache invalidation

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheConfig {
  ttl: number;
  maxItems?: number;
  keyPrefix?: string;
}

export class ClientCache {
  private keyPrefix: string;
  private maxItems: number;

  constructor(keyPrefix = "garden_cache", maxItems = 100) {
    this.keyPrefix = keyPrefix;
    this.maxItems = maxItems;
  }

  /**
   * Generate cache key with prefix
   */
  private getCacheKey(key: string): string {
    return `${this.keyPrefix}_${key}`;
  }

  /**
   * Check if cache item is expired
   */
  private isExpired(item: CacheItem<unknown>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Set item in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number): boolean {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      const cacheKey = this.getCacheKey(key);
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));

      // Clean up old items if we exceed maxItems
      this.cleanup();

      return true;
    } catch (error) {
      console.warn("Cache set failed:", error);
      return false;
    }
  }

  /**
   * Get item from cache if not expired
   */
  get<T>(key: string): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const item: CacheItem<T> = JSON.parse(cached);

      if (this.isExpired(item)) {
        this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn("Cache get failed:", error);
      return null;
    }
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    try {
      const cacheKey = this.getCacheKey(key);
      localStorage.removeItem(cacheKey);
      return true;
    } catch (error) {
      console.warn("Cache delete failed:", error);
      return false;
    }
  }

  /**
   * Clear all cache items for this prefix
   */
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.keyPrefix)
      );

      keys.forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.warn("Cache clear failed:", error);
      return false;
    }
  }

  /**
   * Clean up expired items and enforce maxItems limit
   */
  cleanup(): void {
    try {
      const cacheKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.keyPrefix)
      );

      // Remove expired items
      cacheKeys.forEach((key) => {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "");
          if (this.isExpired(item)) {
            localStorage.removeItem(key);
          }
        } catch {
          // Remove invalid items
          localStorage.removeItem(key);
        }
      });

      // Enforce maxItems limit
      const remainingKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.keyPrefix)
      );

      if (remainingKeys.length > this.maxItems) {
        // Sort by timestamp and remove oldest items
        const items = remainingKeys.map((key) => ({
          key,
          timestamp: JSON.parse(localStorage.getItem(key) || "{}").timestamp ||
            0,
        }));

        items.sort((a, b) => a.timestamp - b.timestamp);

        const itemsToRemove = items.slice(0, items.length - this.maxItems);
        itemsToRemove.forEach((item) => localStorage.removeItem(item.key));
      }
    } catch (error) {
      console.warn("Cache cleanup failed:", error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalItems: number;
    totalSize: number;
    expiredItems: number;
  } {
    try {
      const cacheKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith(this.keyPrefix)
      );

      let totalSize = 0;
      let expiredItems = 0;

      cacheKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          try {
            const item = JSON.parse(value);
            if (this.isExpired(item)) {
              expiredItems++;
            }
          } catch {
            expiredItems++;
          }
        }
      });

      return {
        totalItems: cacheKeys.length,
        totalSize,
        expiredItems,
      };
    } catch (error) {
      console.warn("Cache stats failed:", error);
      return { totalItems: 0, totalSize: 0, expiredItems: 0 };
    }
  }
}

// Pre-configured cache instances for different data types
export const weatherCache = new ClientCache("garden_weather", 50);
export const eventsCache = new ClientCache("garden_events", 20);
export const userCache = new ClientCache("garden_user", 10);

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  WEATHER_CURRENT: 10 * 60 * 1000, // 10 minutes
  WEATHER_FORECAST: 30 * 60 * 1000, // 30 minutes
  WEATHER_COORDS: 24 * 60 * 60 * 1000, // 24 hours
  EVENTS_LIST: 5 * 60 * 1000, // 5 minutes
  EVENT_DETAILS: 2 * 60 * 1000, // 2 minutes
  USER_SESSION: 15 * 60 * 1000, // 15 minutes
  RSVP_DATA: 1 * 60 * 1000, // 1 minute
} as const;

/**
 * Cached fetch wrapper for API requests
 */
export async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  ttl: number,
  cache: ClientCache = eventsCache,
  options?: RequestInit,
): Promise<T | null> {
  // Try to get from cache first
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Fetch from network
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Store in cache
    cache.set(cacheKey, data, ttl);

    return data;
  } catch (error) {
    console.warn(`Cached fetch failed for ${url}:`, error);
    return null;
  }
}

/**
 * Cache invalidation utilities
 */
export function invalidateCache(pattern: string, _cache?: ClientCache): void {
  // This is a simple implementation - in a real app you might want more sophisticated pattern matching
  try {
    const keys = Object.keys(localStorage).filter((key) =>
      key.includes(pattern)
    );

    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn("Cache invalidation failed:", error);
  }
}

/**
 * Initialize cache cleanup on page load
 */
export function initializeCacheCleanup(): void {
  if (typeof window !== "undefined") {
    // Clean up on page load
    weatherCache.cleanup();
    eventsCache.cleanup();
    userCache.cleanup();

    // Set up periodic cleanup (every 5 minutes)
    setInterval(() => {
      weatherCache.cleanup();
      eventsCache.cleanup();
      userCache.cleanup();
    }, 5 * 60 * 1000);
  }
}
