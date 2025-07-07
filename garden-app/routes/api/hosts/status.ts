import { Handlers } from "$fresh/server.ts";
import {
  getEventsByHost,
  getHostsByStatus,
  getUserByEmail,
  updateHostStatus,
} from "../../../utils/db-operations.ts";
import { getAuthenticatedUser, hasPermission } from "../../../utils/session.ts";

interface HostStatus {
  id: number;
  name: string;
  email: string;
  status: "approved" | "pending" | "rejected";
  totalEvents: number;
  upcomingEvents: number;
  joined: string;
  confirmedAt?: string;
  adminNotes?: string;
}

export const handler: Handlers = {
  // GET /api/hosts/status - Get all hosts with their status
  GET(req) {
    const user = getAuthenticatedUser(req);

    // Require admin authentication for viewing host statuses
    if (!user || !hasPermission(req, "admin")) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") as
      | "approved"
      | "pending"
      | "rejected"
      | null;

    try {
      const hosts = getHostsByStatus(statusFilter || undefined);
      const hostStatuses: HostStatus[] = [];

      for (const user of hosts) {
        const userEvents = getEventsByHost(user.id);
        const now = new Date();
        const upcomingEvents = userEvents.filter((event) =>
          new Date(event.date) >= now
        );

        const hostStatusObj: HostStatus = {
          id: user.id,
          name: user.name,
          email: user.email,
          status: (user.host_status as "approved" | "pending" | "rejected") ||
            "pending",
          totalEvents: userEvents.length,
          upcomingEvents: upcomingEvents.length,
          joined: user.created_at,
          confirmedAt: user.confirmed_at || undefined,
          adminNotes: user.admin_notes || undefined,
        };

        hostStatuses.push(hostStatusObj);
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
            approved: hostStatuses.filter((h) =>
              h.status === "approved"
            ).length,
            pending: hostStatuses.filter((h) => h.status === "pending").length,
            rejected: hostStatuses.filter((h) =>
              h.status === "rejected"
            ).length,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("Error fetching host statuses:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },

  // POST /api/hosts/status - Update host status (for admin use)
  async POST(req) {
    const user = getAuthenticatedUser(req);

    // Require admin authentication for modifying host statuses
    if (!user || !hasPermission(req, "admin")) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      let email: string, action: string, adminNotes: string | undefined;

      const contentType = req.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const body = await req.json();
        ({ email, action, adminNotes } = body);
      } else {
        // Handle form data
        const formData = await req.formData();
        email = formData.get("email")?.toString() || "";
        action = formData.get("action")?.toString() || "";
        adminNotes = formData.get("adminNotes")?.toString();
      }

      if (!email || !action) {
        return new Response(
          JSON.stringify({ error: "Email and action are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const user = getUserByEmail(email);
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Host not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        );
      }

      // Map actions to status values
      const actionStatusMap: Record<
        string,
        "pending" | "approved" | "rejected"
      > = {
        approve: "approved",
        reject: "rejected",
        pending: "pending",
      };

      const validActions = Object.keys(actionStatusMap);
      if (!validActions.includes(action)) {
        return new Response(
          JSON.stringify({
            error: "Invalid action. Valid actions: " + validActions.join(", "),
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const newStatus = actionStatusMap[action];
      const success = updateHostStatus(user.id, newStatus, adminNotes);

      if (!success) {
        if (contentType?.includes("application/json")) {
          return new Response(
            JSON.stringify({ error: "Failed to update host status" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        } else {
          return new Response("", {
            status: 302,
            headers: { "Location": "/admin/hosts?error=update_failed" },
          });
        }
      }

      if (contentType?.includes("application/json")) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Host status updated to ${newStatus}`,
            host: {
              id: user.id,
              name: user.name,
              email: user.email,
              status: newStatus,
              adminNotes: adminNotes,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } else {
        return new Response("", {
          status: 302,
          headers: { "Location": "/admin/hosts?success=status_updated" },
        });
      }
    } catch (error) {
      console.error("Error processing host status update:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
