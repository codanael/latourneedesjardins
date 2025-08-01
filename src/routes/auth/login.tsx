import { Handlers, PageProps } from "$fresh/server.ts";
import { getAuthenticatedUser, logSecurityEvent } from "../../utils/session.ts";
import { isAppleOAuthEnabled } from "../../utils/env.ts";

interface LoginData {
  error?: string;
  message?: string;
  appleOAuthEnabled: boolean;
}

export const handler: Handlers<LoginData> = {
  GET(req, ctx) {
    // If user is already authenticated, redirect to home
    const user = getAuthenticatedUser(req);
    if (user) {
      logSecurityEvent("login_page_access_while_authenticated", user, {
        ip: req.headers.get("x-forwarded-for") || "unknown",
      });
      return new Response("", {
        status: 302,
        headers: { "Location": "/" },
      });
    }

    const url = new URL(req.url);
    const error = url.searchParams.get("error");
    const message = url.searchParams.get("message");

    // Log login page access
    logSecurityEvent("login_page_access", null, {
      ip: req.headers.get("x-forwarded-for") || "unknown",
      hasError: !!error,
      hasMessage: !!message,
    });

    return ctx.render({
      error: error || undefined,
      message: message || undefined,
      appleOAuthEnabled: isAppleOAuthEnabled(),
    });
  },
};

export default function LoginPage({ data }: PageProps<LoginData>) {
  return (
    <div class="min-h-screen bg-garden-gradient flex items-center justify-center">
      <div class="card-elevated max-w-md w-full mx-4 animate-scale-in">
        <div class="text-center mb-8">
          <div class="text-4xl mb-4">🌻</div>
          <h1 class="text-3xl font-bold text-green-800 mb-2">
            Connexion
          </h1>
          <p class="text-gray-600">
            Connectez-vous pour accéder à votre compte
          </p>
        </div>

        {data.error && (
          <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg animate-fade-in">
            <p class="text-red-700">{data.error}</p>
          </div>
        )}

        {data.message && (
          <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-lg animate-fade-in">
            <p class="text-blue-700">{data.message}</p>
          </div>
        )}

        <div class="space-y-4">
          {/* Google OAuth Button */}
          <a
            href="/auth/google"
            class="btn btn-secondary w-full justify-center inline-flex group"
          >
            <svg
              class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </a>

          {/* Apple OAuth Button */}
          {data.appleOAuthEnabled && (
            <a
              href="/auth/apple"
              class="btn w-full justify-center inline-flex bg-black hover:bg-gray-800 text-white border-black group"
            >
              <svg
                class="w-5 h-5 mr-3 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Continuer avec Apple
            </a>
          )}
        </div>

        <div class="mt-8 text-center">
          <p class="text-sm text-gray-600 leading-relaxed">
            Pas encore de compte ? L'inscription se fait automatiquement lors de
            la première connexion.
          </p>
        </div>

        {/* Development Mock Login */}
        {Deno.env.get("DENO_ENV") !== "production" && (
          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="text-center">
              <p class="text-xs text-gray-500 mb-3">
                Développement uniquement
              </p>
              <a
                href="/dev/mock-login"
                class="btn btn-ghost text-gray-600 hover:text-gray-800 text-sm"
              >
                🛠️ Mock Login
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
