import { Handlers, PageProps } from "$fresh/server.ts";

interface FormData {
  success?: boolean;
  error?: string;
}

export const handler: Handlers<FormData> = {
  async GET(req, ctx) {
    return ctx.render({});
  },
  
  async POST(req, ctx) {
    const formData = await req.formData();
    
    // TODO: Validate and save to database
    const hostData = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      eventTitle: formData.get("eventTitle"),
      eventDate: formData.get("eventDate"),
      eventTime: formData.get("eventTime"),
      location: formData.get("location"),
      description: formData.get("description"),
      theme: formData.get("theme"),
      maxAttendees: formData.get("maxAttendees"),
      specialInstructions: formData.get("specialInstructions")
    };
    
    // Simple validation
    if (!hostData.name || !hostData.email || !hostData.eventTitle || !hostData.eventDate) {
      return ctx.render({ error: "Veuillez remplir tous les champs obligatoires" });
    }
    
    // TODO: Save to database
    console.log("New host event submission:", hostData);
    
    return ctx.render({ success: true });
  },
};

export default function HostPage({ data }: PageProps<FormData>) {
  if (data.success) {
    return (
      <div class="min-h-screen bg-green-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
          <div class="text-center">
            <div class="text-6xl mb-4">🎉</div>
            <h1 class="text-2xl font-bold text-green-800 mb-4">
              Merci pour votre candidature !
            </h1>
            <p class="text-gray-600 mb-6">
              Votre demande d'organisation d'événement a été reçue. Nous vous contacterons bientôt pour confirmer les détails.
            </p>
            <div class="space-y-3">
              <a 
                href="/"
                class="block w-full bg-green-600 text-white text-center px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Retour à l'accueil
              </a>
              <a 
                href="/events"
                class="block w-full bg-green-100 text-green-800 text-center px-6 py-3 rounded-lg hover:bg-green-200 transition-colors"
              >
                Voir les autres événements
              </a>
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
                <h3 class="font-semibold text-green-700 mb-2">Partagez votre passion</h3>
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
                <h3 class="font-semibold text-green-700 mb-2">Organisez facilement</h3>
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
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Vos informations</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input 
                      type="text" 
                      name="name" 
                      required
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
                    class="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>

              {/* Event Information */}
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Détails de l'événement</h3>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Titre de l'événement *
                    </label>
                    <input 
                      type="text" 
                      name="eventTitle" 
                      required
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
                    ></textarea>
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
                    ></textarea>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Thème (optionnel)
                      </label>
                      <input 
                        type="text" 
                        name="theme"
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
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="15"
                      />
                    </div>
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
                    ></textarea>
                  </div>
                </div>
              </div>

              <div class="pt-6 border-t">
                <button 
                  type="submit"
                  class="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
                >
                  Soumettre ma candidature
                </button>
                <p class="text-sm text-gray-600 mt-3 text-center">
                  Votre candidature sera examinée et vous recevrez une confirmation par email
                </p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}