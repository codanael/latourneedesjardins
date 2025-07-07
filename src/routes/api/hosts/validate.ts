import { Handlers } from "$fresh/server.ts";
import { isRateLimited } from "../../../utils/session.ts";

export const handler: Handlers = {
  // POST /api/hosts/validate - Validate host registration data
  async POST(req) {
    // Apply stricter rate limiting for validation endpoint
    const clientIP = req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(`validate:${clientIP}`, 10, 60 * 1000)) { // 10 requests per minute
      return new Response(
        JSON.stringify({ error: "Too many validation requests" }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const body = await req.json();
      const {
        name,
        email,
        phone,
        eventTitle,
        eventDate,
        eventTime,
        location,
        maxAttendees,
      } = body;

      const errors: string[] = [];
      const warnings: string[] = [];

      // Required field validation
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

      // Note: We don't check email existence to prevent enumeration attacks
      // The actual registration will handle existing emails appropriately

      // Phone validation (optional but should be valid if provided)
      if (phone && phone.trim()) {
        const phoneRegex = /^[\d\s\+\-\(\)]{8,15}$/;
        if (!phoneRegex.test(phone.trim())) {
          warnings.push("Le format du numéro de téléphone semble incorrect");
        }
      }

      // Date validation
      if (eventDate) {
        const eventDateObj = new Date(eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(eventDateObj.getTime())) {
          errors.push("Format de date invalide");
        } else if (eventDateObj < today) {
          errors.push("La date de l'événement doit être dans le futur");
        } else if (
          eventDateObj > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        ) {
          warnings.push("L'événement est prévu dans plus d'un an");
        }
      }

      // Time validation
      if (eventTime) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(eventTime)) {
          errors.push("Format d'heure invalide (HH:MM)");
        }
      }

      // Max attendees validation
      if (maxAttendees !== undefined) {
        const maxAttendeesNum = parseInt(maxAttendees);
        if (isNaN(maxAttendeesNum)) {
          errors.push("Le nombre de participants doit être un nombre");
        } else if (maxAttendeesNum < 1) {
          errors.push("Le nombre minimum de participants est 1");
        } else if (maxAttendeesNum > 100) {
          errors.push("Le nombre maximum de participants est 100");
        } else if (maxAttendeesNum < 5) {
          warnings.push(
            "Un petit nombre de participants peut limiter l'intérêt pour votre événement",
          );
        }
      }

      // Event title validation
      if (eventTitle && eventTitle.trim().length < 5) {
        warnings.push(
          "Un titre plus descriptif pourrait attirer plus de participants",
        );
      }

      // Location validation
      if (location && location.trim().length < 10) {
        warnings.push(
          "Une adresse plus complète aiderait les participants à vous trouver",
        );
      }

      const isValid = errors.length === 0;
      const hasWarnings = warnings.length > 0;

      return new Response(
        JSON.stringify({
          valid: isValid,
          errors: errors,
          warnings: warnings,
          hasWarnings: hasWarnings,
          message: isValid
            ? (hasWarnings
              ? "Validation réussie avec des avertissements"
              : "Validation réussie")
            : "Erreurs de validation détectées",
        }),
        {
          status: isValid ? 200 : 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error validating host data:", error);
      return new Response(
        JSON.stringify({
          valid: false,
          errors: ["Erreur de validation interne"],
          warnings: [],
          hasWarnings: false,
          message: "Erreur de validation interne",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
