interface AttendeeActionsProps {
  emails: string[];
}

declare global {
  function copyEmailList(): void;
}

export default function AttendeeActions({ emails }: AttendeeActionsProps) {
  const handlePrint = () => {
    globalThis.print();
  };

  const handleCopyEmails = () => {
    const emailList = emails.join(", ");
    navigator.clipboard.writeText(emailList).then(() => {
      alert("Liste d'emails copiée dans le presse-papier!");
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = emailList;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Liste d'emails copiée dans le presse-papier!");
    });
  };

  return (
    <div class="flex flex-wrap gap-4">
      <button
        type="button"
        onClick={handlePrint}
        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        📄 Imprimer la liste
      </button>
      <button
        type="button"
        onClick={handleCopyEmails}
        class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
      >
        📧 Copier les emails
      </button>
    </div>
  );
}
