import { Handlers, PageProps } from "$fresh/server.ts";
import { getAuthenticatedUser, getUserSessions } from "../utils/session.ts";
import { getEventsByHost } from "../utils/db-operations.ts";
import type { AuthenticatedUser, Session } from "../utils/session.ts";
import type { Event } from "../utils/db-operations.ts";
import MobileLayout from "../components/MobileLayout.tsx";

interface ProfileData {
  user: AuthenticatedUser;
  events: Event[];
  sessions: Session[];
}

export const handler: Handlers<ProfileData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    if (!user) {
      return new Response("", {
        status: 302,
        headers: { "Location": "/auth/login" },
      });
    }

    try {
      const events = getEventsByHost(user.id);
      const sessions = getUserSessions(user.id);

      return ctx.render({ user, events, sessions });
    } catch (error) {
      console.error("Error loading profile:", error);
      return new Response("", {
        status: 302,
        headers: { "Location": "/?error=Erreur lors du chargement du profil" },
      });
    }
  },
};

export default function ProfilePage({ data }: PageProps<ProfileData>) {
  const { user, events, sessions } = data;

  return (
    <MobileLayout
      user={user}
      currentPath="/profile"
      title="Mon Profil"
    >
      <div class="mb-6">
        <p class="text-gray-600 text-center">
          Gérez vos informations personnelles et vos événements
        </p>
      </div>

      <div class="space-y-6">
        {/* Profile Information */}
        <section class="card-elevated">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Informations personnelles
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <p class="text-gray-900 text-lg">{user.name}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p class="text-gray-900">{user.email}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Statut hôte
              </label>
              <span
                class={`badge ${
                  user.host_status === "approved"
                    ? "badge-success"
                    : user.host_status === "pending"
                    ? "badge-warning"
                    : "badge-error"
                }`}
              >
                {user.host_status === "approved"
                  ? "Approuvé"
                  : user.host_status === "pending"
                  ? "En attente"
                  : "Rejeté"}
              </span>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Membre depuis
              </label>
              <p class="text-gray-900">
                {new Date(user.created_at).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Dernière connexion
              </label>
              <p class="text-gray-900">
                {new Date(user.session.last_accessed).toLocaleDateString(
                  "fr-FR",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section class="card-elevated">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Mes événements ({events.length})
          </h2>

          {events.length > 0
            ? (
              <div class="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h3 class="font-semibold text-gray-900">
                          <a
                            href={`/events/${event.id}`}
                            class="hover:text-green-600"
                          >
                            {event.title}
                          </a>
                        </h3>
                        <p class="text-sm text-gray-600 mt-1">
                          {new Date(event.date).toLocaleDateString("fr-FR")} à
                          {" "}
                          {event.time}
                        </p>
                        <p class="text-sm text-gray-600">
                          {event.location}
                        </p>
                      </div>
                      <div class="text-right">
                        <span
                          class={`badge ${
                            new Date(event.date) >= new Date()
                              ? "badge-success"
                              : "badge-secondary"
                          }`}
                        >
                          {new Date(event.date) >= new Date()
                            ? "À venir"
                            : "Passé"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
            : (
              <div class="text-center py-8">
                <div class="text-6xl mb-4">📅</div>
                <p class="text-gray-600 mb-4">
                  Vous n'avez pas encore créé d'événements
                </p>
                {user.host_status === "approved"
                  ? (
                    <a
                      href="/host"
                      class="btn btn-primary inline-flex items-center"
                    >
                      <span class="mr-2">🌱</span>
                      Créer un événement
                    </a>
                  )
                  : (
                    <a
                      href="/host"
                      class="btn btn-accent inline-flex items-center"
                    >
                      <span class="mr-2">🌱</span>
                      Devenir hôte
                    </a>
                  )}
              </div>
            )}
        </section>

        {/* Security Section */}
        <section class="card-elevated">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Sécurité
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Méthode de connexion
              </label>
              <div class="flex items-center">
                {user.session.provider === "google" && (
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                    <span class="text-sm text-gray-900">Google</span>
                  </div>
                )}
                {user.session.provider === "apple" && (
                  <div class="flex items-center">
                    <svg
                      class="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <span class="text-sm text-gray-900">Apple</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Sessions actives
              </label>
              <p class="text-sm text-gray-600">
                {sessions.length} session{sessions.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section class="card-elevated">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Actions
          </h2>

          <div class="space-y-3">
            <a
              href="/auth/logout"
              class="btn btn-ghost bg-red-50 text-red-600 hover:bg-red-100 w-full text-center border-red-200"
            >
              Se déconnecter
            </a>

            {user.host_status === "approved" && (
              <a
                href="/host"
                class="btn btn-primary w-full text-center"
              >
                Créer un événement
              </a>
            )}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
}
