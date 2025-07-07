import { Handlers, PageProps } from "$fresh/server.ts";
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
  hasPermission,
} from "../../utils/session.ts";
import { getSecurityEvents } from "../../utils/security.ts";
import Navigation from "../../components/Navigation.tsx";

interface SecurityDashboardData {
  securityEvents: Array<{
    type: string;
    ip: string;
    userAgent: string;
    url: string;
    timestamp: Date;
    details?: Record<string, unknown>;
  }>;
  user: AuthenticatedUser;
}

export const handler: Handlers<SecurityDashboardData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require admin access
    if (!user || !hasPermission(req, "admin")) {
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/auth/login?message=Accès administrateur requis",
        },
      });
    }

    const securityEvents = getSecurityEvents(50); // Get last 50 events

    return ctx.render({
      securityEvents,
      user,
    });
  },
};

export default function SecurityDashboard(
  { data }: PageProps<SecurityDashboardData>,
) {
  const { securityEvents, user } = data;

  const eventTypeColors = {
    auth_failure: "bg-red-100 text-red-800",
    rate_limit: "bg-yellow-100 text-yellow-800",
    suspicious_activity: "bg-orange-100 text-orange-800",
    xss_attempt: "bg-purple-100 text-purple-800",
    sql_injection_attempt: "bg-red-200 text-red-900",
  };

  const eventTypeLabels = {
    auth_failure: "Échec d'authentification",
    rate_limit: "Limite de taux dépassée",
    suspicious_activity: "Activité suspecte",
    xss_attempt: "Tentative XSS",
    sql_injection_attempt: "Tentative d'injection SQL",
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <header class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            Tableau de Bord Sécurité
          </h1>
          <p class="text-gray-600">
            Surveillance des événements de sécurité
          </p>
        </header>

        {/* Navigation */}
        <Navigation currentPath="/admin/security" user={user} />

        {/* Security Stats */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Total des événements
            </h3>
            <p class="text-3xl font-bold text-blue-600">
              {securityEvents.length}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Échecs d'auth
            </h3>
            <p class="text-3xl font-bold text-red-600">
              {securityEvents.filter((e) => e.type === "auth_failure").length}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Limite de taux
            </h3>
            <p class="text-3xl font-bold text-yellow-600">
              {securityEvents.filter((e) => e.type === "rate_limit").length}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">
              Activité suspecte
            </h3>
            <p class="text-3xl font-bold text-orange-600">
              {securityEvents.filter((e) => e.type === "suspicious_activity")
                .length}
            </p>
          </div>
        </div>

        {/* Security Events List */}
        <section class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-6">
            Événements de Sécurité Récents
          </h2>

          {securityEvents.length > 0
            ? (
              <div class="overflow-x-auto">
                <table class="w-full table-auto">
                  <thead>
                    <tr class="border-b border-gray-200">
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">
                        Type
                      </th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">
                        IP
                      </th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">
                        URL
                      </th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">
                        Timestamp
                      </th>
                      <th class="text-left py-3 px-4 font-semibold text-gray-700">
                        User Agent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.map((event, index) => (
                      <tr
                        key={index}
                        class="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td class="py-3 px-4">
                          <span
                            class={`px-2 py-1 rounded-full text-xs font-medium ${
                              eventTypeColors[
                                event.type as keyof typeof eventTypeColors
                              ] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {eventTypeLabels[
                              event.type as keyof typeof eventTypeLabels
                            ] || event.type}
                          </span>
                        </td>
                        <td class="py-3 px-4 font-mono text-sm">
                          {event.ip}
                        </td>
                        <td class="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {event.url}
                        </td>
                        <td class="py-3 px-4 text-sm text-gray-600">
                          {new Date(event.timestamp).toLocaleString("fr-FR")}
                        </td>
                        <td class="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                          {event.userAgent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
            : (
              <div class="text-center py-8">
                <p class="text-gray-600">Aucun événement de sécurité récent</p>
              </div>
            )}
        </section>

        {/* Security Recommendations */}
        <section class="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-blue-800 mb-4">
            Recommandations de Sécurité
          </h2>
          <ul class="space-y-2 text-blue-700">
            <li class="flex items-center">
              <span class="mr-2">🔒</span>
              Les headers de sécurité sont activés
            </li>
            <li class="flex items-center">
              <span class="mr-2">🛡️</span>
              La limitation de taux est en place
            </li>
            <li class="flex items-center">
              <span class="mr-2">📊</span>
              Les événements de sécurité sont surveillés
            </li>
            <li class="flex items-center">
              <span class="mr-2">🔐</span>
              L'authentification OAuth est sécurisée
            </li>
            <li class="flex items-center">
              <span class="mr-2">⚠️</span>
              Surveillez régulièrement ce tableau de bord
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
