import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressValidatorProps {
  onAddressSelected?: (address: string, lat: number, lon: number) => void;
  initialValue?: string;
  name?: string;
  required?: boolean;
}

export default function AddressValidator({
  onAddressSelected,
  initialValue = "",
  name = "location",
  required = true,
}: AddressValidatorProps) {
  const address = useSignal(initialValue);
  const suggestions = useSignal<AddressResult[]>([]);
  const selectedCoords = useSignal<{ lat: number; lon: number } | null>(null);
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);
  const showSuggestions = useSignal(false);

  // AbortController to cancel previous requests
  let currentAbortController: AbortController | null = null;
  let searchTimer: number | undefined;

  const searchAddress = async (query: string) => {
    // Require at least 6 characters for meaningful address search
    if (query.length < 6) {
      suggestions.value = [];
      showSuggestions.value = false;
      isLoading.value = false;
      return;
    }

    // Check if the query is still current (user might have typed more)
    if (query !== address.value) {
      return; // Abort this search as the input has changed
    }

    // Cancel previous request if still pending
    if (currentAbortController) {
      currentAbortController.abort();
    }

    currentAbortController = new AbortController();
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}`,
        { signal: currentAbortController.signal },
      );

      if (!response.ok) {
        if (response.status === 429) {
          error.value = "Trop de recherches. Veuillez patienter un moment.";
          suggestions.value = [];
          showSuggestions.value = false;
          return;
        }
        if (response.status === 503) {
          error.value =
            "Service temporairement indisponible. Réessayez dans un moment.";
          suggestions.value = [];
          showSuggestions.value = false;
          return;
        }
        throw new Error("Erreur de géolocalisation");
      }

      const results = await response.json();
      suggestions.value = results;
      showSuggestions.value = results.length > 0;

      // Clear error if search was successful
      if (results.length > 0) {
        error.value = null;
      } else if (query.length >= 10) {
        // Only show "no results" for longer queries
        error.value = "Aucune adresse trouvée. Vérifiez l'orthographe.";
      }
    } catch (err: unknown) {
      // Don't show error for aborted requests
      if (err instanceof Error && err.name !== "AbortError") {
        error.value = "Impossible de vérifier l'adresse";
        suggestions.value = [];
        showSuggestions.value = false;
      }
    } finally {
      isLoading.value = false;
      currentAbortController = null;
    }
  };

  const selectAddress = (result: AddressResult) => {
    address.value = result.display_name;
    selectedCoords.value = {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
    suggestions.value = [];
    showSuggestions.value = false;

    // Call the callback if it exists
    if (onAddressSelected && typeof onAddressSelected === "function") {
      onAddressSelected(
        result.display_name,
        parseFloat(result.lat),
        parseFloat(result.lon),
      );
    }
  };

  const handleInputChange = (value: string) => {
    address.value = value;
    selectedCoords.value = null; // Reset validation when user types
    error.value = null; // Clear previous errors

    // Clear search timer and create new one
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // Reset loading state when user types (only show loading when actually searching)
    isLoading.value = false;

    // Only show suggestions if we already have some and the query is long enough
    if (value.length < 6) {
      suggestions.value = [];
      showSuggestions.value = false;
    }

    // Increased debounce delay to reduce API calls
    searchTimer = setTimeout(() => {
      searchAddress(value);
    }, 1500); // Wait 1.5s after user stops typing
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Adresse {required && "*"}
        </label>
        {selectedCoords.value && (
          <span className="text-green-600 text-sm font-medium">✓ Vérifiée</span>
        )}
      </div>

      <div className="relative">
        <textarea
          name={name}
          required={required}
          rows={2}
          value={address.value}
          onInput={(e) =>
            handleInputChange((e.target as HTMLTextAreaElement).value)}
          onFocus={() => {
            if (suggestions.value.length > 0) {
              showSuggestions.value = true;
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
          placeholder="123 Rue des Jardins, 75001 Paris"
        />

        {/* Loading indicator */}
        {isLoading.value && (
          <div className="absolute right-3 top-3 flex items-center text-blue-600">
            <div className="animate-spin mr-1 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full">
            </div>
            <span className="text-xs">Recherche...</span>
          </div>
        )}

        {/* Validation status */}
        {!isLoading.value && address.value && (
          <div className="absolute right-3 top-3">
            {selectedCoords.value
              ? <span className="text-green-600">✓</span>
              : <span className="text-orange-500">⚠️</span>}
          </div>
        )}
      </div>

      {/* Hidden inputs for coordinates */}
      {selectedCoords.value && (
        <>
          <input
            type="hidden"
            name="latitude"
            value={selectedCoords.value.lat}
          />
          <input
            type="hidden"
            name="longitude"
            value={selectedCoords.value.lon}
          />
        </>
      )}

      {/* Error message */}
      {error.value && <p className="text-red-600 text-sm mt-1">{error.value}
      </p>}

      {/* Suggestions dropdown */}
      {showSuggestions.value && suggestions.value.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.value.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectAddress(result)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900 text-sm">
                {result.display_name}
              </div>
              <div className="text-xs text-gray-600">
                {result.address.city || result.address.town ||
                  result.address.village}
                {result.address.postcode && ` - ${result.address.postcode}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper text and validation warnings */}
      {address.value.length > 0 && address.value.length < 6 && (
        <p className="text-gray-500 text-sm mt-1">
          Tapez au moins 6 caractères pour rechercher une adresse...
        </p>
      )}

      {address.value.length >= 6 && !selectedCoords.value && !isLoading.value &&
        suggestions.value.length === 0 && !error.value && (
        <p className="text-orange-600 text-sm mt-1">
          ⚠️ Veuillez sélectionner une adresse dans la liste pour garantir la
          météo
        </p>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions.value && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => showSuggestions.value = false}
        />
      )}
    </div>
  );
}
