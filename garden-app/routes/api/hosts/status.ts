import { Handlers } from "$fresh/server.ts";
import { getUserByEmail, getAllUsers, getEventsByHost } from "../../../utils/db-operations.ts";

interface HostStatus {
  id: number;
  name: string;
  email: string;
  status: "active" | "pending" | "inactive";
  totalEvents: number;
  upcomingEvents: number;
  joined: string;
}

export const handler: Handlers = {
  // GET /api/hosts/status - Get all hosts with their status
  GET(req) {
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // Filter by status if provided
    
    try {
      const allUsers = getAllUsers();
      const hostStatuses: HostStatus[] = [];

      for (const user of allUsers) {
        const userEvents = getEventsByHost(user.id);
        const now = new Date();
        const upcomingEvents = userEvents.filter(event => new Date(event.date) >= now);
        
        // Determine host status based on events and activity
        let hostStatus: "active" | "pending" | "inactive" = "inactive";
        if (userEvents.length === 0) {
          hostStatus = "pending"; // New user who hasn't created events yet
        } else if (upcomingEvents.length > 0) {
          hostStatus = "active"; // Has upcoming events
        } else {
          hostStatus = "inactive"; // Only has past events
        }

        const hostStatusObj: HostStatus = {
          id: user.id,
          name: user.name,
          email: user.email,
          status: hostStatus,
          totalEvents: userEvents.length,
          upcomingEvents: upcomingEvents.length,
          joined: user.created_at,
        };

        // Apply status filter if provided
        if (!status || hostStatusObj.status === status) {
          hostStatuses.push(hostStatusObj);
        }
      }

      // Sort by number of events (most active first) and then by name
      hostStatuses.sort((a, b) => {
        if (a.totalEvents !== b.totalEvents) {
          return b.totalEvents - a.totalEvents;
        }
        return a.name.localeCompare(b.name);
      });

      return new Response(
        JSON.stringify({
          hosts: hostStatuses,
          summary: {
            total: hostStatuses.length,
            active: hostStatuses.filter(h => h.status === "active").length,
            pending: hostStatuses.filter(h => h.status === "pending").length,
            inactive: hostStatuses.filter(h => h.status === "inactive").length,
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error fetching host statuses:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },

  // POST /api/hosts/status - Update host status (for admin use)
  async POST(req) {
    try {
      const body = await req.json();
      const { email, action } = body;

      if (!email || !action) {
        return new Response(
          JSON.stringify({ error: "Email and action are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const user = getUserByEmail(email);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Host not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // For now, this is a placeholder for future admin functionality
      // In a real application, you might want to add a status column to users table
      // and implement actual approval/rejection logic

      const validActions = ["approve", "reject", "deactivate", "reactivate"];
      if (!validActions.includes(action)) {
        return new Response(
          JSON.stringify({ error: "Invalid action. Valid actions: " + validActions.join(", ") }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Log the action (in a real app, you'd update the database)
      console.log(`Host status action: ${action} for user ${email} (ID: ${user.id})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Host ${action} action processed successfully`,
          host: {
            id: user.id,
            name: user.name,
            email: user.email,
            action: action,
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error processing host status update:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};