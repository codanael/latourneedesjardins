import { useEffect, useState } from "preact/hooks";
import EventCard from "../components/EventCard.tsx";

interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  host_name?: string;
  theme?: string;
  rsvp_count?: number;
  max_attendees?: number;
}

interface EventFilters {
  dateRange?: {
    start?: string;
    end?: string;
  };
  location?: string;
  theme?: string;
}

interface FilteredEventsListProps {
  initialEvents: Event[];
}

export default function FilteredEventsList(
  { initialEvents }: FilteredEventsListProps,
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({});
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents);

  // Filter events based on search query and filters
  useEffect(() => {
    let filtered = [...initialEvents];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((event) =>
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.host_name?.toLowerCase().includes(query) ||
        event.theme?.toLowerCase().includes(query)
      );
    }

    // Apply date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);
        const startDate = filters.dateRange?.start
          ? new Date(filters.dateRange.start)
          : null;
        const endDate = filters.dateRange?.end
          ? new Date(filters.dateRange.end)
          : null;

        if (startDate && eventDate < startDate) return false;
        if (endDate && eventDate > endDate) return false;
        return true;
      });
    }

    // Apply location filter
    if (filters.location) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter((event) =>
        event.location.toLowerCase().includes(locationQuery)
      );
    }

    // Apply theme filter
    if (filters.theme) {
      filtered = filtered.filter((event) => event.theme === filters.theme);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, filters, initialEvents]);

  const handleSearchChange = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    setSearchQuery(target.value);
  };

  const handleFilterChange = (
    key: keyof EventFilters,
    value: string | EventFilters["dateRange"],
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  return (
    <div>
      {/* Search and Filters */}
      <div class="mb-6">
        {/* Search Bar */}
        <div class="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onInput={handleSearchChange}
            placeholder="Rechercher des événements..."
            class="w-full px-4 py-3 pl-10 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-400">🔍</span>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            class={`absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors ${
              showFilters ? "text-green-600" : ""
            }`}
          >
            <span class="text-lg">⚙️</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-800">Filtres</h3>
              <button
                type="button"
                onClick={clearFilters}
                class="text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Effacer tout
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.start || ""}
                  onChange={(e) =>
                    handleFilterChange("dateRange", {
                      ...filters.dateRange,
                      start: (e.target as HTMLInputElement).value,
                    })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={filters.dateRange?.end || ""}
                  onChange={(e) =>
                    handleFilterChange("dateRange", {
                      ...filters.dateRange,
                      end: (e.target as HTMLInputElement).value,
                    })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Location */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  value={filters.location || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "location",
                      (e.target as HTMLInputElement).value,
                    )}
                  placeholder="Ville, département..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Theme */}
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Thème
                </label>
                <select
                  value={filters.theme || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "theme",
                      (e.target as HTMLSelectElement).value,
                    )}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Tous les thèmes</option>
                  <option value="Garden Party">Garden Party</option>
                  <option value="Barbecue">Barbecue</option>
                  <option value="Brunch & Dégustation">
                    Brunch & Dégustation
                  </option>
                  <option value="Yoga & Détente">Yoga & Détente</option>
                  <option value="Atelier">Atelier</option>
                  <option value="Visite guidée">Visite guidée</option>
                </select>
              </div>
            </div>

            {/* Quick Filters */}
            <div class="mt-4 pt-4 border-t border-gray-200">
              <h4 class="text-sm font-medium text-gray-700 mb-2">
                Filtres rapides
              </h4>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange("dateRange", {
                      start: new Date().toISOString().split("T")[0],
                      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        .toISOString().split("T")[0],
                    })}
                  class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  7 prochains jours
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange("dateRange", {
                      start: new Date().toISOString().split("T")[0],
                      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        .toISOString().split("T")[0],
                    })}
                  class="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  30 prochains jours
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange("dateRange", {
                      start: new Date().toISOString().split("T")[0],
                    })}
                  class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  Événements à venir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(searchQuery ||
          Object.keys(filters).some((key) =>
            filters[key as keyof EventFilters]
          )) && (
          <div class="mb-4">
            <div class="flex flex-wrap gap-2 items-center">
              <span class="text-sm text-gray-600">Filtres actifs:</span>
              {searchQuery && (
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Recherche: "{searchQuery}"
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    class="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.dateRange?.start && (
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  À partir du {filters.dateRange.start}
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange("dateRange", {
                        ...filters.dateRange,
                        start: undefined,
                      })}
                    class="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.location && (
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Lieu: {filters.location}
                  <button
                    type="button"
                    onClick={() => handleFilterChange("location", "")}
                    class="ml-1 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.theme && (
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Thème: {filters.theme}
                  <button
                    type="button"
                    onClick={() => handleFilterChange("theme", "")}
                    class="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div class="text-sm text-gray-600 mb-4">
          {filteredEvents.length}{" "}
          événement{filteredEvents.length !== 1 ? "s" : ""}{" "}
          trouvé{filteredEvents.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Events List */}
      <section>
        {filteredEvents.length > 0
          ? (
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  variant="compact"
                  showRSVPCount
                />
              ))}
            </div>
          )
          : (
            <div class="text-center py-12">
              <div class="text-6xl mb-4">🔍</div>
              <p class="text-gray-500 text-lg mb-6">
                Aucun événement trouvé pour ces critères
              </p>
              <button
                type="button"
                onClick={clearFilters}
                class="btn btn-secondary inline-flex items-center"
              >
                <span class="mr-2">🔄</span>
                Effacer les filtres
              </button>
            </div>
          )}
      </section>
    </div>
  );
}
