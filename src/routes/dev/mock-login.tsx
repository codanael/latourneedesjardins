import { Handlers, PageProps } from "$fresh/server.ts";
import { getAllUsers, User } from "../../utils/db-operations.ts";
import { setCookie } from "jsr:@std/http/cookie";
import { createSession } from "../../utils/session.ts";

interface MockLoginData {
  users: User[];
  success?: boolean;
  error?: string;
}

export const handler: Handlers<MockLoginData> = {
  GET(_req, ctx) {
    // Only allow in development
    if (Deno.env.get("DENO_ENV") === "production") {
      return new Response("Not found", { status: 404 });
    }

    const users = getAllUsers();
    return ctx.render({ users });
  },

  POST(req, ctx) {
    // Only allow in development
    if (Deno.env.get("DENO_ENV") === "production") {
      return new Response("Not found", { status: 404 });
    }

    return new Promise((resolve) => {
      req.formData().then((formData) => {
        const userId = formData.get("userId")?.toString();

        if (!userId) {
          const users = getAllUsers();
          resolve(ctx.render({ users, error: "Utilisateur requis" }));
          return;
        }

        const user = getAllUsers().find((u) => u.id === parseInt(userId));
        if (!user) {
          const users = getAllUsers();
          resolve(ctx.render({ users, error: "Utilisateur non trouvé" }));
          return;
        }

        // Create a proper session in the database
        const sessionId = createSession(
          user.id,
          "mock", // provider
          req.headers.get("user-agent") || "Mock Login",
          req.headers.get("x-forwarded-for") || "127.0.0.1",
        );

        // Set session cookie
        const headers = new Headers();
        setCookie(headers, {
          name: "session",
          value: sessionId,
          httpOnly: true,
          secure: false, // Development only
          sameSite: "Lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        // Redirect to home
        headers.set("Location", "/");
        resolve(new Response("", { status: 302, headers }));
      });
    });
  },
};

export default function MockLoginPage({ data }: PageProps<MockLoginData>) {
  const { users, success, error } = data;

  // Only show in development
  if (Deno.env.get("DENO_ENV") === "production") {
    return (
      <div class="min-h-screen bg-garden-gradient flex items-center justify-center">
        <div class="card-elevated text-center max-w-md mx-4">
          <h1 class="text-2xl font-bold text-red-600 mb-4">
            Page non trouvée
          </h1>
          <p class="text-gray-600 mb-6">
            Cette page n'existe pas en production.
          </p>
          <a href="/" class="btn btn-primary">
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-garden-gradient">
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-md mx-auto">
          <div class="card-elevated">
            <div class="text-center mb-6">
              <div class="text-4xl mb-4">🛠️</div>
              <h1 class="text-2xl font-bold text-green-800 mb-2">
                Mock Login
              </h1>
              <p class="text-gray-600 text-sm">
                Développement uniquement
              </p>
            </div>

            {success && (
              <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-lg">
                <p class="text-green-700">Connexion réussie !</p>
              </div>
            )}

            {error && (
              <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
                <p class="text-red-700">{error}</p>
              </div>
            )}

            <form method="POST" class="space-y-4">
              <div>
                <label class="form-label">
                  Sélectionner un utilisateur
                </label>
                <select
                  name="userId"
                  required
                  class="form-select"
                >
                  <option value="">Choisir un utilisateur...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                      {user.host_status && ` - ${user.host_status}`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                class="btn btn-primary w-full"
              >
                Se connecter
              </button>
            </form>

            <div class="mt-6 pt-6 border-t border-gray-200">
              <h3 class="text-sm font-semibold text-gray-700 mb-3">
                Utilisateurs disponibles:
              </h3>
              <div class="space-y-2 text-xs">
                {users.map((user) => (
                  <div
                    key={user.id}
                    class="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <div class="font-medium">{user.name}</div>
                      <div class="text-gray-600">{user.email}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-green-600 font-medium">{user.role}</div>
                      {user.host_status && (
                        <div class="text-amber-600">{user.host_status}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div class="mt-6 text-center">
            <a href="/auth/login" class="btn btn-secondary">
              Connexion OAuth normale
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
