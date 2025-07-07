// Tests for the cache system utilities
import { assertEquals, assertExists, assertNotEquals } from "$std/assert/mod.ts";
import { afterEach, beforeEach, describe, it } from "$std/testing/bdd.ts";
import { 
  ClientCache, 
  weatherCache, 
  eventsCache, 
  userCache, 
  CACHE_TTL,
  cachedFetch,
  invalidateCache,
  initializeCacheCleanup
} from "../utils/cache.ts";

// Mock localStorage for testing
const mockStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  length: mockStorage.size,
  key: (index: number) => Array.from(mockStorage.keys())[index] || null,
} as Storage;

describe("Cache System", () => {
  let testCache: ClientCache;

  beforeEach(() => {
    // Clear mock storage
    mockStorage.clear();
    
    // Create a test cache instance
    testCache = new ClientCache("test_cache", 10);
  });

  afterEach(() => {
    // Clean up after each test
    mockStorage.clear();
  });

  describe("ClientCache", () => {
    it("should store and retrieve data", () => {
      const testData = { message: "Hello, World!" };
      const key = "test_key";
      const ttl = 5000; // 5 seconds

      // Store data
      const success = testCache.set(key, testData, ttl);
      assertEquals(success, true);

      // Retrieve data
      const retrieved = testCache.get(key);
      assertEquals(retrieved, testData);
    });

    it("should return null for non-existent keys", () => {
      const result = testCache.get("non_existent_key");
      assertEquals(result, null);
    });

    it("should handle expired items", async () => {
      const testData = { message: "This will expire" };
      const key = "expiring_key";
      const ttl = 10; // 10 milliseconds

      // Store data with short TTL
      testCache.set(key, testData, ttl);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should return null for expired data
      const retrieved = testCache.get(key);
      assertEquals(retrieved, null);
    });

    it("should delete items", () => {
      const testData = { message: "To be deleted" };
      const key = "delete_key";

      // Store and verify
      testCache.set(key, testData, 5000);
      assertExists(testCache.get(key));

      // Delete and verify
      const deleted = testCache.delete(key);
      assertEquals(deleted, true);
      assertEquals(testCache.get(key), null);
    });

    it("should clear all cache items", () => {
      // Store multiple items
      testCache.set("key1", { data: "value1" }, 5000);
      testCache.set("key2", { data: "value2" }, 5000);
      testCache.set("key3", { data: "value3" }, 5000);

      // Verify items exist
      assertExists(testCache.get("key1"));
      assertExists(testCache.get("key2"));
      assertExists(testCache.get("key3"));

      // Clear all
      const cleared = testCache.clear();
      assertEquals(cleared, true);

      // Verify all items are gone
      assertEquals(testCache.get("key1"), null);
      assertEquals(testCache.get("key2"), null);
      assertEquals(testCache.get("key3"), null);
    });

    it("should provide cache statistics", () => {
      // Store some items
      testCache.set("stats_key1", { data: "value1" }, 5000);
      testCache.set("stats_key2", { data: "value2" }, 5000);

      const stats = testCache.getStats();
      
      assertEquals(stats.totalItems, 2);
      assertEquals(stats.expiredItems, 0);
      assertEquals(typeof stats.totalSize, "number");
      assertEquals(stats.totalSize > 0, true);
    });

    it("should handle cleanup", async () => {
      // Store expired item
      testCache.set("expired_key", { data: "expired" }, 1);
      
      // Store valid item
      testCache.set("valid_key", { data: "valid" }, 5000);

      // Wait for first item to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      // Run cleanup
      testCache.cleanup();

      // Valid item should still exist
      assertExists(testCache.get("valid_key"));
      
      // Expired item should be cleaned up
      assertEquals(testCache.get("expired_key"), null);
    });
  });

  describe("Pre-configured Cache Instances", () => {
    it("should have weather cache instance", () => {
      assertExists(weatherCache);
      assertEquals(typeof weatherCache.set, "function");
      assertEquals(typeof weatherCache.get, "function");
    });

    it("should have events cache instance", () => {
      assertExists(eventsCache);
      assertEquals(typeof eventsCache.set, "function");
      assertEquals(typeof eventsCache.get, "function");
    });

    it("should have user cache instance", () => {
      assertExists(userCache);
      assertEquals(typeof userCache.set, "function");
      assertEquals(typeof userCache.get, "function");
    });
  });

  describe("Cache TTL Constants", () => {
    it("should have defined TTL values", () => {
      assertEquals(typeof CACHE_TTL.WEATHER_CURRENT, "number");
      assertEquals(typeof CACHE_TTL.WEATHER_FORECAST, "number");
      assertEquals(typeof CACHE_TTL.WEATHER_COORDS, "number");
      assertEquals(typeof CACHE_TTL.EVENTS_LIST, "number");
      assertEquals(typeof CACHE_TTL.EVENT_DETAILS, "number");
      assertEquals(typeof CACHE_TTL.USER_SESSION, "number");
      assertEquals(typeof CACHE_TTL.RSVP_DATA, "number");
    });

    it("should have reasonable TTL values", () => {
      // Weather coordinates should have longest TTL
      assertEquals(CACHE_TTL.WEATHER_COORDS > CACHE_TTL.WEATHER_FORECAST, true);
      assertEquals(CACHE_TTL.WEATHER_FORECAST > CACHE_TTL.WEATHER_CURRENT, true);
      
      // RSVP data should have shortest TTL (most dynamic)
      assertEquals(CACHE_TTL.RSVP_DATA < CACHE_TTL.EVENT_DETAILS, true);
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate cache by pattern", () => {
      // Setup test data
      mockStorage.set("test_cache_item1", JSON.stringify({ data: "value1" }));
      mockStorage.set("test_cache_item2", JSON.stringify({ data: "value2" }));
      mockStorage.set("other_cache_item", JSON.stringify({ data: "other" }));

      // Invalidate by pattern
      invalidateCache("test_cache", testCache);

      // Test items should be removed, other should remain
      assertEquals(mockStorage.has("test_cache_item1"), false);
      assertEquals(mockStorage.has("test_cache_item2"), false);
      assertEquals(mockStorage.has("other_cache_item"), true);
    });
  });

  describe("Cache Initialization", () => {
    it("should initialize cache cleanup", () => {
      // Mock window object
      (globalThis as any).window = {} as Window & typeof globalThis;
      
      // Should not throw
      initializeCacheCleanup();
      
      // Clean up
      delete (globalThis as any).window;
    });
  });

  describe("Error Handling", () => {
    it("should handle localStorage errors gracefully", () => {
      // Mock localStorage to throw error
      const originalSetItem = (globalThis as any).localStorage.setItem;
      (globalThis as any).localStorage.setItem = () => {
        throw new Error("Storage full");
      };

      // Should not throw, should return false
      const result = testCache.set("error_key", { data: "test" }, 5000);
      assertEquals(result, false);

      // Restore original
      (globalThis as any).localStorage.setItem = originalSetItem;
    });

    it("should handle corrupted cache data", () => {
      // Store corrupted JSON
      mockStorage.set("test_cache_corrupted", "invalid json");

      // Should return null without throwing
      const result = testCache.get("corrupted");
      assertEquals(result, null);
    });
  });
});