import { getCookies } from "$std/http/cookie.ts";
import { decodeBase64 } from "$std/encoding/base64.ts";

export interface OAuthProvider {
  name: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: string;
}

// OAuth Configuration
export function getGoogleOAuthConfig(): OAuthProvider {
  const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";

  return {
    name: "google",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    clientId: Deno.env.get("GOOGLE_CLIENT_ID") || "",
    clientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
    redirectUri: `${appUrl}/auth/callback/google`,
    scope: ["openid", "email", "profile"],
  };
}

export function getAppleOAuthConfig(): OAuthProvider {
  const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";

  return {
    name: "apple",
    authorizationEndpoint: "https://appleid.apple.com/auth/authorize",
    tokenEndpoint: "https://appleid.apple.com/auth/token",
    clientId: Deno.env.get("APPLE_CLIENT_ID") || "",
    clientSecret: Deno.env.get("APPLE_CLIENT_SECRET") || "",
    redirectUri: `${appUrl}/auth/callback/apple`,
    scope: ["email", "name"],
  };
}

// OAuth configuration helpers
export function validateOAuthProvider(provider: OAuthProvider): boolean {
  return !!(provider.clientId && provider.clientSecret &&
    provider.authorizationEndpoint && provider.tokenEndpoint);
}

// Generate authorization URL
export function getAuthorizationUrl(
  provider: OAuthProvider,
  state?: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    scope: provider.scope.join(" "),
    state: state || generateRandomState(),
  });

  // Apple-specific parameters
  if (provider.name === "apple") {
    params.set("response_mode", "form_post");
  }

  return `${provider.authorizationEndpoint}?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
): Promise<{ access_token: string; id_token?: string }> {
  try {
    // Use direct fetch instead of OAuth2Client to avoid redirect validation issues
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      redirect_uri: provider.redirectUri,
      code: code,
    });

    const response = await fetch(provider.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Token exchange failed (${provider.name}):`,
        response.status,
        errorText,
      );
      throw new Error(
        `Token exchange failed: ${response.status} ${response.statusText}`,
      );
    }

    const tokens = await response.json();

    return {
      access_token: tokens.access_token,
      id_token: tokens.id_token,
    };
  } catch (error) {
    console.error(`Error exchanging code for token (${provider.name}):`, error);
    throw new Error(`Failed to exchange authorization code for token`);
  }
}

// Get user info from provider
export async function getUserInfo(
  provider: OAuthProvider,
  accessToken: string,
  idToken?: string,
): Promise<OAuthUserInfo> {
  if (provider.name === "google") {
    return await getGoogleUserInfo(accessToken);
  } else if (provider.name === "apple") {
    return await getAppleUserInfo(idToken || accessToken);
  }

  throw new Error(`Unsupported provider: ${provider.name}`);
}

// Google user info
async function getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  // Validate input
  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("Invalid access token provided");
  }

  const response = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google user info fetch failed:", response.status, errorText);
    throw new Error(`Failed to fetch Google user info: ${response.status}`);
  }

  const data = await response.json();

  // Validate required fields
  if (!data.id || !data.email) {
    throw new Error("Invalid user data: missing required fields");
  }

  // Validate email format
  if (!isValidEmail(data.email)) {
    throw new Error("Invalid email format from Google");
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name || data.email.split("@")[0],
    picture: data.picture,
    provider: "google",
  };
}

// Apple user info (from ID token)
function getAppleUserInfo(idToken: string): OAuthUserInfo {
  try {
    // Validate input
    if (!idToken || typeof idToken !== "string") {
      throw new Error("Invalid ID token provided");
    }

    // Parse JWT payload (basic implementation)
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid ID token format");
    }

    const payload = JSON.parse(
      new TextDecoder().decode(decodeBase64(parts[1])),
    );

    // Validate required fields
    if (!payload.sub || !payload.email) {
      throw new Error("Invalid token payload: missing required fields");
    }

    // Validate email format
    if (!isValidEmail(payload.email)) {
      throw new Error("Invalid email format in token");
    }

    // Check token expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error("Token has expired");
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name?.firstName && payload.name?.lastName
        ? `${payload.name.firstName} ${payload.name.lastName}`
        : payload.email.split("@")[0],
      provider: "apple",
    };
  } catch (error) {
    console.error("Error parsing Apple ID token:", error);
    throw new Error("Failed to parse Apple user info");
  }
}

// Session management
export function generateRandomState(): string {
  return crypto.randomUUID();
}

export function createSessionCookie(
  sessionId: string,
  secure?: boolean,
): string {
  // Auto-detect if we should use secure cookies based on environment
  const isProduction = Deno.env.get("DENO_ENV") === "production";
  const useSecure = secure !== undefined ? secure : isProduction;

  const cookieOptions = {
    httpOnly: true,
    secure: useSecure,
    sameSite: "Lax" as const,
    maxAge: 24 * 60 * 60, // 24 hours (matching session expiration)
    path: "/",
  };

  return `session=${sessionId}; HttpOnly; ${
    cookieOptions.secure ? "Secure; " : ""
  }SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`;
}

export function parseSessionCookie(
  cookieHeader: string,
): string | null {
  try {
    const headers = new Headers();
    headers.set("cookie", cookieHeader);
    const cookies = getCookies(headers);
    return cookies.session || null;
  } catch (error) {
    console.error("Error parsing session cookie:", error);
    return null;
  }
}

// Utility functions
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateOAuthConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Google OAuth validation
  if (!Deno.env.get("GOOGLE_CLIENT_ID")) {
    errors.push("GOOGLE_CLIENT_ID is required");
  }
  if (!Deno.env.get("GOOGLE_CLIENT_SECRET")) {
    errors.push("GOOGLE_CLIENT_SECRET is required");
  }

  // Apple OAuth validation (optional)
  const hasAppleClientId = Deno.env.get("APPLE_CLIENT_ID");
  const hasAppleClientSecret = Deno.env.get("APPLE_CLIENT_SECRET");

  if (hasAppleClientId && !hasAppleClientSecret) {
    errors.push("APPLE_CLIENT_SECRET is required when APPLE_CLIENT_ID is set");
  }
  if (hasAppleClientSecret && !hasAppleClientId) {
    errors.push("APPLE_CLIENT_ID is required when APPLE_CLIENT_SECRET is set");
  }

  // General validation
  const sessionSecret = Deno.env.get("SESSION_SECRET");
  if (!sessionSecret) {
    errors.push("SESSION_SECRET is required");
  } else if (sessionSecret.length < 32) {
    warnings.push(
      "SESSION_SECRET should be at least 32 characters for security",
    );
  }

  const appUrl = Deno.env.get("APP_URL");
  if (!appUrl) {
    errors.push("APP_URL is required");
  } else {
    // Validate production URL uses HTTPS
    const isProduction = Deno.env.get("DENO_ENV") === "production";
    if (isProduction && !appUrl.startsWith("https://")) {
      errors.push("APP_URL must use HTTPS in production");
    }
  }

  // Security warnings for production
  const isProduction = Deno.env.get("DENO_ENV") === "production";
  if (isProduction) {
    if (
      Deno.env.get("GOOGLE_CLIENT_SECRET") === "your_google_client_secret_here"
    ) {
      errors.push("Default Google client secret must be changed in production");
    }
    if (
      hasAppleClientSecret &&
      Deno.env.get("APPLE_CLIENT_SECRET") === "your_apple_client_secret_here"
    ) {
      errors.push("Default Apple client secret must be changed in production");
    }
    if (sessionSecret === "your_session_secret_here_change_in_production") {
      errors.push("Default session secret must be changed in production");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Security audit function
export function auditOAuthSecurity(): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  const config = validateOAuthConfig();

  // Check configuration
  if (!config.isValid) {
    issues.push("OAuth configuration incomplete");
    score -= 30;
  }

  if (config.warnings.length > 0) {
    issues.push("Configuration warnings present");
    score -= 10;
  }

  // Check environment setup
  const isProduction = Deno.env.get("DENO_ENV") === "production";
  if (isProduction) {
    const appUrl = Deno.env.get("APP_URL");
    if (appUrl && !appUrl.startsWith("https://")) {
      issues.push("Not using HTTPS in production");
      score -= 25;
    }
  }

  // Recommendations
  recommendations.push("Regularly rotate OAuth client secrets");
  recommendations.push("Monitor session activity for suspicious patterns");
  recommendations.push("Implement rate limiting for authentication endpoints");
  recommendations.push("Set up security monitoring and alerting");

  if (!isProduction) {
    recommendations.push("Configure HTTPS for production deployment");
    recommendations.push("Use strong, unique secrets in production");
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}
