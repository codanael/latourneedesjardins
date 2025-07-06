interface NavigationProps {
  currentPath?: string;
}

export default function Navigation({ currentPath = "/" }: NavigationProps) {
  const navItems = [
    { href: "/", label: "Accueil", icon: "🏠" },
    { href: "/events", label: "Événements", icon: "🌻" },
    { href: "/calendar", label: "Calendrier", icon: "📅" },
    { href: "/host", label: "Devenir Hôte", icon: "🌱", highlight: true }
  ];

  const isActive = (href: string) => {
    if (href === "/" && currentPath === "/") return true;
    if (href !== "/" && currentPath.startsWith(href)) return true;
    return false;
  };

  return (
    <nav class="mb-8">
      <div class="flex flex-wrap justify-center gap-2 md:gap-4">
        {navItems.map((item) => (
          <a 
            key={item.href}
            href={item.href} 
            class={`px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
              isActive(item.href)
                ? item.highlight
                  ? "bg-yellow-500 text-white hover:bg-yellow-600"
                  : "bg-green-600 text-white hover:bg-green-700"
                : item.highlight
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : "bg-green-100 text-green-800 hover:bg-green-200"
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