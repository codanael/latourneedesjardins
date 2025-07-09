import { Handlers, PageProps } from "$fresh/server.ts";
import {
  createEvent,
  Event,
  getAllEvents,
  getAllUsers,
  getEventStats,
  User,
} from "../../utils/db-operations.ts";
import { getAuthenticatedUser, hasPermission } from "../../utils/session.ts";
import MobileLayout from "../../components/MobileLayout.tsx";
import DeleteEventButton from "../../islands/DeleteEventButton.tsx";
import { sanitizeHtml, sanitizeInput } from "../../utils/security.ts";

interface EventWithStats extends Event {
  rsvp_stats: { response: string; count: number }[];
  potluck_count: number;
  total_rsvps: number;
}

interface AdminEventsData {
  events: EventWithStats[];
  users: User[];
  user: ReturnType<typeof getAuthenticatedUser>;
  success?: boolean;
  error?: string;
  formValues?: Record<string, string>;
}

export const handler: Handlers<AdminEventsData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require admin authentication
    if (!user || !hasPermission(req, "admin")) {
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/auth/login?message=Accès administrateur requis",
        },
      });
    }

    const events = getAllEvents();
    const users = getAllUsers();

    const eventsWithStats: EventWithStats[] = events.map((event) => {
      const stats = getEventStats(event.id);
      const totalRsvps = stats.rsvp_stats.reduce(
        (sum, stat) => sum + stat.count,
        0,
      );

      return {
        ...event,
        rsvp_stats: stats.rsvp_stats,
        potluck_count: stats.potluck_count,
        total_rsvps: totalRsvps,
      };
    });

    return ctx.render({
      events: eventsWithStats,
      users: users.filter((u) => u.host_status === "approved"),
      user,
    });
  },

  async POST(req, ctx) {
    const user = getAuthenticatedUser(req);

    // Require admin authentication
    if (!user || !hasPermission(req, "admin")) {
      return new Response("", {
        status: 302,
        headers: {
          "Location": "/auth/login?message=Accès administrateur requis",
        },
      });
    }

    const formData = await req.formData();

    const eventData = {
      title: sanitizeInput(formData.get("title")?.toString() || ""),
      description: sanitizeHtml(formData.get("description")?.toString() || ""),
      date: sanitizeInput(formData.get("date")?.toString() || ""),
      time: sanitizeInput(formData.get("time")?.toString() || "14:00"),
      location: sanitizeInput(formData.get("location")?.toString() || ""),
      theme: sanitizeInput(formData.get("theme")?.toString() || ""),
      maxAttendees: sanitizeInput(
        formData.get("maxAttendees")?.toString() || "15",
      ),
      specialInstructions: sanitizeHtml(
        formData.get("specialInstructions")?.toString() || "",
      ),
      hostId: sanitizeInput(formData.get("hostId")?.toString() || ""),
    };

    // Convert to form values for re-display on error
    const formValues = Object.fromEntries(
      Object.entries(eventData).map((
        [key, value],
      ) => [key, value?.toString() || ""]),
    );

    try {
      // Enhanced validation
      const errors: string[] = [];

      if (!eventData.title.trim()) errors.push("Le titre est requis");
      if (!eventData.date.trim()) errors.push("La date est requise");
      if (!eventData.location.trim()) errors.push("L'adresse est requise");
      if (!eventData.hostId.trim()) errors.push("L'hôte est requis");

      // Date validation
      if (eventData.date) {
        const eventDate = new Date(eventData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
          errors.push("La date doit être dans le futur");
        }
      }

      // Max attendees validation
      const maxAttendees = parseInt(eventData.maxAttendees);
      if (isNaN(maxAttendees) || maxAttendees < 1 || maxAttendees > 100) {
        errors.push("Le nombre de participants doit être entre 1 et 100");
      }

      // Host validation
      const hostId = parseInt(eventData.hostId);
      if (isNaN(hostId)) {
        errors.push("Hôte invalide");
      }

      if (errors.length > 0) {
        const events = getAllEvents();
        const users = getAllUsers();
        const eventsWithStats: EventWithStats[] = events.map((event) => {
          const stats = getEventStats(event.id);
          const totalRsvps = stats.rsvp_stats.reduce(
            (sum, stat) => sum + stat.count,
            0,
          );

          return {
            ...event,
            rsvp_stats: stats.rsvp_stats,
            potluck_count: stats.potluck_count,
            total_rsvps: totalRsvps,
          };
        });

        return ctx.render({
          events: eventsWithStats,
          users: users.filter((u) => u.host_status === "approved"),
          user,
          error: errors.join(", "),
          formValues,
        });
      }

      // Create event
      const event = createEvent({
        title: eventData.title,
        description: eventData.description ||
          `Événement créé par l'administrateur`,
        date: eventData.date,
        time: eventData.time,
        location: eventData.location,
        host_id: hostId,
        theme: eventData.theme || "Garden Party",
        max_attendees: parseInt(eventData.maxAttendees),
        special_instructions: eventData.specialInstructions,
        weather_location: eventData.location,
      });

      console.log("Admin created event:", { admin: user, event });

      const events = getAllEvents();
      const users = getAllUsers();
      const eventsWithStats: EventWithStats[] = events.map((event) => {
        const stats = getEventStats(event.id);
        const totalRsvps = stats.rsvp_stats.reduce(
          (sum, stat) => sum + stat.count,
          0,
        );

        return {
          ...event,
          rsvp_stats: stats.rsvp_stats,
          potluck_count: stats.potluck_count,
          total_rsvps: totalRsvps,
        };
      });

      return ctx.render({
        events: eventsWithStats,
        users: users.filter((u) => u.host_status === "approved"),
        user,
        success: true,
      });
    } catch (error) {
      console.error("Error creating admin event:", error);

      const events = getAllEvents();
      const users = getAllUsers();
      const eventsWithStats: EventWithStats[] = events.map((event) => {
        const stats = getEventStats(event.id);
        const totalRsvps = stats.rsvp_stats.reduce(
          (sum, stat) => sum + stat.count,
          0,
        );

        return {
          ...event,
          rsvp_stats: stats.rsvp_stats,
          potluck_count: stats.potluck_count,
          total_rsvps: totalRsvps,
        };
      });

      return ctx.render({
        events: eventsWithStats,
        users: users.filter((u) => u.host_status === "approved"),
        user,
        error: "Erreur lors de la création de l'événement",
        formValues,
      });
    }
  },
};

export default function AdminEventsPage({ data }: PageProps<AdminEventsData>) {
  const { events, users, user, success, error, formValues = {} } = data;

  return (
    <MobileLayout
      user={user}
      currentPath="/admin/events"
      title="Gestion des événements"
    >
      <div class="mb-6">
        <p class="text-green-600 text-center">
          Gérez tous les événements et créez des événements pour les hôtes
        </p>
      </div>

      {/* Create Event Form */}
      <section class="card-elevated mb-8">
        <h2 class="text-xl font-semibold text-green-800 mb-6">
          Créer un événement
        </h2>

        {success && (
          <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-lg">
            <p class="text-green-700">Événement créé avec succès !</p>
          </div>
        )}

        {error && (
          <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
            <p class="text-red-700">{error}</p>
          </div>
        )}

        <form method="POST" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Titre *</label>
              <input
                type="text"
                name="title"
                required
                value={formValues.title || ""}
                class="form-input"
                placeholder="Titre de l'événement"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Hôte *</label>
              <select
                name="hostId"
                required
                value={formValues.hostId || ""}
                class="form-select"
              >
                <option value="">Sélectionner un hôte</option>
                {users.map((host) => (
                  <option key={host.id} value={host.id}>
                    {host.name} ({host.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input
                type="date"
                name="date"
                required
                value={formValues.date || ""}
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Heure</label>
              <input
                type="time"
                name="time"
                value={formValues.time || "14:00"}
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Lieu *</label>
            <input
              type="text"
              name="location"
              required
              value={formValues.location || ""}
              class="form-input"
              placeholder="Adresse complète"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              name="description"
              rows={3}
              class="form-textarea"
              placeholder="Description de l'événement..."
            >
              {formValues.description || ""}
            </textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Thème</label>
              <input
                type="text"
                name="theme"
                value={formValues.theme || ""}
                class="form-input"
                placeholder="Garden Party, Brunch..."
              />
            </div>

            <div class="form-group">
              <label class="form-label">Nombre max de participants</label>
              <input
                type="number"
                name="maxAttendees"
                min="1"
                max="100"
                value={formValues.maxAttendees || "15"}
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Instructions spéciales</label>
            <textarea
              name="specialInstructions"
              rows={2}
              class="form-textarea"
              placeholder="Parking, accès PMR, etc..."
            >
              {formValues.specialInstructions || ""}
            </textarea>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full"
          >
            <span class="mr-2">🌱</span>
            Créer l'événement
          </button>
        </form>
      </section>

      {/* Events List */}
      <section class="card-elevated">
        <h2 class="text-xl font-semibold text-green-800 mb-6">
          Tous les événements ({events.length})
        </h2>

        {events.length === 0
          ? (
            <p class="text-gray-600 text-center py-8">
              Aucun événement trouvé
            </p>
          )
          : (
            <div class="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div class="flex-1">
                      <div class="flex items-start justify-between mb-2">
                        <h3 class="text-lg font-semibold text-green-800">
                          {event.title}
                        </h3>
                        {event.theme && (
                          <span class="badge-accent text-xs ml-2">
                            {event.theme}
                          </span>
                        )}
                      </div>
                      <div class="text-sm text-gray-600 space-y-1">
                        <p>
                          📅 {new Date(event.date).toLocaleDateString("fr-FR")}
                          {" "}
                          à {event.time}
                        </p>
                        <p>📍 {event.location}</p>
                        <p>🌱 {event.host_name} ({event.host_email})</p>
                        <p>👥 {event.max_attendees} participants max</p>
                        <div class="flex gap-4 mt-2">
                          <span class="text-green-600">
                            ✓{" "}
                            {event.rsvp_stats.find((s) => s.response === "yes")
                              ?.count || 0} confirmés
                          </span>
                          <span class="text-amber-600">
                            ?{" "}
                            {event.rsvp_stats.find((s) =>
                              s.response === "maybe"
                            )?.count || 0} peut-être
                          </span>
                          <span class="text-red-600">
                            ✗ {event.rsvp_stats.find((s) => s.response === "no")
                              ?.count || 0} absents
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-2 mt-4 lg:mt-0">
                      <a
                        href={`/events/${event.id}`}
                        class="btn btn-primary text-sm"
                      >
                        <span class="mr-1">👁️</span>
                        Voir
                      </a>
                      <a
                        href={`/events/${event.id}/edit`}
                        class="btn btn-accent text-sm"
                      >
                        <span class="mr-1">✏️</span>
                        Modifier
                      </a>
                      <DeleteEventButton
                        eventId={event.id}
                        eventTitle={event.title}
                        className="btn btn-ghost text-red-600 hover:bg-red-50 text-sm"
                        onDelete={() => globalThis.location.reload()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </section>
    </MobileLayout>
  );
}
