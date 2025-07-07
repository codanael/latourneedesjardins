// Tests for the new events API endpoints
import { assertEquals, assertExists } from "$std/assert/mod.ts";
import { afterEach, beforeEach, describe, it } from "$std/testing/bdd.ts";
import { handler as eventsHandler } from "../routes/api/events.ts";
import { handler as eventDetailsHandler } from "../routes/api/events/[id]/details.ts";
import { createTestUser, createTestRequest } from "./auth-helper.ts";
import { createEvent } from "../utils/db-operations.ts";
import { initializeDatabase } from "../utils/schema.ts";
import { closeDatabase } from "../utils/database.ts";

describe("Events API", () => {
  let testUser: any;
  let testEvent: any;

  beforeEach(async () => {
    // Set test environment
    Deno.env.set("DENO_ENV", "test");
    
    // Initialize clean database
    initializeDatabase();
    
    // Initialize sessions table
    const { initializeSessionsTable } = await import("../utils/session.ts");
    initializeSessionsTable();

    // Create test user and event
    testUser = createTestUser("api-test@example.com", "API Test User");
    testEvent = createEvent({
      title: "API Test Event",
      description: "Test event for API testing",
      date: "2024-12-01",
      time: "18:00",
      location: "Test Location",
      host_id: testUser.id,
      theme: "Testing",
      max_attendees: 20,
      weather_location: "Test City",
      special_instructions: "Test instructions",
    });
  });

  afterEach(() => {
    closeDatabase();
    Deno.env.delete("DENO_ENV");
  });

  describe("GET /api/events", () => {
    it("should return events list for authenticated user", async () => {
      const request = createTestRequest("http://localhost/api/events", {
        method: "GET",
        user: testUser,
      });

      const response = await eventsHandler.GET!(request, {} as any);
      
      assertEquals(response.status, 200);
      
      const events = await response.json();
      
      assertExists(events);
      assertEquals(Array.isArray(events), true);
      assertEquals(events.length >= 1, true);
      
      // Check event structure
      const event = events.find((e: any) => e.id === testEvent.id);
      assertExists(event);
      assertEquals(event.title, "API Test Event");
      assertEquals(event.location, "Test Location");
      assertEquals(typeof event.rsvp_count, "number");
    });

    it("should return 401 for unauthenticated requests", async () => {
      const request = createTestRequest("http://localhost/api/events", {
        method: "GET",
      });

      const response = await eventsHandler.GET!(request, {} as any);
      
      assertEquals(response.status, 401);
      
      const error = await response.json();
      assertEquals(error.error, "Authentication required");
    });

    it("should include cache headers", async () => {
      const request = createTestRequest("http://localhost/api/events", {
        method: "GET",
        user: testUser,
      });

      const response = await eventsHandler.GET!(request, {} as any);
      
      assertEquals(response.status, 200);
      assertEquals(response.headers.get("Cache-Control"), "private, max-age=300");
    });
  });

  describe("GET /api/events/[id]/details", () => {
    it("should return event details for authenticated user", async () => {
      const request = createTestRequest(`http://localhost/api/events/${testEvent.id}/details`, {
        method: "GET",
        user: testUser,
      });

      const ctx = { params: { id: testEvent.id.toString() } };
      const response = await eventDetailsHandler.GET!(request, ctx as any);
      
      assertEquals(response.status, 200);
      
      const details = await response.json();
      
      assertExists(details.event);
      assertExists(details.rsvps);
      assertExists(details.potluckItems);
      assertEquals(details.currentUserRsvp, null); // No RSVP yet
      
      assertEquals(details.event.id, testEvent.id);
      assertEquals(details.event.title, "API Test Event");
    });

    it("should return 401 for unauthenticated requests", async () => {
      const request = createTestRequest(`http://localhost/api/events/${testEvent.id}/details`, {
        method: "GET",
      });

      const ctx = { params: { id: testEvent.id.toString() } };
      const response = await eventDetailsHandler.GET!(request, ctx as any);
      
      assertEquals(response.status, 401);
    });

    it("should return 400 for invalid event ID", async () => {
      const request = createTestRequest("http://localhost/api/events/invalid/details", {
        method: "GET",
        user: testUser,
      });

      const ctx = { params: { id: "invalid" } };
      const response = await eventDetailsHandler.GET!(request, ctx as any);
      
      assertEquals(response.status, 400);
      
      const error = await response.json();
      assertEquals(error.error, "Invalid event ID");
    });

    it("should return 404 for non-existent event", async () => {
      const request = createTestRequest("http://localhost/api/events/99999/details", {
        method: "GET",
        user: testUser,
      });

      const ctx = { params: { id: "99999" } };
      const response = await eventDetailsHandler.GET!(request, ctx as any);
      
      assertEquals(response.status, 404);
      
      const error = await response.json();
      assertEquals(error.error, "Event not found");
    });

    it("should include appropriate cache headers", async () => {
      const request = createTestRequest(`http://localhost/api/events/${testEvent.id}/details`, {
        method: "GET",
        user: testUser,
      });

      const ctx = { params: { id: testEvent.id.toString() } };
      const response = await eventDetailsHandler.GET!(request, ctx as any);
      
      assertEquals(response.status, 200);
      assertEquals(response.headers.get("Cache-Control"), "private, max-age=120");
    });
  });
});