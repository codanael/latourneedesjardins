import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface Participant {
  id: number;
  user_name?: string;
  response: "yes" | "no" | "maybe";
}

interface ParticipantsListProps {
  eventId: number;
  initialParticipants: Participant[];
}

export default function ParticipantsList(
  { eventId, initialParticipants }: ParticipantsListProps,
) {
  const participants = useSignal<Participant[]>(initialParticipants);
  const isLoading = useSignal(false);

  const refreshParticipants = async () => {
    isLoading.value = true;
    try {
      // Add cache-busting timestamp to ensure fresh data
      const response = await fetch(
        `/api/events/${eventId}/details?t=${Date.now()}`,
      );
      if (response.ok) {
        const data = await response.json();
        const newParticipants = data.rsvps || [];
        participants.value = newParticipants;
      } else {
        console.error("Failed to fetch participants:", response.status);
      }
    } catch (error) {
      console.error("Failed to refresh participants:", error);
    } finally {
      isLoading.value = false;
    }
  };

  // Listen for RSVP updates from RSVPButton
  useEffect(() => {
    const handleRSVPUpdate = (event: CustomEvent) => {
      if (event.detail.eventId === eventId) {
        refreshParticipants();
      }
    };

    globalThis.addEventListener(
      "rsvp-updated",
      handleRSVPUpdate as EventListener,
    );
    return () => {
      globalThis.removeEventListener(
        "rsvp-updated",
        handleRSVPUpdate as EventListener,
      );
    };
  }, [eventId]);

  const yesRsvps = participants.value.filter((p) => p.response === "yes");
  const maybeRsvps = participants.value.filter((p) => p.response === "maybe");

  return (
    <section class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-semibold text-green-800 mb-4">
        Participants ({yesRsvps.length} confirmés)
        {isLoading.value && (
          <span class="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600">
          </span>
        )}
      </h2>

      <div class="space-y-4">
        <div>
          <h3 class="font-semibold text-green-700 mb-2">
            ✅ Confirmés ({yesRsvps.length})
          </h3>
          <div class="grid grid-cols-2 gap-2">
            {yesRsvps.map((rsvp) => (
              <div key={rsvp.id} class="bg-green-50 px-3 py-2 rounded">
                {rsvp.user_name || "Utilisateur anonyme"}
              </div>
            ))}
          </div>
        </div>

        {maybeRsvps.length > 0 && (
          <div>
            <h3 class="font-semibold text-yellow-700 mb-2">
              🤔 Peut-être ({maybeRsvps.length})
            </h3>
            <div class="grid grid-cols-2 gap-2">
              {maybeRsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  class="bg-yellow-50 px-3 py-2 rounded"
                >
                  {rsvp.user_name || "Utilisateur anonyme"}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
