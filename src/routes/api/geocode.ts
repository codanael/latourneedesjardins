import { Handlers } from "$fresh/server.ts";
import { logSecurityEvent, sanitizeInput } from "../../utils/security.ts";

// Types for geocoding responses
interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
  };
}

interface NominatimResponse {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
  };
}

// Simple in-memory cache to reduce API calls
const geocodeCache = new Map<
  string,
  { data: GeocodingResult[]; timestamp: number }
>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (increased from 5)

// Rate limiting per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max 20 requests per minute per IP (increased from 10)

export const handler: Handlers = {
  async GET(req) {
    try {
      // Extract IP for rate limiting
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.headers.get("x-real-ip") || "unknown";

      // Rate limiting
      const now = Date.now();
      const rateLimitKey = `geocode_${ip}`;
      let rateLimitData = rateLimitMap.get(rateLimitKey);

      if (!rateLimitData || rateLimitData.resetTime < now) {
        rateLimitData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
      }

      if (rateLimitData.count >= RATE_LIMIT_MAX) {
        logSecurityEvent({
          type: "rate_limit",
          ip,
          userAgent: req.headers.get("user-agent") || "unknown",
          url: req.url,
          timestamp: new Date(),
          details: { endpoint: "geocode", limit: RATE_LIMIT_MAX },
        });

        return new Response(
          JSON.stringify({
            error: "Too many requests",
            message: "Rate limit exceeded for geocoding requests",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil((rateLimitData.resetTime - now) / 1000)
                .toString(),
            },
          },
        );
      }

      rateLimitData.count++;
      rateLimitMap.set(rateLimitKey, rateLimitData);

      // Get query parameters
      const url = new URL(req.url);
      const query = sanitizeInput(url.searchParams.get("q") || "");

      if (!query || query.length < 2) {
        return new Response(
          JSON.stringify({
            error:
              "Query parameter 'q' is required and must be at least 2 characters",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Check cache first
      const cacheKey = `geocode_${query}`;
      const cached = geocodeCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Cache": "HIT",
          },
        });
      }

      // Make request to Nominatim with proper headers and rate limiting
      const nominatimUrl = new URL(
        "https://nominatim.openstreetmap.org/search",
      );
      nominatimUrl.searchParams.set("q", query);
      nominatimUrl.searchParams.set("format", "json");
      nominatimUrl.searchParams.set("countrycodes", "fr");
      nominatimUrl.searchParams.set("limit", "5");
      nominatimUrl.searchParams.set("addressdetails", "1");
      nominatimUrl.searchParams.set("accept-language", "fr");
      nominatimUrl.searchParams.set("email", "contact@tourneejardins.com");

      const response = await fetch(nominatimUrl.toString(), {
        headers: {
          "User-Agent":
            "La Tournée des Jardins/1.0 (contact@tourneejardins.com)",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        // Log the error for monitoring
        console.error(
          `Nominatim API error: ${response.status} ${response.statusText}`,
        );

        if (response.status === 429) {
          return new Response(
            JSON.stringify({
              error: "Service temporarily unavailable",
              message:
                "Address verification service is busy. Please try again in a moment.",
            }),
            {
              status: 503,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": "60",
              },
            },
          );
        }

        throw new Error(`Nominatim API returned ${response.status}`);
      }

      const data = await response.json();

      // Validate and sanitize the response
      const sanitizedResults: GeocodingResult[] = Array.isArray(data)
        ? data.slice(0, 5).map((item: NominatimResponse) => ({
          display_name: sanitizeInput(item.display_name || ""),
          lat: sanitizeInput(item.lat || ""),
          lon: sanitizeInput(item.lon || ""),
          address: {
            city: sanitizeInput(item.address?.city || ""),
            town: sanitizeInput(item.address?.town || ""),
            village: sanitizeInput(item.address?.village || ""),
            postcode: sanitizeInput(item.address?.postcode || ""),
            country: sanitizeInput(item.address?.country || ""),
          },
        }))
        : [];

      // Cache the result
      geocodeCache.set(cacheKey, { data: sanitizedResults, timestamp: now });

      // Clean up old cache entries periodically
      if (geocodeCache.size > 100) {
        const cutoff = now - CACHE_TTL;
        for (const [key, value] of geocodeCache.entries()) {
          if (value.timestamp < cutoff) {
            geocodeCache.delete(key);
          }
        }
      }

      return new Response(JSON.stringify(sanitizedResults), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "MISS",
          "Cache-Control": "public, max-age=600", // 10 minutes
        },
      });
    } catch (error) {
      console.error("Geocoding proxy error:", error);

      return new Response(
        JSON.stringify({
          error: "Geocoding service error",
          message:
            "Unable to verify address at this time. Please try again later.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
