import { FreshContext } from "$fresh/server.ts";
import { securityHeaders, httpsRedirect, rateLimit } from "../utils/security.ts";

export async function handler(req: Request, ctx: FreshContext) {
  // Apply HTTPS redirect first
  const httpsResponse = await httpsRedirect(req, ctx);
  if (httpsResponse.status === 301) {
    return httpsResponse;
  }

  // Apply rate limiting to API routes
  if (req.url.includes("/api/")) {
    const rateLimitHandler = rateLimit(100, 15 * 60 * 1000); // 100 requests per 15 minutes
    const rateLimitResponse = await rateLimitHandler(req, ctx);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  // Apply security headers to all responses
  return await securityHeaders(req, ctx);
}