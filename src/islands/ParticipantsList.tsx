import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface Participant {
  id: number;
  user_name?: string;
  response: "yes" | "no";
  plus_one: boolean;
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
  const totalAttendees = yesRsvps.reduce(
    (total, rsvp) => total + 1 + (rsvp.plus_one ? 1 : 0),
    0,
  );

  return (
    <section class="card-elevated">
      <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <span class="mr-2">👥</span>
        Participants ({yesRsvps.length} confirmés, {totalAttendees} total)
        {isLoading.value && (
          <span class="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600">
          </span>
        )}
      </h2>

      <div class="space-y-6">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-green-700 flex items-center">
              <span class="mr-2">✅</span>
              Confirmés
            </h3>
            <span class="badge-success">{totalAttendees} personnes</span>
          </div>
          {yesRsvps.length > 0
            ? (
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {yesRsvps.map((rsvp) => (
                  <div
                    key={rsvp.id}
                    class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-3 py-2 rounded-lg text-sm font-medium text-green-800 flex items-center justify-between"
                  >
                    <span>{rsvp.user_name || "Utilisateur anonyme"}</span>
                    {rsvp.plus_one && (
                      <span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                        +1
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
            : (
              <p class="text-gray-500 italic text-sm">
                Aucun participant confirmé
              </p>
            )}
        </div>
      </div>
    </section>
  );
}
