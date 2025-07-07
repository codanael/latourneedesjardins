// Test authentication helper
import { createUser, getUserByEmail } from "../utils/db-operations.ts";

export function createTestUser(
  email: string = "test@example.com",
  name: string = "Test User",
) {
  // Try to get existing user first
  let user = getUserByEmail(email);
  if (!user) {
    user = createUser(name, email, "approved"); // Create as approved host for testing
  }
  return user;
}

export function createTestRequest(
  url: string,
  // deno-lint-ignore no-explicit-any
  options: RequestInit & { user?: any } = {},
): Request {
  const { user, ...requestOptions } = options;

  // Set DENO_ENV to test mode for test authentication bypass
  Deno.env.set("DENO_ENV", "test");

  if (user) {
    requestOptions.headers = {
      "x-test-user-email": user.email,
      ...requestOptions.headers,
    };
  }
  
  // Ensure Content-Type is set for form data if body is present
  if (requestOptions.body && requestOptions.headers) {
    const headers = requestOptions.headers as Record<string, string>;
    if (!headers["Content-Type"]) {
      requestOptions.headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        ...requestOptions.headers,
      };
    }
  }

  return new Request(url, requestOptions);
}
