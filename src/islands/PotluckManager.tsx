import { useState } from "preact/hooks";
import { PotluckItem } from "../utils/db-operations.ts";

interface PotluckManagerProps {
  eventId: number;
  currentUserId?: number;
  initialItems?: PotluckItem[];
}

export default function PotluckManager({
  eventId,
  currentUserId,
  initialItems = [],
}: PotluckManagerProps) {
  const [items, setItems] = useState<PotluckItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories for organization
  const CATEGORIES = [
    "appetizer",
    "main",
    "side",
    "dessert",
    "drinks",
    "bread",
    "other",
  ] as const;

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PotluckItem[]>);

  // Add new item
  const handleAddItem = async (e: Event) => {
    e.preventDefault();

    if (!currentUserId) {
      setError("You must be logged in to add items");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);

      const response = await fetch(`/api/events/${eventId}/potluck`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      const result = await response.json();

      if (result.success) {
        setItems([...items, result.item]);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(result.error || "Failed to add item");
      }
    } catch (_err) {
      setError("Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: number) => {
    if (!currentUserId) {
      setError("You must be logged in to delete items");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/potluck/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      const result = await response.json();

      if (result.success) {
        setItems(items.filter((item) => item.id !== itemId));
      } else {
        setError(result.error || "Failed to delete item");
      }
    } catch (_err) {
      setError("Failed to delete item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">
        Potluck Contributions
      </h3>

      {error && (
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {items.length === 0
        ? (
          <p class="text-gray-500 text-center py-8">
            No items have been added yet. Be the first to contribute!
          </p>
        )
        : (
          <div class="space-y-6">
            {CATEGORIES.map((category) => {
              const categoryItems = itemsByCategory[category];
              if (!categoryItems || categoryItems.length === 0) return null;

              return (
                <div
                  key={category}
                  class="border-b border-gray-100 pb-4 last:border-b-0"
                >
                  <h4 class="font-medium text-gray-700 mb-3 capitalize">
                    {category === "other" ? "Other Items" : `${category}s`}
                  </h4>
                  <div class="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div class="flex-1">
                          <div class="flex items-center gap-3">
                            <span class="font-medium text-gray-800">
                              {item.item_name}
                            </span>
                            <span class="text-sm text-gray-500">
                              × {item.quantity}
                            </span>
                            <span class="text-sm text-blue-600">
                              by {item.user_name}
                            </span>
                          </div>
                          {item.notes && (
                            <p class="text-sm text-gray-600 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        {currentUserId === item.user_id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={loading}
                            class="text-red-600 hover:text-red-800 text-sm font-medium ml-4 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {currentUserId && (
        <form
          onSubmit={handleAddItem}
          class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <h4 class="font-medium text-blue-800 mb-3">Add Your Contribution</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                name="item_name"
                required
                disabled={loading}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="e.g., Caesar Salad"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                required
                disabled={loading}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category === "other"
                      ? "Other"
                      : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                min="1"
                defaultValue="1"
                disabled={loading}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                name="notes"
                disabled={loading}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="e.g., Serves 8 people"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Item"}
          </button>
        </form>
      )}

      {!currentUserId && (
        <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-yellow-800 text-sm">
            Please log in to add items to the potluck list.
          </p>
        </div>
      )}
    </div>
  );
}
