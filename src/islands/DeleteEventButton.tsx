import { useState } from "preact/hooks";

interface DeleteEventButtonProps {
  eventId: number;
  eventTitle: string;
  onDelete?: () => void;
  className?: string;
}

export default function DeleteEventButton({
  eventId,
  eventTitle,
  onDelete,
  className = "btn btn-ghost text-red-600 hover:bg-red-50",
}: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success - redirect or call callback
        if (onDelete) {
          onDelete();
        } else {
          // Redirect to events page
          globalThis.location.href = "/events";
        }
      } else {
        // Error
        alert(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Erreur lors de la suppression de l'événement");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
          <div class="text-center">
            <div class="text-4xl mb-4">⚠️</div>
            <h3 class="text-lg font-bold text-red-800 mb-2">
              Confirmer la suppression
            </h3>
            <p class="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer l'événement
              <br />
              <strong>"{eventTitle}"</strong> ?
              <br />
              <br />
              Cette action est irréversible.
            </p>
            <div class="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                class="btn btn-secondary flex-1"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                class="btn btn-primary bg-red-600 hover:bg-red-700 flex-1"
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      class={className}
      disabled={isDeleting}
    >
      <span class="mr-2">🗑️</span>
      Supprimer
    </button>
  );
}
