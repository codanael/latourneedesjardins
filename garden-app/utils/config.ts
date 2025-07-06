// Configuration settings for the application

export interface AppConfig {
  // Host approval settings
  autoApproveHosts: boolean;
  requireAdminReview: boolean;
  
  // Email notifications (placeholder for future implementation)
  sendApprovalEmails: boolean;
  sendRejectionEmails: boolean;
  
  // Admin settings
  adminEmails: string[];
}

// Default configuration
export const defaultConfig: AppConfig = {
  autoApproveHosts: true, // Automatically approve new hosts
  requireAdminReview: false, // Don't require admin review for auto-approval
  sendApprovalEmails: false, // Email functionality not implemented yet
  sendRejectionEmails: false,
  adminEmails: [], // No admin emails configured by default
};

// Load configuration from environment variables or use defaults
export function getConfig(): AppConfig {
  return {
    autoApproveHosts: Deno.env.get("AUTO_APPROVE_HOSTS") !== "false",
    requireAdminReview: Deno.env.get("REQUIRE_ADMIN_REVIEW") === "true",
    sendApprovalEmails: Deno.env.get("SEND_APPROVAL_EMAILS") === "true",
    sendRejectionEmails: Deno.env.get("SEND_REJECTION_EMAILS") === "true",
    adminEmails: Deno.env.get("ADMIN_EMAILS")?.split(",") || [],
  };
}

// Configuration management functions
export function isAutoApprovalEnabled(): boolean {
  return getConfig().autoApproveHosts;
}

export function requiresAdminReview(): boolean {
  return getConfig().requireAdminReview;
}

export function getAdminEmails(): string[] {
  return getConfig().adminEmails;
}

// Host approval workflow logic
export function getApprovalWorkflow(): "auto" | "manual" | "hybrid" {
  const config = getConfig();
  
  if (config.autoApproveHosts && !config.requireAdminReview) {
    return "auto"; // Automatic approval, no admin review
  } else if (!config.autoApproveHosts || config.requireAdminReview) {
    return "manual"; // All hosts require manual approval
  } else {
    return "hybrid"; // Some automatic, some manual (future feature)
  }
}