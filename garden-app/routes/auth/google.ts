import { Handlers } from "$fresh/server.ts";
import {
  generateRandomState,
  getAuthorizationUrl,
  getGoogleOAuthConfig,
} from "../../utils/oauth.ts";
import { getAuthenticatedUser } from "../../utils/session.ts";

export const handler: Handlers = {
  GET(req) {
    // If user is already authenticated, redirect to home
    const user = getAuthenticatedUser(req);
    if (user) {
      return new Response("", {
        status: 302,
        headers: { "Location": "/" },
      });
    }

    try {
      const provider = getGoogleOAuthConfig();

      // Validate configuration
      if (!provider.clientId || !provider.clientSecret) {
        return new Response("", {
          status: 302,
          headers: {
            "Location": "/auth/login?error=OAuth configuration missing",
          },
        });
      }

      // Generate state for CSRF protection
      const state = generateRandomState();

      // Get authorization URL
      const authUrl = getAuthorizationUrl(provider, state);

      // Store state in session/cookie for validation (simplified approach)
      const response = new Response("", {
        status: 302,
        headers: { "Location": authUrl },
      });

      // Set state cookie for CSRF protection
      response.headers.set(
        "Set-Cookie",
        `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
      );

      return response;
    } catch (error) {
      console.error("Error initiating Google OAuth:", error);
      return new Response("", {
        status: 302,
        headers: {
          "Location":
            "/auth/login?error=Erreur lors de l'initialisation de l'authentification",
        },
      });
    }
  },
};
