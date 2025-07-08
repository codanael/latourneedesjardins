// Enhanced RSVP Button with client-side caching
// Provides optimistic updates and cache management for better UX

import { Signal, useSignal } from "@preact/signals";
import { updateRSVPWithCache } from "../utils/cached-events.ts";

interface CachedRSVPButtonProps {
  eventId: number;
  currentResponse?: "yes" | "no" | "maybe";
}

export default function CachedRSVPButton({
  eventId,
  currentResponse,
}: CachedRSVPButtonProps) {
  const response: Signal<"yes" | "no" | "maybe" | undefined> = useSignal(
    currentResponse,
  );
  const isLoading: Signal<boolean> = useSignal(false);
  const error: Signal<string | null> = useSignal(null);

  const handleRSVP = async (newResponse: "yes" | "no" | "maybe") => {
    // Optimistic update
    const previousResponse = response.value;
    response.value = newResponse;
    isLoading.value = true;
    error.value = null;

    try {
      const success = await updateRSVPWithCache(eventId, newResponse);

      if (!success) {
        // Revert optimistic update on failure
        response.value = previousResponse;
        error.value = "Erreur lors de la mise à jour de votre RSVP";
      } else {
        // Dispatch event to notify other components
        globalThis.dispatchEvent(
          new CustomEvent("rsvp-updated", {
            detail: { eventId, response: newResponse },
          }),
        );
      }
    } catch (err) {
      // Revert optimistic update on error
      response.value = previousResponse;
      error.value = "Erreur de connexion";
      console.error("RSVP update failed:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const getButtonClass = (buttonResponse: "yes" | "no" | "maybe") => {
    const baseClass =
      "btn flex-1 justify-center inline-flex transition-all duration-200";
    const isSelected = response.value === buttonResponse;
    const isDisabled = isLoading.value;

    if (isDisabled) {
      return `${baseClass} opacity-50 cursor-not-allowed`;
    }

    switch (buttonResponse) {
      case "yes":
        return `${baseClass} ${
          isSelected
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-green-100 text-green-800 hover:bg-green-200"
        }`;
      case "maybe":
        return `${baseClass} ${
          isSelected
            ? "bg-yellow-600 text-white hover:bg-yellow-700"
            : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        }`;
      case "no":
        return `${baseClass} ${
          isSelected
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-red-100 text-red-800 hover:bg-red-200"
        }`;
      default:
        return baseClass;
    }
  };

  return (
    <div class="space-y-4">
      <h2 class="text-xl font-semibold text-green-800 mb-4">
        Votre participation
      </h2>

      {error.value && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-red-800 text-sm">{error.value}</p>
        </div>
      )}

      <div class="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => handleRSVP("yes")}
          disabled={isLoading.value}
          class={getButtonClass("yes")}
          aria-label="Confirmer ma participation"
        >
          <span class="mr-2">✅</span>
          {isLoading.value && response.value === "yes" ? "..." : "Oui"}
        </button>

        <button
          type="button"
          onClick={() => handleRSVP("maybe")}
          disabled={isLoading.value}
          class={getButtonClass("maybe")}
          aria-label="Peut-être participer"
        >
          <span class="mr-2">🤔</span>
          {isLoading.value && response.value === "maybe" ? "..." : "Peut-être"}
        </button>

        <button
          type="button"
          onClick={() => handleRSVP("no")}
          disabled={isLoading.value}
          class={getButtonClass("no")}
          aria-label="Décliner la participation"
        >
          <span class="mr-2">❌</span>
          {isLoading.value && response.value === "no" ? "..." : "Non"}
        </button>
      </div>

      {response.value && (
        <div class="text-sm text-gray-600 text-center">
          <p>
            Votre réponse:{"  "}
            <span class="font-medium">
              {response.value === "yes" && "✅ Oui, je participe"}
              {response.value === "maybe" && "🤔 Peut-être"}
              {response.value === "no" && "❌ Non, je ne peux pas"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
