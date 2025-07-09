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

interface AdminDropdownItem {
  href: string;
  label: string;
  icon: string;
}

export default function Navigation(
  { currentPath = "/", user, isMobile = false }: NavigationProps,
) {
  // Check user permissions
  const isAdmin = user?.role === "admin";
  const isApproved = user?.host_status === "approved" || isAdmin;
  const isPending = user?.host_status === "pending";

  // Admin dropdown items
  const adminDropdownItems: AdminDropdownItem[] = [
    {
      href: "/admin/events",
      label: "Gestion des événements",
      icon: "📊",
    },
    {
      href: "/admin/security",
      label: "Sécurité",
      icon: "🔒",
    },
    {
      href: "/admin/hosts",
      label: "Gestion des hôtes",
      icon: "👥",
    },
  ];

  // Check if current path is in admin section
  const isInAdminSection = adminDropdownItems.some((item) =>
    currentPath.startsWith(item.href)
  );

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
      ...(isAdmin
        ? [
          {
            href: "/admin/events",
            label: "Admin",
            icon: "⚙️",
            adminOnly: true,
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

  // Mobile bottom navigation with improved touch targets
  if (isMobile) {
    return (
      <nav class="mobile-nav">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            class={`mobile-nav-item ${isActive(item.href) ? "active" : ""} ${
              item.highlight ? "highlight" : ""
            } ${item.href === "#" ? "disabled" : ""}`}
            {...(item.href === "#" ? { onclick: "return false;" } : {})}
          >
            <span class="text-lg mb-1 transition-transform duration-200 hover:scale-110">
              {item.icon}
            </span>
            <span class="text-xs leading-tight font-medium">
              {item.label}
            </span>
            {/* Active indicator */}
            {isActive(item.href) && (
              <span class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full">
              </span>
            )}
          </a>
        ))}
      </nav>
    );
  }

  // Desktop/tablet navigation with admin dropdown
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

        {/* Admin dropdown menu */}
        {isAdmin && (
          <div class="relative group">
            <button
              class={`btn touch-manipulation ${
                isInAdminSection ? "btn-primary" : "btn-secondary"
              }`}
              type="button"
            >
              <span class="mr-1 md:mr-2 text-lg">⚙️</span>
              <span class="hidden sm:inline">Administration</span>
              <span class="ml-1 text-xs">▼</span>
            </button>

            {/* Dropdown menu */}
            <div class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div class="py-1">
                {adminDropdownItems.map((adminItem) => (
                  <a
                    key={adminItem.href}
                    href={adminItem.href}
                    class={`flex items-center px-4 py-2 text-sm hover:bg-gray-100 ${
                      isActive(adminItem.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    <span class="mr-3 text-base">{adminItem.icon}</span>
                    {adminItem.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
