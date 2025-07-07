// Tests for authentication system
import { assertEquals, assertExists } from "$std/assert/mod.ts";
import { afterEach, beforeEach, describe, it } from "$std/testing/bdd.ts";
import { createTestRequest, createTestUser } from "./auth-helper.ts";
import { getAuthenticatedUser } from "../utils/session.ts";
import { initializeDatabase } from "../utils/schema.ts";
import { closeDatabase } from "../utils/database.ts";

describe("Authentication System", () => {
  beforeEach(async () => {
    // Set test environment
    Deno.env.set("DENO_ENV", "test");

    // Initialize clean database
    initializeDatabase();

    // Initialize sessions table
    const { initializeSessionsTable } = await import("../utils/session.ts");
    initializeSessionsTable();
  });

  afterEach(() => {
    // Clean up
    closeDatabase();
    Deno.env.delete("DENO_ENV");
  });

  describe("Test Authentication Bypass", () => {
    it("should authenticate user with test headers", () => {
      const testUser = createTestUser("test@example.com", "Test User");
      assertExists(testUser);

      const request = createTestRequest("http://localhost/test", {
        user: testUser,
      });

      // Check if request has proper test headers
      assertEquals(request.headers.get("x-test-user-email"), testUser.email);
      assertEquals(Deno.env.get("DENO_ENV"), "test");
    });

    it("should return authenticated user in test mode", () => {
      const testUser = createTestUser(
        "auth-test@example.com",
        "Auth Test User",
      );

      const request = createTestRequest("http://localhost/test", {
        user: testUser,
      });

      const authenticatedUser = getAuthenticatedUser(request);

      assertExists(authenticatedUser);
      assertEquals(authenticatedUser.email, testUser.email);
      assertEquals(authenticatedUser.name, testUser.name);
    });

    it("should return null for unauthenticated requests", () => {
      const request = createTestRequest("http://localhost/test");

      const authenticatedUser = getAuthenticatedUser(request);

      assertEquals(authenticatedUser, null);
    });

    it("should return null for non-existent test user", () => {
      const request = createTestRequest("http://localhost/test", {
        user: { email: "nonexistent@example.com", name: "Non Existent" },
      });

      const authenticatedUser = getAuthenticatedUser(request);

      assertEquals(authenticatedUser, null);
    });
  });

  describe("Test User Creation", () => {
    it("should create test user with approved host status", () => {
      const user = createTestUser("host@example.com", "Test Host");

      assertExists(user);
      assertEquals(user.email, "host@example.com");
      assertEquals(user.name, "Test Host");
      assertEquals(user.host_status, "approved");
    });

    it("should reuse existing user", () => {
      const user1 = createTestUser("reuse@example.com", "First Creation");
      const user2 = createTestUser("reuse@example.com", "Second Creation");

      assertExists(user1);
      assertExists(user2);
      assertEquals(user1.id, user2.id);
      assertEquals(user1.email, user2.email);
      // Name should be from first creation
      assertEquals(user2.name, "First Creation");
    });
  });

  describe("Test Request Creation", () => {
    it("should create request with test headers when user provided", () => {
      const testUser = createTestUser("request@example.com", "Request User");

      const request = createTestRequest("http://localhost/api/test", {
        method: "POST",
        user: testUser,
      });

      assertEquals(request.method, "POST");
      assertEquals(request.url, "http://localhost/api/test");
      assertEquals(request.headers.get("x-test-user-email"), testUser.email);
    });

    it("should create request without test headers when no user", () => {
      const request = createTestRequest("http://localhost/api/test", {
        method: "GET",
      });

      assertEquals(request.method, "GET");
      assertEquals(request.url, "http://localhost/api/test");
      assertEquals(request.headers.get("x-test-user-email"), null);
    });

    it("should handle form data content type", () => {
      const testUser = createTestUser("form@example.com", "Form User");
      const formData = new FormData();
      formData.append("test", "value");

      const request = createTestRequest("http://localhost/api/test", {
        method: "POST",
        body: formData,
        user: testUser,
      });

      assertEquals(request.headers.get("x-test-user-email"), testUser.email);
      // FormData should set its own content type
      assertExists(request.body);
    });
  });
});
