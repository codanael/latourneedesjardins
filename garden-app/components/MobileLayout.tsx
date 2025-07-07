import type { ComponentChildren } from "preact";
import type { AuthenticatedUser } from "../utils/session.ts";
import Navigation from "./Navigation.tsx";

interface MobileLayoutProps {
  children: ComponentChildren;
  user?: AuthenticatedUser | null;
  currentPath?: string;
  title?: string;
  showMobileNav?: boolean;
}

export default function MobileLayout({
  children,
  user,
  currentPath = "/",
  title,
  showMobileNav = true,
}: MobileLayoutProps) {
  return (
    <div class="min-h-screen bg-green-50">
      {/* Main content area with bottom padding for mobile nav */}
      <div class={`${showMobileNav && user ? "pb-20" : ""}`}>
        <div class="container mx-auto px-4 py-4 sm:py-8">
          {title && (
            <header class="text-center mb-6 sm:mb-8">
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-green-800 mb-2">
                {title}
              </h1>
            </header>
          )}

          {/* Desktop/tablet navigation */}
          <div class="hidden sm:block">
            <Navigation currentPath={currentPath} user={user} />
          </div>

          {/* Main content */}
          <main class="relative">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {showMobileNav && user && (
        <div class="block sm:hidden">
          <Navigation currentPath={currentPath} user={user} isMobile />
        </div>
      )}
    </div>
  );
}
