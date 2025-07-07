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
  const baseNavItems: NavItem[] = [
    { href: "/", label: "Accueil", icon: "🏠" },
    { href: "/events", label: "Événements", icon: "🌻" },
    { href: "/calendar", label: "Calendrier", icon: "📅" },
  ];

  const authNavItems: NavItem[] = user
    ? [
      ...(user.host_status === "approved"
        ? [
          {
            href: "/host/dashboard",
            label: "Tableau de bord",
            icon: "📊",
            hostOnly: true,
          },
        ]
        : []),
      ...(user.role === "admin"
        ? [
          {
            href: "/admin/security",
            label: "Sécurité",
            icon: "🔒",
            adminOnly: true,
          },
        ]
        : []),
      {
        href: "/host",
        label: user.host_status === "approved"
          ? "Nouvel événement"
          : "Devenir Hôte",
        icon: "🌱",
        highlight: true,
      },
      { href: "/profile", label: "Profil", icon: "👤" },
      { href: "/auth/logout", label: "Déconnexion", icon: "🚪" },
    ]
    : [
      { href: "/host", label: "Devenir Hôte", icon: "🌱", highlight: true },
      { href: "/auth/login", label: "Connexion", icon: "🔑" },
    ];

  const navItems = [...baseNavItems, ...authNavItems];

  const isActive = (href: string) => {
    if (href === "/" && currentPath === "/") return true;
    if (href !== "/" && currentPath.startsWith(href)) return true;
    return false;
  };

  // Mobile bottom navigation
  if (isMobile) {
    const mobileItems = navItems.filter((item) =>
      !item.adminOnly && (!item.hostOnly || user?.host_status === "approved")
    ).slice(0, 5); // Limit to 5 items for mobile

    return (
      <nav class="mobile-nav">
        {mobileItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            class={`mobile-nav-item ${isActive(item.href) ? "active" : ""}`}
          >
            <span class="text-lg mb-1">{item.icon}</span>
            <span class="text-xs leading-tight">
              {item.label.length > 8
                ? item.label.substring(0, 8) + "..."
                : item.label}
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
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 active:bg-yellow-300"
                : "btn-secondary"
            }`}
          >
            <span class="mr-1 md:mr-2">{item.icon}</span>
            <span class="hidden sm:inline">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
