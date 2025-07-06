import { Handlers } from "$fresh/server.ts";
import { deleteSession, getAuthenticatedUser } from "../../utils/session.ts";

export const handler: Handlers = {
  GET(req) {
    const user = getAuthenticatedUser(req);

    if (user) {
      // Delete the session
      deleteSession(user.session.id);
    }

    // Clear session cookie and redirect to home
    const response = new Response("", {
      status: 302,
      headers: { "Location": "/" },
    });

    response.headers.set("Set-Cookie", "session=; Max-Age=0; Path=/; HttpOnly");

    return response;
  },

  POST(req) {
    // Same logic for POST requests
    return this.GET(req);
  },
};
