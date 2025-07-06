// deno-lint-ignore-file no-explicit-any no-unused-vars
import { assertEquals, assertExists } from "$std/assert/mod.ts";
import { afterEach, beforeEach, describe, it } from "$std/testing/bdd.ts";
import { handler } from "../routes/api/events/[id]/rsvp.ts";
import {
  createEvent,
  createUser,
  Event,
  getUserByEmail,
  getUserRSVP,
  User,
} from "../utils/db-operations.ts";
import { initializeDatabase } from "../utils/schema.ts";
import { closeDatabase, getDatabase } from "../utils/database.ts";

// Test database setup
let testDb: ReturnType<typeof getDatabase>;
let testEvent: any;
let testUser: any;

describe("RSVP API", () => {
  beforeEach(() => {
    // Initialize a clean database for each test
    initializeDatabase();
    testDb = getDatabase();

    // Clear existing data
    testDb.query("DELETE FROM potluck_items");
    testDb.query("DELETE FROM rsvps");
    testDb.query("DELETE FROM events");
    testDb.query("DELETE FROM users");

    // Create test user and event
    testUser = createUser("Test Host", "host@test.com");
    testEvent = createEvent({
      title: "Test Event",
      description: "Test Description",
      date: "2024-12-01",
      time: "18:00",
      location: "Test Location",
      host_id: testUser.id,
      theme: "Test Theme",
      max_attendees: 10,
      weather_location: "Test City",
      special_instructions: "Test instructions",
    });
  });

  afterEach(() => {
    // Close database connection to prevent leaks
    closeDatabase();
  });

  describe("POST /api/events/[id]/rsvp", () => {
    it("should create a new RSVP with 'yes' response", async () => {
      const formData = new FormData();
      formData.append("response", "yes");

      const request = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 200);
      assertEquals(responseBody.success, true);
      assertEquals(responseBody.rsvp.response, "yes");
      assertExists(responseBody.rsvp.id);
    });

    it("should create a new RSVP with 'no' response", async () => {
      const formData = new FormData();
      formData.append("response", "no");

      const request = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 200);
      assertEquals(responseBody.success, true);
      assertEquals(responseBody.rsvp.response, "no");
    });

    it("should create a new RSVP with 'maybe' response", async () => {
      const formData = new FormData();
      formData.append("response", "maybe");

      const request = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 200);
      assertEquals(responseBody.success, true);
      assertEquals(responseBody.rsvp.response, "maybe");
    });

    it("should update existing RSVP when user responds again", async () => {
      // First RSVP
      const formData1 = new FormData();
      formData1.append("response", "yes");

      const request1 = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData1,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      await handler.POST!(request1, ctx as any);

      // Second RSVP (update)
      const formData2 = new FormData();
      formData2.append("response", "no");

      const request2 = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData2,
      });

      const response = await handler.POST!(request2, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 200);
      assertEquals(responseBody.success, true);
      assertEquals(responseBody.rsvp.response, "no");

      // Verify in database that there's only one RSVP record
      const demoUser = getUserByEmail("demo@example.com");
      const userRsvp = getUserRSVP(testEvent.id, demoUser!.id);
      assertEquals(userRsvp!.response, "no");
    });

    it("should return 400 for invalid event ID", async () => {
      const formData = new FormData();
      formData.append("response", "yes");

      const request = new Request("http://localhost/api/events/invalid/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: "invalid" },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 400);
      assertEquals(responseBody.error, "Invalid event ID");
    });

    it("should return 404 for non-existent event", async () => {
      const formData = new FormData();
      formData.append("response", "yes");

      const request = new Request("http://localhost/api/events/999/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: "999" },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 404);
      assertEquals(responseBody.error, "Event not found");
    });

    it("should return 400 for invalid RSVP response", async () => {
      const formData = new FormData();
      formData.append("response", "invalid");

      const request = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 400);
      assertEquals(responseBody.error, "Invalid RSVP response");
    });

    it("should return 400 for missing RSVP response", async () => {
      const formData = new FormData();
      // Not appending response

      const request = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 400);
      assertEquals(responseBody.error, "Invalid RSVP response");
    });
  });

  describe("GET /api/events/[id]/rsvp", () => {
    it("should return null when user has no RSVP", async () => {
      const request = new Request("http://localhost/api/events/1/rsvp", {
        method: "GET",
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      const response = await handler.GET!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 200);
      assertEquals(responseBody.rsvp, null);
    });

    it("should return user's RSVP when it exists", async () => {
      // First create an RSVP
      const formData = new FormData();
      formData.append("response", "yes");

      const postRequest = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      await handler.POST!(postRequest, ctx as any);

      // Then retrieve it
      const getRequest = new Request("http://localhost/api/events/1/rsvp", {
        method: "GET",
      });

      const response = await handler.GET!(getRequest, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 200);
      assertExists(responseBody.rsvp);
      assertEquals(responseBody.rsvp.response, "yes");
      assertEquals(responseBody.rsvp.user_name, "Utilisateur Demo");
      assertExists(responseBody.rsvp.id);
    });

    it("should return 400 for invalid event ID", async () => {
      const request = new Request("http://localhost/api/events/invalid/rsvp", {
        method: "GET",
      });

      const ctx = {
        params: { id: "invalid" },
      };

      const response = await handler.GET!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 400);
      assertEquals(responseBody.error, "Invalid event ID");
    });

    it("should return 404 for non-existent event", async () => {
      const request = new Request("http://localhost/api/events/999/rsvp", {
        method: "GET",
      });

      const ctx = {
        params: { id: "999" },
      };

      const response = await handler.GET!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 404);
      assertEquals(responseBody.error, "Event not found");
    });
  });

  describe("Demo User Creation", () => {
    it("should create demo user if it doesn't exist", async () => {
      const formData = new FormData();
      formData.append("response", "yes");

      const request = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 200);
      assertEquals(responseBody.success, true);

      // Verify demo user was created
      const demoUser = getUserByEmail("demo@example.com");
      assertExists(demoUser);
      assertEquals(demoUser.name, "Utilisateur Demo");
      assertEquals(demoUser.email, "demo@example.com");
    });

    it("should reuse existing demo user", async () => {
      // Create demo user first
      const demoUser = createUser("Utilisateur Demo", "demo@example.com");

      const formData = new FormData();
      formData.append("response", "yes");

      const request = new Request("http://localhost/api/events/1/rsvp", {
        method: "POST",
        body: formData,
      });

      const ctx = {
        params: { id: testEvent.id.toString() },
      };

      const response = await handler.POST!(request, ctx as any);
      const responseBody = await response.json();

      assertEquals(response.status, 200);
      assertEquals(responseBody.success, true);

      // Verify the same user was used
      const foundUser = getUserByEmail("demo@example.com");
      assertEquals(foundUser!.id, demoUser.id);
    });
  });
});
