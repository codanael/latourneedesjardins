import { Handlers, PageProps } from "$fresh/server.ts";
import {
  createEvent,
  createUser,
  getUserByEmail,
} from "../utils/db-operations.ts";
import { isAutoApprovalEnabled } from "../utils/config.ts";

interface FormData {
  success?: boolean;
  error?: string;
  formValues?: Record<string, string>;
  autoApproved?: boolean;
  userStatus?: string;
}

export const handler: Handlers<FormData> = {
  GET(_req, ctx) {
    return ctx.render({});
  },

  async POST(req, ctx) {
    const formData = await req.formData();

    const hostData = {
      name: formData.get("name")?.toString() || "",
      email: formData.get("email")?.toString() || "",
      phone: formData.get("phone")?.toString() || "",
      eventTitle: formData.get("eventTitle")?.toString() || "",
      eventDate: formData.get("eventDate")?.toString() || "",
      eventTime: formData.get("eventTime")?.toString() || "14:00",
      location: formData.get("location")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      theme: formData.get("theme")?.toString() || "",
      maxAttendees: formData.get("maxAttendees")?.toString() || "15",
      specialInstructions: formData.get("specialInstructions")?.toString() ||
        "",
      weatherLocation: formData.get("weatherLocation")?.toString() || "",
    };

    // Convert to form values for re-display on error
    const formValues = Object.fromEntries(
      Object.entries(hostData).map(([key, value]) => [key, value.toString()]),
    );

    try {
      // Enhanced validation
      const errors: string[] = [];

      if (!hostData.name.trim()) errors.push("Le nom est requis");
      if (!hostData.email.trim()) errors.push("L'email est requis");
      if (!hostData.eventTitle.trim()) {
        errors.push("Le titre de l'événement est requis");
      }
      if (!hostData.eventDate.trim()) errors.push("La date est requise");
      if (!hostData.location.trim()) errors.push("L'adresse est requise");

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (hostData.email && !emailRegex.test(hostData.email)) {
        errors.push("Format d'email invalide");
      }

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
        });
      }

      // Check if user already exists or create new user
      let user = getUserByEmail(hostData.email);
      if (!user) {
        const initialStatus = isAutoApprovalEnabled() ? "approved" : "pending";
        user = createUser(hostData.name, hostData.email, initialStatus);
      }

      // Create event
      const event = createEvent({
        title: hostData.eventTitle,
        description: hostData.description ||
          `Événement organisé par ${hostData.name}`,
        date: hostData.eventDate,
        time: hostData.eventTime,
        location: hostData.location,
        host_id: user.id,
        theme: hostData.theme || "Garden Party",
        max_attendees: parseInt(hostData.maxAttendees),
        weather_location: hostData.weatherLocation || hostData.location,
        special_instructions: hostData.specialInstructions,
      });

      console.log("New host event created:", { user, event });

      return ctx.render({
        success: true,
        autoApproved: isAutoApprovalEnabled(),
        userStatus: user.host_status,
      });
    } catch (error) {
      console.error("Error creating host event:", error);
      return ctx.render({
        error:
          "Une erreur est survenue lors de la création de l'événement. Veuillez réessayer.",
        formValues,
      });
    }
  },
};

export default function HostPage({ data }: PageProps<FormData>) {
  const { formValues = {} } = data;

  if (data.success) {
    return (
      <div class="min-h-screen bg-green-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div class="text-center">
            <div class="text-6xl mb-4">🎉</div>
            <h1 class="text-2xl font-bold text-green-800 mb-4">
              {data.autoApproved
                ? "Événement créé avec succès !"
                : "Candidature soumise !"}
            </h1>
            <p class="text-gray-600 mb-6">
              {data.autoApproved
                ? "Votre événement a été créé et approuvé automatiquement ! Il est maintenant visible dans le calendrier et les autres utilisateurs peuvent s'y inscrire."
                : "Votre candidature d'hôte a été soumise avec succès. Elle sera examinée par notre équipe et vous recevrez une notification une fois approuvée."}
            </p>
            <div class="space-y-3">
              <a
                href="/"
                class="block w-full bg-green-600 text-white text-center px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Retour à l'accueil
              </a>

              {data.autoApproved
                ? (
                  <>
                    <a
                      href="/calendar"
                      class="block w-full bg-green-100 text-green-800 text-center px-6 py-3 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Voir le calendrier
                    </a>
                    <a
                      href="/host/dashboard"
                      class="block w-full bg-blue-100 text-blue-800 text-center px-6 py-3 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      Gérer mes événements
                    </a>
                  </>
                )
                : (
                  <a
                    href="/events"
                    class="block w-full bg-green-100 text-green-800 text-center px-6 py-3 rounded-lg hover:bg-green-200 transition-colors"
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
    <div class="min-h-screen bg-green-50">
      <div class="container mx-auto px-4 py-8">
        {/* Header */}
        <header class="text-center mb-8">
          <h1 class="text-3xl font-bold text-green-800 mb-2">
            Devenir Hôte
          </h1>
          <p class="text-green-600">
            Partagez votre jardin avec la communauté
          </p>
        </header>

        {/* Navigation */}
        <nav class="mb-8">
          <div class="flex flex-wrap justify-center gap-4">
            <a
              href="/"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Accueil
            </a>
            <a
              href="/events"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Événements
            </a>
            <a
              href="/calendar"
              class="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
            >
              Calendrier
            </a>
            <a
              href="/host/dashboard"
              class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Tableau de bord hôte
            </a>
            <a
              href="/host"
              class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Devenir Hôte
            </a>
          </div>
        </nav>

        <div class="max-w-4xl mx-auto">
          {/* Info Section */}
          <section class="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 class="text-2xl font-semibold text-green-800 mb-4">
              Pourquoi devenir hôte ?
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center">
                <div class="text-4xl mb-2">🌻</div>
                <h3 class="font-semibold text-green-700 mb-2">
                  Partagez votre passion
                </h3>
                <p class="text-gray-600 text-sm">
                  Montrez votre jardin et inspirez d'autres jardiniers
                </p>
              </div>
              <div class="text-center">
                <div class="text-4xl mb-2">👥</div>
                <h3 class="font-semibold text-green-700 mb-2">Créez du lien</h3>
                <p class="text-gray-600 text-sm">
                  Rencontrez des personnes partageant vos centres d'intérêt
                </p>
              </div>
              <div class="text-center">
                <div class="text-4xl mb-2">🎉</div>
                <h3 class="font-semibold text-green-700 mb-2">
                  Organisez facilement
                </h3>
                <p class="text-gray-600 text-sm">
                  Nous gérons les inscriptions et la coordination
                </p>
              </div>
            </div>
          </section>

          {/* Form */}
          <section class="bg-white rounded-lg shadow-md p-8">
            <h2 class="text-2xl font-semibold text-green-800 mb-6">
              Organisez votre événement
            </h2>

            {data.error && (
              <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <p class="text-red-700">{data.error}</p>
              </div>
            )}

            <form method="POST" class="space-y-6">
              {/* Host Information */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                  Vos informations
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formValues.name || ""}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formValues.email || ""}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formValues.phone || ""}
                    class="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>

              {/* Event Information */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">
                  Détails de l'événement
                </h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Titre de l'événement *
                    </label>
                    <input
                      type="text"
                      name="eventTitle"
                      required
                      value={formValues.eventTitle || ""}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Garden Party chez..."
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        name="eventDate"
                        required
                        value={formValues.eventDate || ""}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Heure
                      </label>
                      <input
                        type="time"
                        name="eventTime"
                        value={formValues.eventTime || "14:00"}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Adresse *
                    </label>
                    <textarea
                      name="location"
                      required
                      rows={2}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="123 Rue des Jardins, 75001 Paris"
                    >
                      {formValues.location || ""}
                    </textarea>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Décrivez votre jardin, l'ambiance prévue, ce qui rend votre événement spécial..."
                    >
                      {formValues.description || ""}
                    </textarea>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Thème (optionnel)
                      </label>
                      <input
                        type="text"
                        name="theme"
                        value={formValues.theme || ""}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Potluck, Barbecue, Brunch..."
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Nombre max de participants
                      </label>
                      <input
                        type="number"
                        name="maxAttendees"
                        min="1"
                        max="100"
                        value={formValues.maxAttendees || "15"}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Ville pour la météo (optionnel)
                    </label>
                    <input
                      type="text"
                      name="weatherLocation"
                      value={formValues.weatherLocation || ""}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Paris, Lyon, Marseille..."
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Si différent de l'adresse de l'événement, pour afficher la
                      météo
                    </p>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Instructions spéciales
                    </label>
                    <textarea
                      name="specialInstructions"
                      rows={3}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Apportez vos couverts, parking disponible, accès PMR..."
                    >
                      {formValues.specialInstructions || ""}
                    </textarea>
                  </div>
                </div>
              </div>

              <div class="pt-6 border-t">
                <button
                  type="submit"
                  class="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
                >
                  Créer mon événement
                </button>
                <p class="text-sm text-gray-600 mt-3 text-center">
                  En créant cet événement, vous acceptez d'accueillir les
                  participants dans votre jardin
                </p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
