import { Handlers, PageProps } from "$fresh/server.ts";
import { getHostsByStatus, User } from "../../utils/db-operations.ts";

interface HostAdminData {
  hosts: {
    pending: User[];
    approved: User[];
    rejected: User[];
  };
}

export const handler: Handlers<HostAdminData> = {
  GET(_req, ctx) {
    try {
      const pendingHosts = getHostsByStatus('pending');
      const approvedHosts = getHostsByStatus('approved');
      const rejectedHosts = getHostsByStatus('rejected');

      return ctx.render({
        hosts: {
          pending: pendingHosts,
          approved: approvedHosts,
          rejected: rejectedHosts,
        }
      });
    } catch (error) {
      console.error("Error loading hosts:", error);
      return ctx.render({
        hosts: {
          pending: [],
          approved: [],
          rejected: [],
        }
      });
    }
  },
};

export default function AdminHostsPage({ data }: PageProps<HostAdminData>) {
  const { hosts } = data;

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Administration des Hôtes
          </h1>
          <p class="text-gray-600">
            Gérez les candidatures et le statut des hôtes
          </p>
        </header>

        {/* Navigation */}
        <nav class="mb-8">
          <div class="flex flex-wrap gap-4">
            <a
              href="/"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Retour à l'accueil
            </a>
            <a
              href="/host/dashboard"
              class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Tableau de bord hôte
            </a>
          </div>
        </nav>

        {/* Summary Cards */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="text-2xl">⏳</div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-yellow-800">En attente</p>
                <p class="text-2xl font-bold text-yellow-900">{hosts.pending.length}</p>
              </div>
            </div>
          </div>

          <div class="bg-green-50 border-l-4 border-green-400 p-6 rounded-lg">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="text-2xl">✅</div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-green-800">Approuvés</p>
                <p class="text-2xl font-bold text-green-900">{hosts.approved.length}</p>
              </div>
            </div>
          </div>

          <div class="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="text-2xl">❌</div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-red-800">Rejetés</p>
                <p class="text-2xl font-bold text-red-900">{hosts.rejected.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Hosts Section */}
        <section class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Candidatures en attente ({hosts.pending.length})
          </h2>
          
          {hosts.pending.length > 0 ? (
            <div class="space-y-4">
              {hosts.pending.map((host) => (
                <HostCard key={host.id} host={host} status="pending" />
              ))}
            </div>
          ) : (
            <p class="text-gray-600 text-center py-8">
              Aucune candidature en attente
            </p>
          )}
        </section>

        {/* Approved Hosts Section */}
        <section class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Hôtes approuvés ({hosts.approved.length})
          </h2>
          
          {hosts.approved.length > 0 ? (
            <div class="space-y-4">
              {hosts.approved.slice(0, 5).map((host) => (
                <HostCard key={host.id} host={host} status="approved" />
              ))}
              {hosts.approved.length > 5 && (
                <p class="text-sm text-gray-600 text-center">
                  ... et {hosts.approved.length - 5} autres hôtes approuvés
                </p>
              )}
            </div>
          ) : (
            <p class="text-gray-600 text-center py-8">
              Aucun hôte approuvé
            </p>
          )}
        </section>

        {/* Rejected Hosts Section */}
        {hosts.rejected.length > 0 && (
          <section class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">
              Candidatures rejetées ({hosts.rejected.length})
            </h2>
            
            <div class="space-y-4">
              {hosts.rejected.map((host) => (
                <HostCard key={host.id} host={host} status="rejected" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function HostCard({ host, status }: { host: User; status: string }) {

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };

  const statusLabels = {
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Rejeté",
  };

  return (
    <div class={`border rounded-lg p-4 ${statusColors[status as keyof typeof statusColors]}`}>
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div class="flex-1 mb-4 md:mb-0">
          <h3 class="font-semibold text-lg">{host.name}</h3>
          <p class="text-sm opacity-75">{host.email}</p>
          <p class="text-xs opacity-60 mt-1">
            Inscrit le {new Date(host.created_at).toLocaleDateString("fr-FR")}
          </p>
          {host.confirmed_at && (
            <p class="text-xs opacity-60">
              Confirmé le {new Date(host.confirmed_at).toLocaleDateString("fr-FR")}
            </p>
          )}
          {host.admin_notes && (
            <p class="text-sm mt-2 p-2 bg-white bg-opacity-50 rounded">
              <strong>Notes admin:</strong> {host.admin_notes}
            </p>
          )}
        </div>

        <div class="flex items-center space-x-2">
          <span class={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
            {statusLabels[status as keyof typeof statusLabels]}
          </span>
          
          {status === 'pending' && (
            <div class="flex space-x-2">
              <form method="POST" action="/api/hosts/status" style={{ display: 'inline' }}>
                <input type="hidden" name="email" value={host.email} />
                <input type="hidden" name="action" value="approve" />
                <input type="hidden" name="adminNotes" value="Approuvé via interface admin" />
                <button
                  type="submit"
                  class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Approuver
                </button>
              </form>
              <form method="POST" action="/api/hosts/status" style={{ display: 'inline' }}>
                <input type="hidden" name="email" value={host.email} />
                <input type="hidden" name="action" value="reject" />
                <input type="hidden" name="adminNotes" value="Rejeté via interface admin" />
                <button
                  type="submit"
                  class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Rejeter
                </button>
              </form>
            </div>
          )}
          
          {status !== 'pending' && (
            <form method="POST" action="/api/hosts/status" style={{ display: 'inline' }}>
              <input type="hidden" name="email" value={host.email} />
              <input type="hidden" name="action" value="pending" />
              <input type="hidden" name="adminNotes" value="Remis en attente via interface admin" />
              <button
                type="submit"
                class="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Remettre en attente
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}