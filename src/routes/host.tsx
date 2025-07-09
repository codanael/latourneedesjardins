import { Handlers, PageProps } from "$fresh/server.ts";
import { createEvent } from "../utils/db-operations.ts";
import {
  type AuthenticatedUser,
  getAuthenticatedUser,
} from "../utils/session.ts";
import { isAutoApprovalEnabled } from "../utils/config.ts";
import MobileLayout from "../components/MobileLayout.tsx";
import { sanitizeHtml, sanitizeInput } from "../utils/security.ts";
import AddressValidator from "../islands/AddressValidator.tsx";
import HostFormValidator from "../islands/HostFormValidator.tsx";

interface FormData {
  success?: boolean;
  error?: string;
  formValues?: Record<string, string>;
  autoApproved?: boolean;
  userStatus?: string;
  user?: AuthenticatedUser;
}

export const handler: Handlers<FormData> = {
  GET(req, ctx) {
    const user = getAuthenticatedUser(req)!; // Guaranteed by middleware

    // Authentication and permissions handled by middleware

    return ctx.render({ user });
  },

  async POST(req, ctx) {
    const user = getAuthenticatedUser(req)!; // Guaranteed by middleware

    // Authentication and permissions handled by middleware
    const formData = await req.formData();

    const hostData = {
      phone: sanitizeInput(formData.get("phone")?.toString() || ""),
      eventTitle: sanitizeInput(formData.get("eventTitle")?.toString() || ""),
      eventDate: sanitizeInput(formData.get("eventDate")?.toString() || ""),
      eventTime: sanitizeInput(
        formData.get("eventTime")?.toString() || "14:00",
      ),
      location: sanitizeInput(formData.get("location")?.toString() || ""),
      description: sanitizeHtml(formData.get("description")?.toString() || ""),
      theme: sanitizeInput(formData.get("theme")?.toString() || ""),
      maxAttendees: sanitizeInput(
        formData.get("maxAttendees")?.toString() || "15",
      ),
      specialInstructions: sanitizeHtml(
        formData.get("specialInstructions")?.toString() || "",
      ),
      latitude: formData.get("latitude")
        ? parseFloat(formData.get("latitude")?.toString() || "0")
        : undefined,
      longitude: formData.get("longitude")
        ? parseFloat(formData.get("longitude")?.toString() || "0")
        : undefined,
    };

    // Convert to form values for re-display on error
    const formValues = Object.fromEntries(
      Object.entries(hostData).map((
        [key, value],
      ) => [key, value?.toString() || ""]),
    );

    try {
      // Enhanced validation
      const errors: string[] = [];

      if (!hostData.eventTitle.trim()) {
        errors.push("Le titre de l'événement est requis");
      }
      if (!hostData.eventDate.trim()) errors.push("La date est requise");
      if (!hostData.location.trim()) errors.push("L'adresse est requise");

      // Date validation (must be in the future)
      if (hostData.eventDate) {
        const eventDate = new Date(hostData.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
          errors.push("La date de l'événement doit être dans le futur");
        }
      }

      // Max attendees validation
      const maxAttendees = parseInt(hostData.maxAttendees);
      if (isNaN(maxAttendees) || maxAttendees < 1 || maxAttendees > 100) {
        errors.push("Le nombre de participants doit être entre 1 et 100");
      }

      if (errors.length > 0) {
        return ctx.render({
          error: errors.join(", "),
          formValues,
          user,
        });
      }

      // Use the authenticated user
      // Update user's host status if not already approved
      if (user.host_status === "pending") {
        const initialStatus = isAutoApprovalEnabled() ? "approved" : "pending";
        // Note: In a real app, you'd have an updateUserHostStatus function
        console.log(
          `User ${user.email} host status would be updated to: ${initialStatus}`,
        );
      }

      // Create event
      const event = createEvent({
        title: hostData.eventTitle,
        description: hostData.description ||
          `Événement organisé par ${user.name}`,
        date: hostData.eventDate,
        time: hostData.eventTime,
        location: hostData.location,
        host_id: user.id,
        theme: hostData.theme || "Garden Party",
        max_attendees: parseInt(hostData.maxAttendees),
        weather_location: hostData.latitude && hostData.longitude
          ? `${hostData.latitude},${hostData.longitude}`
          : hostData.location,
        special_instructions: hostData.specialInstructions,
        latitude: hostData.latitude,
        longitude: hostData.longitude,
      });

      console.log("New host event created:", { user, event });

      return ctx.render({
        success: true,
        autoApproved: isAutoApprovalEnabled() ||
          user.host_status === "approved",
        userStatus: user.host_status,
      });
    } catch (error) {
      console.error("Error creating host event:", error);
      return ctx.render({
        error:
          "Une erreur est survenue lors de la création de l'événement. Veuillez réessayer.",
        formValues,
        user,
      });
    }
  },
};

export default function HostPage({ data }: PageProps<FormData>) {
  const { formValues = {}, user } = data;

  if (data.success) {
    return (
      <div class="min-h-screen bg-garden-gradient flex items-center justify-center">
        <div class="card-elevated max-w-md w-full mx-4 animate-scale-in">
          <div class="text-center">
            <div class="text-6xl mb-4 animate-bounce-gentle">🎉</div>
            <h1 class="text-2xl font-bold text-green-800 mb-4">
              {data.autoApproved
                ? "Événement créé avec succès !"
                : "Candidature soumise !"}
            </h1>
            <p class="text-gray-600 mb-6 leading-relaxed">
              {data.autoApproved
                ? "Votre événement a été créé et approuvé automatiquement ! Il est maintenant visible dans le calendrier et les autres utilisateurs peuvent s'y inscrire."
                : "Votre candidature d'hôte a été soumise avec succès. Elle sera examinée par notre équipe et vous recevrez une notification une fois approuvée."}
            </p>
            <div class="space-y-3">
              <a
                href="/"
                class="btn btn-primary w-full"
              >
                Retour à l'accueil
              </a>

              {data.autoApproved
                ? (
                  <>
                    <a
                      href="/calendar"
                      class="btn btn-secondary w-full"
                    >
                      Voir le calendrier
                    </a>
                    <a
                      href="/host/dashboard"
                      class="btn btn-accent w-full"
                    >
                      Gérer mes événements
                    </a>
                  </>
                )
                : (
                  <a
                    href="/events"
                    class="btn btn-secondary w-full"
                  >
                    Voir les autres événements
                  </a>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MobileLayout
      user={user}
      currentPath="/host"
      title="Devenir Hôte"
    >
      <div class="mb-6">
        <p class="text-green-600 text-center">
          Partagez votre jardin avec la communauté
        </p>
      </div>

          {/* Form */}
          <section class="card-elevated animate-slide-up">
            <h2 class="text-2xl font-semibold text-green-800 mb-6">
              Organisez votre événement
            </h2>

            {data.error && (
              <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
                <p class="text-red-700">{data.error}</p>
              </div>
            )}

            <form method="POST" class="space-y-6">
              {/* User Information Display */}
              <div class="bg-garden-gradient border border-green-200 rounded-lg p-6 mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                  Organisateur
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">
                      Nom
                    </label>
                    <p class="text-gray-900 font-medium bg-white p-3 rounded-lg shadow-inner-soft">{user?.name}</p>
                  </div>
                  <div>
                    <label class="form-label">
                      Email
                    </label>
                    <p class="text-gray-900 font-medium bg-white p-3 rounded-lg shadow-inner-soft">{user?.email}</p>
                  </div>
                </div>
                <div class="form-group mt-4">
                  <label class="form-label">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formValues.phone || ""}
                    class="form-input md:w-1/2"
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>

              {/* Event Information */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                  Détails de l'événement
                </h3>
                <div class="space-y-6">
                  <div class="form-group">
                    <label class="form-label">
                      Titre de l'événement *
                    </label>
                    <input
                      type="text"
                      name="eventTitle"
                      required
                      value={formValues.eventTitle || ""}
                      class="form-input"
                      placeholder="Garden Party chez..."
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                      <label class="form-label">
                        Date *
                      </label>
                      <input
                        type="date"
                        name="eventDate"
                        required
                        value={formValues.eventDate || ""}
                        class="form-input"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        Heure
                      </label>
                      <input
                        type="time"
                        name="eventTime"
                        value={formValues.eventTime || "14:00"}
                        class="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <AddressValidator
                      onAddressSelected={(address, lat, lon) => {
                        // This will be handled by the form submission
                        console.log("Address selected:", address, lat, lon);
                      }}
                      initialValue={formValues.location || ""}
                      name="location"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      class="form-textarea"
                      placeholder="Décrivez votre jardin, l'ambiance prévue, ce qui rend votre événement spécial..."
                    >
                      {formValues.description || ""}
                    </textarea>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                      <label class="form-label">
                        Thème (optionnel)
                      </label>
                      <input
                        type="text"
                        name="theme"
                        value={formValues.theme || ""}
                        class="form-input"
                        placeholder="Potluck, Barbecue, Brunch..."
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">
                        Nombre max de participants
                      </label>
                      <input
                        type="number"
                        name="maxAttendees"
                        min="1"
                        max="100"
                        value={formValues.maxAttendees || "15"}
                        class="form-input"
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      Instructions spéciales
                    </label>
                    <textarea
                      name="specialInstructions"
                      rows={3}
                      class="form-textarea"
                      placeholder="Apportez vos couverts, parking disponible, accès PMR..."
                    >
                      {formValues.specialInstructions || ""}
                    </textarea>
                  </div>
                </div>
              </div>

              <div class="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  class="btn btn-primary w-full text-lg font-semibold py-4"
                >
                  <span class="mr-2">🌱</span>
                  Créer mon événement
                </button>
                <p class="text-sm text-gray-600 mt-4 text-center leading-relaxed">
                  En créant cet événement, vous acceptez d'accueillir les
                  participants dans votre jardin
                </p>
              </div>
            </form>
          </section>
    </MobileLayout>
  );
}
