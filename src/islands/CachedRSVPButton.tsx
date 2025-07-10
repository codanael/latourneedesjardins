// Enhanced RSVP Button with client-side caching
// Provides optimistic updates and cache management for better UX

import { Signal, useSignal } from "@preact/signals";
import { updateRSVPWithCache } from "../utils/cached-events.ts";

interface CachedRSVPButtonProps {
  eventId: number;
  currentResponse?: "yes" | "no";
  currentPlusOne?: boolean;
}

export default function CachedRSVPButton({
  eventId,
  currentResponse,
  currentPlusOne,
}: CachedRSVPButtonProps) {
  const response: Signal<"yes" | "no" | undefined> = useSignal(
    currentResponse,
  );
  const plusOne: Signal<boolean> = useSignal(currentPlusOne || false);
  const isLoading: Signal<boolean> = useSignal(false);
  const error: Signal<string | null> = useSignal(null);

  const handleRSVP = async (
    newResponse: "yes" | "no",
    newPlusOne: boolean = false,
  ) => {
    // Optimistic update
    const previousResponse = response.value;
    const previousPlusOne = plusOne.value;
    response.value = newResponse;
    plusOne.value = newPlusOne;
    isLoading.value = true;
    error.value = null;

    try {
      const success = await updateRSVPWithCache(
        eventId,
        newResponse,
        newPlusOne,
      );

      if (!success) {
        // Revert optimistic update on failure
        response.value = previousResponse;
        plusOne.value = previousPlusOne;
        error.value = "Erreur lors de la mise à jour de votre RSVP";
      } else {
        // Dispatch event to notify other components
        globalThis.dispatchEvent(
          new CustomEvent("rsvp-updated", {
            detail: { eventId, response: newResponse, plus_one: newPlusOne },
          }),
        );
      }
    } catch (err) {
      // Revert optimistic update on error
      response.value = previousResponse;
      plusOne.value = previousPlusOne;
      error.value = "Erreur de connexion";
      console.error("RSVP update failed:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const getButtonClass = (buttonResponse: "yes" | "no") => {
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

  const handlePlusOneChange = (checked: boolean) => {
    if (response.value === "yes") {
      handleRSVP("yes", checked);
    } else {
      plusOne.value = checked;
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
          onClick={() => handleRSVP("yes", plusOne.value)}
          disabled={isLoading.value}
          class={getButtonClass("yes")}
          aria-label="Confirmer ma participation"
        >
          <span class="mr-2">✅</span>
          {isLoading.value && response.value === "yes" ? "..." : "Oui"}
        </button>

        <button
          type="button"
          onClick={() => handleRSVP("no", false)}
          disabled={isLoading.value}
          class={getButtonClass("no")}
          aria-label="Décliner la participation"
        >
          <span class="mr-2">❌</span>
          {isLoading.value && response.value === "no" ? "..." : "Non"}
        </button>
      </div>

      {response.value === "yes" && (
        <div class="bg-green-50 border border-green-200 rounded-lg p-3">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={plusOne.value}
              onChange={(e) => handlePlusOneChange(e.currentTarget.checked)}
              disabled={isLoading.value}
              class="rounded border-green-300 text-green-600 focus:ring-green-500"
            />
            <span class="text-sm text-green-800">
              J'amène un accompagnateur (+1)
            </span>
          </label>
        </div>
      )}

      {response.value && (
        <div class="text-sm text-gray-600 text-center">
          <p>
            Votre réponse:{"  "}
            <span class="font-medium">
              {response.value === "yes" && (
                <>
                  ✅ Oui, je participe
                  {plusOne.value && <span class="text-green-600">(+1)</span>}
                </>
              )}
              {response.value === "no" && "❌ Non, je ne peux pas"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
