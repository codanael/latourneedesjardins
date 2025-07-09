import type { AuthenticatedUser } from "../utils/session.ts";

interface NavigationProps {
  currentPath?: string;
  user?: AuthenticatedUser | null;
  isMobile?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  highlight?: boolean;
  adminOnly?: boolean;
  hostOnly?: boolean;
}

export default function Navigation(
  { currentPath = "/", user, isMobile = false }: NavigationProps,
) {
  // Check user permissions
  const isAdmin = user?.role === "admin";
  const isApproved = user?.host_status === "approved" || isAdmin;
  const isPending = user?.host_status === "pending";

  // Define consistent mobile navigation items (calendar removed for better mobile UX)
  const mobileNavItems: NavItem[] = user
    ? [
      { href: "/", label: "Accueil", icon: "🏠" },
      ...(isApproved
        ? [
          { href: "/events", label: "Événements", icon: "🌻" },
        ]
        : []),
      ...(isApproved
        ? [
          {
            href: "/host/dashboard",
            label: "Tableau",
            icon: "📊",
            hostOnly: true,
          },
        ]
        : []),
      ...(isApproved
        ? [
          {
            href: "/host",
            label: "Nouvel",
            icon: "🌱",
            highlight: true,
          },
        ]
        : isPending
        ? [
          {
            href: "#",
            label: "En attente",
            icon: "⏳",
            highlight: false,
          },
        ]
        : [
          {
            href: "/host",
            label: "Devenir Hôte",
            icon: "🌱",
            highlight: true,
          },
        ]),
    ]
    : [
      { href: "/", label: "Accueil", icon: "🏠" },
      { href: "/auth/login", label: "Connexion", icon: "🔑" },
    ];

  // Desktop navigation items (more comprehensive)
  const desktopNavItems: NavItem[] = user
    ? [
      { href: "/", label: "Accueil", icon: "🏠" },
      ...(isApproved
        ? [
          { href: "/events", label: "Événements", icon: "🌻" },
          { href: "/calendar", label: "Calendrier", icon: "📅" },
        ]
        : []),
      ...(isApproved
        ? [
          {
            href: "/host/dashboard",
            label: "Tableau de bord",
            icon: "📊",
            hostOnly: true,
          },
        ]
        : []),
      ...(isAdmin
        ? [
          {
            href: "/admin/events",
            label: "Gestion des événements",
            icon: "📊",
            adminOnly: true,
          },
          {
            href: "/admin/security",
            label: "Sécurité",
            icon: "🔒",
            adminOnly: true,
          },
          {
            href: "/admin/hosts",
            label: "Gestion des hôtes",
            icon: "👥",
            adminOnly: true,
          },
        ]
        : []),
      ...(isApproved
        ? [
          {
            href: "/host",
            label: "Nouvel événement",
            icon: "🌱",
            highlight: true,
          },
        ]
        : isPending
        ? [
          {
            href: "#",
            label: "En attente d'approbation",
            icon: "⏳",
            highlight: false,
          },
        ]
        : [
          {
            href: "/host",
            label: "Devenir Hôte",
            icon: "🌱",
            highlight: true,
          },
        ]),
      { href: "/profile", label: "Profil", icon: "👤" },
      { href: "/auth/logout", label: "Déconnexion", icon: "🚪" },
    ]
    : [
      { href: "/", label: "Accueil", icon: "🏠" },
      { href: "/auth/login", label: "Connexion", icon: "🔑" },
    ];

  const navItems = isMobile ? mobileNavItems : desktopNavItems;

  const isActive = (href: string) => {
    if (href === "/" && currentPath === "/") return true;
    if (href !== "/" && currentPath.startsWith(href)) return true;
    return false;
  };

  // Mobile bottom navigation
  if (isMobile) {
    return (
      <nav class="mobile-nav">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            class={`mobile-nav-item ${isActive(item.href) ? "active" : ""} ${
              item.highlight ? "highlight" : ""
            }`}
          >
            <span class="text-lg mb-1">{item.icon}</span>
            <span class="text-xs leading-tight font-medium">
              {item.label}
            </span>
          </a>
        ))}
      </nav>
    );
  }

  // Desktop/tablet navigation
  return (
    <nav class="mb-8">
      <div class="flex flex-wrap justify-center gap-2 md:gap-4">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            class={`btn touch-manipulation ${
              isActive(item.href)
                ? item.highlight ? "btn-accent" : "btn-primary"
                : item.highlight
                ? "btn-accent bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40"
                : "btn-secondary"
            }`}
          >
            <span class="mr-1 md:mr-2 text-lg">{item.icon}</span>
            <span class="hidden sm:inline">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
