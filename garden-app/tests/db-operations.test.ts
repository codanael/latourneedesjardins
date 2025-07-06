import { assertEquals, assertExists } from "$std/assert/mod.ts";
import { afterEach, beforeEach, describe, it } from "$std/testing/bdd.ts";
import {
  createEvent,
  createUser,
  getAllEvents,
  getAllUsers,
  getEventById,
  getUserByEmail,
  User,
} from "../utils/db-operations.ts";
import { initializeDatabase } from "../utils/schema.ts";
import { closeDatabase, getDatabase } from "../utils/database.ts";

// Use in-memory database for testing
let testDb: ReturnType<typeof getDatabase>;

describe("Database Operations", () => {
  beforeEach(() => {
    // Initialize a clean database for each test
    initializeDatabase();
    testDb = getDatabase();

    // Clear existing data
    testDb.query("DELETE FROM potluck_items");
    testDb.query("DELETE FROM rsvps");
    testDb.query("DELETE FROM events");
    testDb.query("DELETE FROM users");
  });

  afterEach(() => {
    // Close database connection to prevent leaks
    closeDatabase();
  });

  describe("User operations", () => {
    it("should create a new user", () => {
      const user = createUser("Test User", "test@example.com");

      assertExists(user);
      assertEquals(user.name, "Test User");
      assertEquals(user.email, "test@example.com");
      assertExists(user.id);
      assertExists(user.created_at);
      assertExists(user.updated_at);
    });

    it("should retrieve a user by email", () => {
      const originalUser = createUser("Test User", "test@example.com");
      const retrievedUser = getUserByEmail("test@example.com");

      assertExists(retrievedUser);
      assertEquals(retrievedUser.id, originalUser.id);
      assertEquals(retrievedUser.name, "Test User");
      assertEquals(retrievedUser.email, "test@example.com");
    });

    it("should return null for non-existent user", () => {
      const user = getUserByEmail("nonexistent@example.com");
      assertEquals(user, null);
    });

    it("should get all users", () => {
      createUser("User 1", "user1@example.com");
      createUser("User 2", "user2@example.com");

      const users = getAllUsers();
      assertEquals(users.length, 2);
      assertEquals(users[0].name, "User 1");
      assertEquals(users[1].name, "User 2");
    });
  });

  describe("Event operations", () => {
    let testUser: User;

    beforeEach(() => {
      testUser = createUser("Test Host", "host@example.com");
    });

    it("should create a new event", () => {
      const eventData = {
        title: "Test Garden Party",
        description: "A test event",
        date: "2024-07-15",
        time: "18:00",
        location: "123 Test Street",
        host_id: testUser.id,
        theme: "Test Theme",
        max_attendees: 10,
        weather_location: "Test City, FR",
      };

      const event = createEvent(eventData);

      assertExists(event);
      assertEquals(event.title, "Test Garden Party");
      assertEquals(event.description, "A test event");
      assertEquals(event.date, "2024-07-15");
      assertEquals(event.time, "18:00");
      assertEquals(event.location, "123 Test Street");
      assertEquals(event.host_id, testUser.id);
      assertEquals(event.host_name, testUser.name);
      assertEquals(event.host_email, testUser.email);
      assertEquals(event.theme, "Test Theme");
      assertEquals(event.max_attendees, 10);
      assertEquals(event.weather_location, "Test City, FR");
      assertExists(event.id);
      assertExists(event.created_at);
      assertExists(event.updated_at);
    });

    it("should retrieve an event by ID", () => {
      const eventData = {
        title: "Test Event",
        description: "Test description",
        date: "2024-07-15",
        time: "18:00",
        location: "Test Location",
        host_id: testUser.id,
      };

      const originalEvent = createEvent(eventData);
      const retrievedEvent = getEventById(originalEvent.id);

      assertExists(retrievedEvent);
      assertEquals(retrievedEvent.id, originalEvent.id);
      assertEquals(retrievedEvent.title, "Test Event");
      assertEquals(retrievedEvent.host_name, testUser.name);
    });

    it("should return null for non-existent event", () => {
      const event = getEventById(999);
      assertEquals(event, null);
    });

    it("should get all events with host information", () => {
      const user2 = createUser("Host 2", "host2@example.com");

      createEvent({
        title: "Event 1",
        description: "First event",
        date: "2024-07-15",
        time: "18:00",
        location: "Location 1",
        host_id: testUser.id,
      });

      createEvent({
        title: "Event 2",
        description: "Second event",
        date: "2024-07-16",
        time: "19:00",
        location: "Location 2",
        host_id: user2.id,
      });

      const events = getAllEvents();
      assertEquals(events.length, 2);
      assertEquals(events[0].title, "Event 1");
      assertEquals(events[0].host_name, testUser.name);
      assertEquals(events[1].title, "Event 2");
      assertEquals(events[1].host_name, "Host 2");
    });
  });
});
