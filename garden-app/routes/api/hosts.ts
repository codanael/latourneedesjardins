import { Handlers } from "$fresh/server.ts";
import {
  createEvent,
  createUser,
  getEventsByHost,
  getUserByEmail,
} from "../../utils/db-operations.ts";

export const handler: Handlers = {
  // GET /api/hosts - Get host profile and events
  GET(req) {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email parameter is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const user = getUserByEmail(email);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Host not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      // Get events hosted by this user
      const hostedEvents = getEventsByHost(user.id);

      return new Response(
        JSON.stringify({
          host: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          },
          events: hostedEvents,
          stats: {
            totalEvents: hostedEvents.length,
            upcomingEvents: hostedEvents.filter((event) =>
              new Date(event.date) >= new Date()
            ).length,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Error fetching host data:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  // POST /api/hosts - Create new host and event
  async POST(req) {
    try {
      const body = await req.json();

      const {
        name,
        email,
        phone: _phone,
        eventTitle,
        eventDate,
        eventTime = "14:00",
        location,
        description,
        theme = "Garden Party",
        maxAttendees = 15,
        specialInstructions,
        weatherLocation,
      } = body;

      // Validation
      const errors: string[] = [];

      if (!name?.trim()) errors.push("Le nom est requis");
      if (!email?.trim()) errors.push("L'email est requis");
      if (!eventTitle?.trim()) {
        errors.push("Le titre de l'événement est requis");
      }
      if (!eventDate?.trim()) errors.push("La date est requise");
      if (!location?.trim()) errors.push("L'adresse est requise");

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        errors.push("Format d'email invalide");
      }

      // Date validation (must be in the future)
      if (eventDate) {
        const eventDateObj = new Date(eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDateObj < today) {
          errors.push("La date de l'événement doit être dans le futur");
        }
      }

      // Max attendees validation
      const maxAttendeesNum = parseInt(maxAttendees);
      if (
        isNaN(maxAttendeesNum) || maxAttendeesNum < 1 || maxAttendeesNum > 100
      ) {
        errors.push("Le nombre de participants doit être entre 1 et 100");
      }

      if (errors.length > 0) {
        return new Response(
          JSON.stringify({ error: errors.join(", ") }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Check if user already exists or create new user
      let user = getUserByEmail(email);
      if (!user) {
        user = createUser(name, email);
      }

      // Create event
      const event = createEvent({
        title: eventTitle,
        description: description || `Événement organisé par ${name}`,
        date: eventDate,
        time: eventTime,
        location: location,
        host_id: user.id,
        theme: theme,
        max_attendees: maxAttendeesNum,
        weather_location: weatherLocation || location,
        special_instructions: specialInstructions || "",
      });

      return new Response(
        JSON.stringify({
          success: true,
          host: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          event: {
            id: event.id,
            title: event.title,
            date: event.date,
            time: event.time,
            location: event.location,
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Error creating host event:", error);
      return new Response(
        JSON.stringify({
          error: "Une erreur est survenue lors de la création de l'événement",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
