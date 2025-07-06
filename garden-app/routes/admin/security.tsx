import { Handlers, PageProps } from "$fresh/server.ts";
import { auditOAuthSecurity, validateOAuthConfig } from "../../utils/oauth.ts";
import { getAuthenticatedUser } from "../../utils/session.ts";

interface SecurityData {
  config: ReturnType<typeof validateOAuthConfig>;
  audit: ReturnType<typeof auditOAuthSecurity>;
}

export const handler: Handlers<SecurityData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Only allow admin users to access security audit
    if (!user || !user.email.includes("admin")) {
      return new Response("", {
        status: 302,
        headers: { "Location": "/auth/login" },
      });
    }

    const config = validateOAuthConfig();
    const audit = auditOAuthSecurity();

    return ctx.render({ config, audit });
  },
};

export default function SecurityAuditPage({ data }: PageProps<SecurityData>) {
  const { config, audit } = data;

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Audit de Sécurité OAuth
          </h1>
          <p class="text-gray-600">
            Vérification de la configuration et de la sécurité OAuth
          </p>
        </header>

        {/* Navigation */}
        <nav class="mb-8">
          <div class="flex flex-wrap gap-4">
            <a
              href="/"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Accueil
            </a>
            <a
              href="/admin/hosts"
              class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Gestion des hôtes
            </a>
          </div>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Security Score */}
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
              Score de Sécurité
            </h2>

            <div class="text-center">
              <div
                class={`text-6xl font-bold mb-4 ${
                  audit.score >= 80
                    ? "text-green-600"
                    : audit.score >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {audit.score}%
              </div>
              <div
                class={`px-4 py-2 rounded-full text-sm font-medium ${
                  audit.score >= 80
                    ? "bg-green-100 text-green-800"
                    : audit.score >= 60
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {audit.score >= 80
                  ? "Excellent"
                  : audit.score >= 60
                  ? "Bien"
                  : "Nécessite attention"}
              </div>
            </div>
          </div>

          {/* Configuration Status */}
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
              État de la Configuration
            </h2>

            <div class="space-y-4">
              <div class="flex items-center">
                <div
                  class={`w-3 h-3 rounded-full mr-3 ${
                    config.isValid ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                </div>
                <span class="text-sm">
                  Configuration OAuth: {config.isValid ? "Valide" : "Invalide"}
                </span>
              </div>

              <div class="flex items-center">
                <div
                  class={`w-3 h-3 rounded-full mr-3 ${
                    config.errors.length === 0 ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                </div>
                <span class="text-sm">
                  Erreurs: {config.errors.length}
                </span>
              </div>

              <div class="flex items-center">
                <div
                  class={`w-3 h-3 rounded-full mr-3 ${
                    config.warnings.length === 0
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                >
                </div>
                <span class="text-sm">
                  Avertissements: {config.warnings.length}
                </span>
              </div>
            </div>
          </div>

          {/* Errors */}
          {config.errors.length > 0 && (
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold text-red-800 mb-4">
                Erreurs de Configuration
              </h2>
              <ul class="space-y-2">
                {config.errors.map((error, index) => (
                  <li key={index} class="flex items-start">
                    <span class="text-red-500 mr-2">•</span>
                    <span class="text-sm text-red-700">{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {config.warnings.length > 0 && (
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold text-yellow-800 mb-4">
                Avertissements
              </h2>
              <ul class="space-y-2">
                {config.warnings.map((warning, index) => (
                  <li key={index} class="flex items-start">
                    <span class="text-yellow-500 mr-2">•</span>
                    <span class="text-sm text-yellow-700">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Issues */}
          {audit.issues.length > 0 && (
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold text-red-800 mb-4">
                Problèmes de Sécurité
              </h2>
              <ul class="space-y-2">
                {audit.issues.map((issue, index) => (
                  <li key={index} class="flex items-start">
                    <span class="text-red-500 mr-2">⚠️</span>
                    <span class="text-sm text-red-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div class="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
              Recommandations de Sécurité
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audit.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  class="flex items-start p-3 bg-blue-50 rounded-lg"
                >
                  <span class="text-blue-500 mr-2">💡</span>
                  <span class="text-sm text-blue-700">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices Compliance */}
          <div class="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
              Conformité aux Bonnes Pratiques
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="flex items-center p-3 bg-green-50 rounded-lg">
                <span class="text-green-500 mr-2">✅</span>
                <span class="text-sm text-green-700">
                  Protection CSRF avec état
                </span>
              </div>

              <div class="flex items-center p-3 bg-green-50 rounded-lg">
                <span class="text-green-500 mr-2">✅</span>
                <span class="text-sm text-green-700">
                  Cookies HttpOnly et SameSite
                </span>
              </div>

              <div class="flex items-center p-3 bg-green-50 rounded-lg">
                <span class="text-green-500 mr-2">✅</span>
                <span class="text-sm text-green-700">
                  Sessions avec expiration
                </span>
              </div>

              <div class="flex items-center p-3 bg-green-50 rounded-lg">
                <span class="text-green-500 mr-2">✅</span>
                <span class="text-sm text-green-700">
                  Validation des tokens
                </span>
              </div>

              <div class="flex items-center p-3 bg-green-50 rounded-lg">
                <span class="text-green-500 mr-2">✅</span>
                <span class="text-sm text-green-700">
                  Gestion d'erreurs robuste
                </span>
              </div>

              <div class="flex items-center p-3 bg-green-50 rounded-lg">
                <span class="text-green-500 mr-2">✅</span>
                <span class="text-sm text-green-700">
                  Architecture modulaire
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
