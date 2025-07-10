// Cached event data utilities for Garden App
// Implements client-side caching for event data to reduce database load

import { CACHE_TTL, eventsCache, userCache } from "./cache.ts";
import type { Event, PotluckItem, RSVP } from "./db-operations.ts";

/**
 * Cached fetch for events list
 * Used on home page and events index page
 */
export async function getCachedEventsList(): Promise<Event[]> {
  const cacheKey = "events_list";

  try {
    const cached = eventsCache.get<Event[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API (this would need to be created)
    const response = await fetch("/api/events");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const events = await response.json();

    // Cache the result
    eventsCache.set(cacheKey, events, CACHE_TTL.EVENTS_LIST);

    return events;
  } catch (error) {
    console.warn("Failed to fetch cached events list:", error);
    return [];
  }
}

/**
 * Cached fetch for event details
 * Used on individual event pages
 */
export async function getCachedEventDetails(eventId: number): Promise<{
  event: Event | null;
  rsvps: RSVP[];
  potluckItems: PotluckItem[];
}> {
  const cacheKey = `event_details_${eventId}`;

  try {
    const cached = eventsCache.get<{
      event: Event | null;
      rsvps: RSVP[];
      potluckItems: PotluckItem[];
    }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API (this would need to be created)
    const response = await fetch(`/api/events/${eventId}/details`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const eventDetails = await response.json();

    // Cache the result for shorter time since RSVP data changes frequently
    eventsCache.set(cacheKey, eventDetails, CACHE_TTL.EVENT_DETAILS);

    return eventDetails;
  } catch (error) {
    console.warn(`Failed to fetch cached event details for ${eventId}:`, error);
    return {
      event: null,
      rsvps: [],
      potluckItems: [],
    };
  }
}

/**
 * Cached fetch for user's RSVP data
 * Used to show user's current RSVP status
 */
export async function getCachedUserRSVPs(userId: number): Promise<RSVP[]> {
  const cacheKey = `user_rsvps_${userId}`;

  try {
    const cached = userCache.get<RSVP[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from API (this would need to be created)
    const response = await fetch(`/api/users/${userId}/rsvps`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rsvps = await response.json();

    // Cache for short time since RSVP data changes frequently
    userCache.set(cacheKey, rsvps, CACHE_TTL.RSVP_DATA);

    return rsvps;
  } catch (error) {
    console.warn(`Failed to fetch cached RSVPs for user ${userId}:`, error);
    return [];
  }
}

/**
 * Update RSVP with cache invalidation
 * Used by RSVPButton island
 */
export async function updateRSVPWithCache(
  eventId: number,
  response: "yes" | "no",
  plusOne: boolean = false,
): Promise<boolean> {
  try {
    const apiResponse = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ response, plus_one: plusOne }),
    });

    if (!apiResponse.ok) {
      throw new Error(`HTTP ${apiResponse.status}`);
    }

    // Invalidate related caches
    eventsCache.delete(`event_details_${eventId}`);
    eventsCache.delete("events_list");

    // Clear user RSVP cache (we don't know user ID here, so clear all user cache)
    userCache.clear();

    return true;
  } catch (error) {
    console.error("Failed to update RSVP:", error);
    return false;
  }
}

/**
 * Update potluck item with cache invalidation
 * Used by PotluckManager island
 */
export async function updatePotluckWithCache(
  eventId: number,
  action: "add" | "update" | "delete",
  itemData: Partial<PotluckItem>,
): Promise<boolean> {
  try {
    let url = `/api/events/${eventId}/potluck`;
    let method = "POST";

    if (action === "delete" && itemData.id) {
      url += `/${itemData.id}`;
      method = "DELETE";
    } else if (action === "update" && itemData.id) {
      url += `/${itemData.id}`;
      method = "PUT";
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method !== "DELETE" ? JSON.stringify(itemData) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Invalidate event details cache
    eventsCache.delete(`event_details_${eventId}`);

    return true;
  } catch (error) {
    console.error("Failed to update potluck:", error);
    return false;
  }
}

/**
 * Preload events data for calendar view
 * Useful for calendar page with multiple events
 */
export async function preloadEventsData(eventIds: number[]): Promise<void> {
  const uniqueEventIds = [...new Set(eventIds)];

  try {
    // Preload event details in parallel, but limit concurrency
    const batchSize = 5;
    for (let i = 0; i < uniqueEventIds.length; i += batchSize) {
      const batch = uniqueEventIds.slice(i, i + batchSize);
      const promises = batch.map((id) => getCachedEventDetails(id));
      await Promise.allSettled(promises);
    }
  } catch (error) {
    console.warn("Events preload failed:", error);
  }
}

/**
 * Invalidate event-related caches
 * Useful when event data is updated
 */
export function invalidateEventCache(eventId?: number): void {
  if (eventId) {
    eventsCache.delete(`event_details_${eventId}`);
    eventsCache.delete("events_list"); // List might include this event
  } else {
    // Clear all event cache
    eventsCache.clear();
  }
}

/**
 * Smart cache warming for frequently accessed data
 * Call this on app initialization
 */
export async function warmEventCaches(): Promise<void> {
  try {
    // Warm up events list cache
    await getCachedEventsList();

    // You could extend this to warm up other frequently accessed data
  } catch (error) {
    console.warn("Cache warming failed:", error);
  }
}

/**
 * Get events cache statistics
 */
export function getEventsCacheStats() {
  return {
    events: eventsCache.getStats(),
    users: userCache.getStats(),
  };
}
