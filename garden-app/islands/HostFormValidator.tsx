import { useState } from "preact/hooks";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  hasWarnings: boolean;
  message: string;
}

interface HostFormValidatorProps {
  onValidationChange: (result: ValidationResult | null) => void;
}

export default function HostFormValidator(
  { onValidationChange }: HostFormValidatorProps,
) {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(
    null,
  );

  const _validateForm = async (formData: FormData) => {
    setIsValidating(true);

    try {
      const data = {
        name: formData.get("name")?.toString() || "",
        email: formData.get("email")?.toString() || "",
        phone: formData.get("phone")?.toString() || "",
        eventTitle: formData.get("eventTitle")?.toString() || "",
        eventDate: formData.get("eventDate")?.toString() || "",
        eventTime: formData.get("eventTime")?.toString() || "",
        location: formData.get("location")?.toString() || "",
        maxAttendees: formData.get("maxAttendees")?.toString() || "",
      };

      const response = await fetch("/api/hosts/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: ValidationResult = await response.json();
      setLastValidation(result);
      onValidationChange(result);
    } catch (error) {
      console.error("Validation error:", error);
      const errorResult: ValidationResult = {
        valid: false,
        errors: ["Erreur de validation"],
        warnings: [],
        hasWarnings: false,
        message: "Erreur de validation",
      };
      setLastValidation(errorResult);
      onValidationChange(errorResult);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div class="bg-gray-50 p-4 rounded-lg mb-6">
      {/* Validation results display */}

      {lastValidation && (
        <div
          class={`p-3 rounded-md ${
            lastValidation.valid
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h4
            class={`font-medium ${
              lastValidation.valid ? "text-green-800" : "text-red-800"
            }`}
          >
            {lastValidation.message}
          </h4>

          {lastValidation.errors.length > 0 && (
            <ul class="mt-2 text-sm text-red-700 list-disc list-inside">
              {lastValidation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}

          {lastValidation.warnings.length > 0 && (
            <ul class="mt-2 text-sm text-yellow-700 list-disc list-inside">
              {lastValidation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isValidating && (
        <div class="text-center text-gray-600">
          <span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2">
          </span>
          Validation en cours...
        </div>
      )}
    </div>
  );
}
