import { Handlers } from "$fresh/server.ts";
import {
  createSessionCookie,
  exchangeCodeForToken,
  getAppleOAuthConfig,
  getUserInfo,
} from "../../../utils/oauth.ts";
import { createSession } from "../../../utils/session.ts";
import { createUser, getUserByEmail } from "../../../utils/db-operations.ts";

export const handler: Handlers = {
  async POST(req) {
    const formData = await req.formData();
    const code = formData.get("code")?.toString();
    const state = formData.get("state")?.toString();
    const error = formData.get("error")?.toString();

    // Handle OAuth errors
    if (error) {
      console.error("Apple OAuth error:", error);
      return new Response("", {
        status: 302,
        headers: { "Location": "/auth/login?error=Authentification annulée" },
      });
    }

    // Validate required parameters
    if (!code || !state) {
      return new Response("", {
        status: 302,
        headers: {
          "Location":
            "/auth/login?error=Paramètres d'authentification manquants",
        },
      });
    }

    // Validate state for CSRF protection
    const cookieHeader = req.headers.get("cookie");
    const stateCookie = cookieHeader?.split(";")
      .find((c) => c.trim().startsWith("oauth_state="))
      ?.split("=")[1];

    if (!stateCookie || stateCookie !== state) {
      return new Response("", {
        status: 302,
        headers: { "Location": "/auth/login?error=Token d'état invalide" },
      });
    }

    try {
      const provider = getAppleOAuthConfig();

      // Exchange authorization code for tokens
      const tokens = await exchangeCodeForToken(provider, code);

      // Get user information
      const userInfo = await getUserInfo(
        provider,
        tokens.access_token,
        tokens.id_token,
      );

      // Check if user exists or create new user
      let user = getUserByEmail(userInfo.email);
      if (!user) {
        user = createUser(userInfo.name, userInfo.email, "approved"); // OAuth users are auto-approved
      }

      // Create session
      const userAgent = req.headers.get("user-agent") || undefined;
      const ipAddress = req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        undefined;

      const sessionId = createSession(user.id, "apple", userAgent, ipAddress);

      // Create session cookie with auto-detection of secure flag
      const sessionCookie = createSessionCookie(sessionId);

      // Redirect to home page with session
      const response = new Response("", {
        status: 302,
        headers: { "Location": "/" },
      });

      response.headers.set("Set-Cookie", sessionCookie);

      // Clear state cookie
      response.headers.append("Set-Cookie", "oauth_state=; Max-Age=0; Path=/");

      return response;
    } catch (error) {
      console.error("Error processing Apple OAuth callback:", error);
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/auth/login?error=Erreur lors de l'authentification",
        },
      });
    }
  },

  // Also handle GET requests for Apple OAuth (though POST is standard)
  async GET(req) {
    return this.POST(req);
  },
};
