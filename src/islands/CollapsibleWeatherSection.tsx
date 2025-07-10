import { useState } from "preact/hooks";
import { ComponentChildren } from "preact";

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  isExpanded?: boolean;
  children: ComponentChildren;
}

export default function CollapsibleWeatherSection({
  title,
  icon,
  isExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  return (
    <div class="weather-section mb-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        <span class="flex items-center">
          <span class="mr-2 text-lg">{icon}</span>
          <span class="text-lg font-medium text-gray-800">{title}</span>
        </span>
        <span
          class={`transform transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {expanded && (
        <div class="mt-3 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
