export const env = {
  // Database
  DATABASE_URL: Deno.env.get("DATABASE_URL") || "./database.sqlite",

  // Application
  DENO_ENV: Deno.env.get("DENO_ENV") || "development",
  PORT: Number(Deno.env.get("PORT")) || 8000,
  HOSTNAME: Deno.env.get("HOSTNMAE") || "0.0.0.0",
  APP_NAME: Deno.env.get("APP_NAME") || "La Tournée des Jardins",
  APP_VERSION: Deno.env.get("APP_VERSION") || "1.0.0",

  // Weather API
  WEATHER_API_KEY: Deno.env.get("WEATHER_API_KEY") || "",
  WEATHER_API_URL: Deno.env.get("WEATHER_API_URL") ||
    "https://api.openweathermap.org/data/2.5",

  // Security
  JWT_SECRET: Deno.env.get("JWT_SECRET") || "",
  SESSION_SECRET: Deno.env.get("SESSION_SECRET") || "",

  // OAuth
  GOOGLE_CLIENT_ID: Deno.env.get("GOOGLE_CLIENT_ID") || "",
  GOOGLE_CLIENT_SECRET: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",

  // CORS
  CORS_ORIGIN: Deno.env.get("CORS_ORIGIN") || "http://localhost:8000",
};

// Validate required environment variables
export function validateEnv() {
  const errors: string[] = [];

  // Check for required environment variables in all environments
  const requiredEnvVars = [
    "DATABASE_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ];
  const missingVars = requiredEnvVars.filter((varName) =>
    !Deno.env.get(varName)
  );

  if (missingVars.length > 0) {
    errors.push(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }

  // Production-specific validation
  if (env.DENO_ENV === "production") {
    if (!env.JWT_SECRET || env.JWT_SECRET.includes("change_in_production")) {
      errors.push("JWT_SECRET must be set in production");
    }

    if (
      !env.SESSION_SECRET || env.SESSION_SECRET.includes("change_in_production")
    ) {
      errors.push("SESSION_SECRET must be set in production");
    }

    if (
      !env.WEATHER_API_KEY ||
      env.WEATHER_API_KEY.includes("your_openweathermap_api_key_here")
    ) {
      errors.push("WEATHER_API_KEY must be set for weather functionality");
    }
  }

  // Format validation warnings
  if (
    env.GOOGLE_CLIENT_ID &&
    !env.GOOGLE_CLIENT_ID.includes(".googleusercontent.com")
  ) {
    console.warn("⚠️  Google OAuth Client ID format may be incorrect");
  }

  // Handle validation errors
  if (errors.length > 0) {
    console.error("Environment validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));

    if (env.DENO_ENV === "production") {
      Deno.exit(1);
    }
  }

  return env;
}
