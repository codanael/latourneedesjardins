import { FreshContext } from "$fresh/server.ts";

// Extend globalThis type for rate limiting
declare global {
  var rateLimitStore:
    | Map<string, { count: number; resetTime: number }>
    | undefined;
}

export async function handler(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);
  const isProduction = Deno.env.get("ENVIRONMENT") === "production";

  // HTTPS redirect (only in production)
  if (isProduction && url.protocol === "http:") {
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = "https:";

    return new Response(null, {
      status: 301,
      headers: {
        "Location": httpsUrl.toString(),
        "Strict-Transport-Security":
          "max-age=31536000; includeSubDomains; preload",
      },
    });
  }

  // Rate limiting for API routes
  if (req.url.includes("/api/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") || "unknown";

    // Simple in-memory rate limiting
    const rateLimitKey = `rate_limit_${ip}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;

    // Get or create rate limit data
    const rateLimitData = globalThis.rateLimitStore?.get?.(rateLimitKey) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Initialize rate limit store if not exists
    if (!globalThis.rateLimitStore) {
      globalThis.rateLimitStore = new Map();
    }

    // Reset if window expired
    if (rateLimitData.resetTime < now) {
      rateLimitData.count = 0;
      rateLimitData.resetTime = now + windowMs;
    }

    // Check if rate limit exceeded
    if (rateLimitData.count >= maxRequests) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((rateLimitData.resetTime - now) / 1000)
              .toString(),
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(rateLimitData.resetTime / 1000)
              .toString(),
          },
        },
      );
    }

    // Increment counter
    rateLimitData.count++;
    globalThis.rateLimitStore.set(rateLimitKey, rateLimitData);
  }

  // Continue to next handler
  const response = await ctx.next();

  // Add security headers to response
  if (response) {
    const isDev = Deno.env.get("ENVIRONMENT") === "development";

    // Security headers for production
    if (!isDev) {
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openweathermap.org https://accounts.google.com; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
      );
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
      response.headers.set(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
      );
    } else {
      // Development headers (less strict)
      response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.openweathermap.org https://accounts.google.com ws://localhost:*; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'",
      );
      response.headers.set("X-Frame-Options", "SAMEORIGIN");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
      );
    }

    // Add rate limit headers if this was an API request
    if (req.url.includes("/api/") && globalThis.rateLimitStore) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.headers.get("x-real-ip") || "unknown";
      const rateLimitData = globalThis.rateLimitStore.get(`rate_limit_${ip}`);

      if (rateLimitData) {
        response.headers.set("X-RateLimit-Limit", "100");
        response.headers.set(
          "X-RateLimit-Remaining",
          (100 - rateLimitData.count).toString(),
        );
        response.headers.set(
          "X-RateLimit-Reset",
          Math.ceil(rateLimitData.resetTime / 1000).toString(),
        );
      }
    }
  }

  return response;
}
