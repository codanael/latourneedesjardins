import {
  createEvent,
  createOrUpdateRSVP,
  createPotluckItem,
  createUser,
  getUserByEmail,
} from "./db-operations.ts";

export function seedDatabase() {
  try {
    console.log("🌱 Seeding database with sample data...");

    // Create users
    const users = [
      { name: "Marie Dupont", email: "marie.dupont@email.com" },
      { name: "Pierre Martin", email: "pierre.martin@email.com" },
      { name: "Sophie Legrand", email: "sophie.legrand@email.com" },
      { name: "Thomas Durand", email: "thomas.durand@email.com" },
      { name: "Julie Moreau", email: "julie.moreau@email.com" },
      { name: "Antoine Bernard", email: "antoine.bernard@email.com" },
    ];

    const createdUsers = [];
    for (const userData of users) {
      let user = getUserByEmail(userData.email);
      if (!user) {
        user = createUser(userData.name, userData.email);
        console.log(`Created user: ${user.name} (${user.id})`);
      } else {
        console.log(`User already exists: ${user.name} (${user.id})`);
      }
      createdUsers.push(user);
    }

    // Create events
    const eventData = [
      {
        title: "Garden Party chez Marie",
        description:
          "Venez découvrir mon magnifique jardin fleuri! Nous organisons une soirée conviviale avec potluck, musique live et découverte des plantes. Apportez vos instruments si vous en jouez!",
        date: "2024-07-15",
        time: "18:00",
        location: "123 Rue des Jardins, 75001 Paris",
        host_id: createdUsers[0].id,
        theme: "Potluck & Musique",
        max_attendees: 15,
        weather_location: "Paris,FR",
      },
      {
        title: "Barbecue au Jardin Secret",
        description:
          "Venez découvrir mon petit coin de paradis avec barbecue géant! Menu spécial grillades et salades fraîches du jardin.",
        date: "2024-07-22",
        time: "19:00",
        location: "456 Avenue des Roses, 69000 Lyon",
        host_id: createdUsers[1].id,
        theme: "Barbecue",
        max_attendees: 12,
        weather_location: "Lyon,FR",
      },
      {
        title: "Brunch dans les Vignes",
        description:
          "Un brunch convivial dans notre jardin avec vue sur les vignes. Dégustation de produits locaux et visite du potager.",
        date: "2024-08-05",
        time: "11:00",
        location: "789 Route des Vignes, 33000 Bordeaux",
        host_id: createdUsers[2].id,
        theme: "Brunch & Dégustation",
        max_attendees: 10,
        weather_location: "Bordeaux,FR",
      },
      {
        title: "Soirée Yoga dans le Jardin Zen",
        description:
          "Une séance de yoga douce dans mon jardin zen, suivie d'une tisane aux herbes fraîches du jardin.",
        date: "2024-08-12",
        time: "19:30",
        location: "12 Allée du Bien-être, 13000 Marseille",
        host_id: createdUsers[3].id,
        theme: "Yoga & Détente",
        max_attendees: 8,
        weather_location: "Marseille,FR",
      },
    ];

    const createdEvents = [];
    for (const event of eventData) {
      const createdEvent = createEvent(event);
      createdEvents.push(createdEvent);
    }

    // Create RSVPs
    const rsvpData = [
      // Garden Party chez Marie
      {
        event_id: createdEvents[0].id,
        user_id: createdUsers[1].id,
        response: "yes" as const,
      },
      {
        event_id: createdEvents[0].id,
        user_id: createdUsers[2].id,
        response: "yes" as const,
      },
      {
        event_id: createdEvents[0].id,
        user_id: createdUsers[3].id,
        response: "no" as const,
      },
      {
        event_id: createdEvents[0].id,
        user_id: createdUsers[4].id,
        response: "yes" as const,
      },
      {
        event_id: createdEvents[0].id,
        user_id: createdUsers[5].id,
        response: "no" as const,
      },

      // Barbecue au Jardin Secret
      {
        event_id: createdEvents[1].id,
        user_id: createdUsers[0].id,
        response: "yes" as const,
      },
      {
        event_id: createdEvents[1].id,
        user_id: createdUsers[2].id,
        response: "yes" as const,
      },
      {
        event_id: createdEvents[1].id,
        user_id: createdUsers[4].id,
        response: "no" as const,
      },

      // Brunch dans les Vignes
      {
        event_id: createdEvents[2].id,
        user_id: createdUsers[0].id,
        response: "yes" as const,
      },
      {
        event_id: createdEvents[2].id,
        user_id: createdUsers[1].id,
        response: "yes" as const,
      },
      {
        event_id: createdEvents[2].id,
        user_id: createdUsers[3].id,
        response: "yes" as const,
      },

      // Yoga dans le Jardin Zen
      {
        event_id: createdEvents[3].id,
        user_id: createdUsers[0].id,
        response: "no" as const,
      },
      {
        event_id: createdEvents[3].id,
        user_id: createdUsers[2].id,
        response: "yes" as const,
      },
      {
        event_id: createdEvents[3].id,
        user_id: createdUsers[4].id,
        response: "yes" as const,
      },
    ];

    for (const rsvp of rsvpData) {
      createOrUpdateRSVP(rsvp.event_id, rsvp.user_id, rsvp.response, false);
    }

    // Create potluck items
    const potluckData = [
      // Garden Party chez Marie
      {
        event_id: createdEvents[0].id,
        user_id: createdUsers[1].id,
        item_name: "Salade quinoa aux herbes",
        category: "entrée",
        quantity: 1,
        notes: "Végétarienne",
      },
      {
        event_id: createdEvents[0].id,
        user_id: createdUsers[2].id,
        item_name: "Tarte aux légumes du jardin",
        category: "plat",
        quantity: 1,
        notes: "6-8 parts",
      },
      {
        event_id: createdEvents[0].id,
        user_id: createdUsers[4].id,
        item_name: "Cookies aux pépites de chocolat",
        category: "dessert",
        quantity: 2,
        notes: "Faits maison",
      },

      // Barbecue au Jardin Secret
      {
        event_id: createdEvents[1].id,
        user_id: createdUsers[0].id,
        item_name: "Marinade pour viandes",
        category: "accompagnement",
        quantity: 1,
        notes: "Recette secrète!",
      },
      {
        event_id: createdEvents[1].id,
        user_id: createdUsers[2].id,
        item_name: "Salade de pommes de terre",
        category: "accompagnement",
        quantity: 1,
        notes: "",
      },

      // Brunch dans les Vignes
      {
        event_id: createdEvents[2].id,
        user_id: createdUsers[0].id,
        item_name: "Pain aux noix fait maison",
        category: "accompagnement",
        quantity: 2,
        notes: "Encore chaud!",
      },
      {
        event_id: createdEvents[2].id,
        user_id: createdUsers[1].id,
        item_name: "Confiture de figues",
        category: "accompagnement",
        quantity: 1,
        notes: "Du jardin",
      },
      {
        event_id: createdEvents[2].id,
        user_id: createdUsers[3].id,
        item_name: "Jus de fruits frais",
        category: "boisson",
        quantity: 1,
        notes: "Pressé ce matin",
      },
    ];

    for (const item of potluckData) {
      createPotluckItem(item);
    }

    console.log("✅ Database seeded successfully!");
    console.log(`- Created ${createdUsers.length} users`);
    console.log(`- Created ${createdEvents.length} events`);
    console.log(`- Created ${rsvpData.length} RSVPs`);
    console.log(`- Created ${potluckData.length} potluck items`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
