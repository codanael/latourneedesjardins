/**
 * Security utilities for the garden application
 * Implements security headers, XSS protection, and other security measures
 */

import { FreshContext } from "$fresh/server.ts";

// Security headers configuration
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  frameOptions?: string;
  contentTypeOptions?: string;
  strictTransportSecurity?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  crossOriginEmbedderPolicy?: string;
  crossOriginOpenerPolicy?: string;
  crossOriginResourcePolicy?: string;
}

// Default security headers for production
export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openweathermap.org https://accounts.google.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
  frameOptions: "DENY",
  contentTypeOptions: "nosniff",
  strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: [
    "geolocation=()",
    "microphone=()",
    "camera=()",
    "payment=()",
    "usb=()",
    "bluetooth=()",
  ].join(", "),
  crossOriginEmbedderPolicy: "require-corp",
  crossOriginOpenerPolicy: "same-origin",
  crossOriginResourcePolicy: "same-origin",
};

// Development security headers (less strict)
export const DEV_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.openweathermap.org https://accounts.google.com ws://localhost:*",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  frameOptions: "SAMEORIGIN",
  contentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
};

/**
 * Middleware to add security headers to responses
 */
export async function securityHeaders(
  _req: Request,
  ctx: FreshContext,
  config?: SecurityHeadersConfig,
): Promise<Response> {
  const isDev = Deno.env.get("ENVIRONMENT") === "development";
  const headers = config ||
    (isDev ? DEV_SECURITY_HEADERS : DEFAULT_SECURITY_HEADERS);

  const response = await ctx.next();

  if (response) {
    // Add security headers to the response
    if (headers.contentSecurityPolicy) {
      response.headers.set(
        "Content-Security-Policy",
        headers.contentSecurityPolicy,
      );
    }
    if (headers.frameOptions) {
      response.headers.set("X-Frame-Options", headers.frameOptions);
    }
    if (headers.contentTypeOptions) {
      response.headers.set(
        "X-Content-Type-Options",
        headers.contentTypeOptions,
      );
    }
    if (headers.strictTransportSecurity) {
      response.headers.set(
        "Strict-Transport-Security",
        headers.strictTransportSecurity,
      );
    }
    if (headers.referrerPolicy) {
      response.headers.set("Referrer-Policy", headers.referrerPolicy);
    }
    if (headers.permissionsPolicy) {
      response.headers.set("Permissions-Policy", headers.permissionsPolicy);
    }
    if (headers.crossOriginEmbedderPolicy) {
      response.headers.set(
        "Cross-Origin-Embedder-Policy",
        headers.crossOriginEmbedderPolicy,
      );
    }
    if (headers.crossOriginOpenerPolicy) {
      response.headers.set(
        "Cross-Origin-Opener-Policy",
        headers.crossOriginOpenerPolicy,
      );
    }
    if (headers.crossOriginResourcePolicy) {
      response.headers.set(
        "Cross-Origin-Resource-Policy",
        headers.crossOriginResourcePolicy,
      );
    }
  }
  return response;
}

/**
 * HTTPS enforcement middleware
 */
export async function httpsRedirect(
  req: Request,
  ctx: FreshContext,
): Promise<Response> {
  const url = new URL(req.url);
  const isProduction = Deno.env.get("ENVIRONMENT") === "production";

  // Only enforce HTTPS in production
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

  return await ctx.next();
}

/**
 * Input sanitization utility
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Remove data: protocol
    .replace(/vbscript:/gi, "") // Remove vbscript: protocol
    .trim();
}

/**
 * HTML output sanitization
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Basic HTML sanitization - remove dangerous tags and attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "") // Remove iframe tags
    .replace(/<object[^>]*>.*?<\/object>/gi, "") // Remove object tags
    .replace(/<embed[^>]*>.*?<\/embed>/gi, "") // Remove embed tags
    .replace(/<form[^>]*>.*?<\/form>/gi, "") // Remove form tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers
    .replace(/javascript:\s*[^"']*/gi, "") // Remove javascript: protocol
    .replace(/data:\s*[^"']*/gi, "") // Remove data: protocol
    .replace(/vbscript:\s*[^"']*/gi, ""); // Remove vbscript: protocol
}

/**
 * Rate limiting store
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  identifier: (req: Request) => string = (req) => {
    // Use IP address as default identifier
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : req.headers.get("x-real-ip") || "unknown";
    return ip;
  },
) {
  return async (req: Request, ctx: FreshContext): Promise<Response> => {
    const key = identifier(req);
    const now = Date.now();

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }

    const current = rateLimitStore.get(key);

    if (!current) {
      // First request from this identifier
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return await ctx.next();
    }

    if (current.resetTime < now) {
      // Window has expired, reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return await ctx.next();
    }

    if (current.count >= maxRequests) {
      // Rate limit exceeded
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((current.resetTime - now) / 1000)
              .toString(),
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(current.resetTime / 1000).toString(),
          },
        },
      );
    }

    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);

    const response = await ctx.next();

    // Add rate limit headers to response
    if (response) {
      response.headers.set("X-RateLimit-Limit", maxRequests.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        (maxRequests - current.count).toString(),
      );
      response.headers.set(
        "X-RateLimit-Reset",
        Math.ceil(current.resetTime / 1000).toString(),
      );
    }
    return response;
  };
}

/**
 * Security event logging
 */
export interface SecurityEvent {
  type:
    | "auth_failure"
    | "rate_limit"
    | "suspicious_activity"
    | "xss_attempt"
    | "sql_injection_attempt";
  ip: string;
  userAgent: string;
  url: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

const securityEvents: SecurityEvent[] = [];

/**
 * Log security events
 */
export function logSecurityEvent(event: SecurityEvent): void {
  securityEvents.push(event);

  // Log to console in development
  if (Deno.env.get("ENVIRONMENT") === "development") {
    console.warn("🔒 Security Event:", event);
  }

  // In production, you might want to send to a security monitoring service
  // TODO: Implement external security monitoring integration

  // Keep only the last 1000 events in memory
  if (securityEvents.length > 1000) {
    securityEvents.shift();
  }
}

/**
 * Get recent security events (for admin dashboard)
 */
export function getSecurityEvents(limit: number = 100): SecurityEvent[] {
  return securityEvents.slice(-limit);
}


/**
 * Security middleware composer
 */
export function createSecurityMiddleware(config?: {
  securityHeaders?: SecurityHeadersConfig;
  httpsRedirect?: boolean;
  rateLimit?: { maxRequests: number; windowMs: number };
}) {
  const middlewares = [];

  // HTTPS redirect (first in chain)
  if (config?.httpsRedirect !== false) {
    middlewares.push(httpsRedirect);
  }

  // Rate limiting
  if (config?.rateLimit) {
    middlewares.push(
      rateLimit(config.rateLimit.maxRequests, config.rateLimit.windowMs),
    );
  }

  // Security headers (last in chain)
  middlewares.push((req: Request, ctx: FreshContext) =>
    securityHeaders(req, ctx, config?.securityHeaders)
  );

  return middlewares;
}
