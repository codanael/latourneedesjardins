import { signal } from "@preact/signals";

interface RSVPButtonProps {
  eventId: number;
  currentResponse?: 'yes' | 'no' | 'maybe';
}

export default function RSVPButton({ eventId, currentResponse }: RSVPButtonProps) {
  const response = signal(currentResponse || '');
  const isLoading = signal(false);
  const message = signal('');

  const submitRSVP = async (newResponse: 'yes' | 'no' | 'maybe') => {
    isLoading.value = true;
    message.value = '';

    try {
      const formData = new FormData();
      formData.append('response', newResponse);
      
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        response.value = newResponse;
        const responseLabels = {
          'yes': 'Votre participation est confirmée! 🎉',
          'no': 'Votre absence est notée.',
          'maybe': 'Votre réponse "peut-être" est enregistrée.'
        };
        message.value = responseLabels[newResponse];
      } else {
        message.value = 'Erreur lors de l\'enregistrement de votre réponse.';
      }
    } catch (error) {
      message.value = 'Erreur de connexion. Veuillez réessayer.';
    } finally {
      isLoading.value = false;
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold text-green-800 mb-4">
        Votre réponse
      </h3>
      
      {message.value && (
        <div class={`p-3 rounded-lg mb-4 ${
          message.value.includes('Erreur') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.value}
        </div>
      )}

      <div class="space-y-3">
        <button
          onClick={() => submitRSVP('yes')}
          disabled={isLoading.value}
          class={`w-full px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
            response.value === 'yes'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          <span class="mr-2">✅</span>
          Oui, je participe
          {response.value === 'yes' && <span class="ml-2">✓</span>}
        </button>

        <button
          onClick={() => submitRSVP('maybe')}
          disabled={isLoading.value}
          class={`w-full px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
            response.value === 'maybe'
              ? 'bg-yellow-500 text-white'
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          }`}
        >
          <span class="mr-2">🤔</span>
          Peut-être
          {response.value === 'maybe' && <span class="ml-2">✓</span>}
        </button>

        <button
          onClick={() => submitRSVP('no')}
          disabled={isLoading.value}
          class={`w-full px-4 py-3 rounded-lg transition-colors disabled:opacity-50 ${
            response.value === 'no'
              ? 'bg-red-500 text-white'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          <span class="mr-2">❌</span>
          Non, je ne peux pas
          {response.value === 'no' && <span class="ml-2">✓</span>}
        </button>
      </div>

      {isLoading.value && (
        <div class="text-center mt-4">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      )}
    </div>
  );
}