import { PotluckItem } from "../utils/db-operations.ts";

interface PotluckListProps {
  items: PotluckItem[];
  eventId: number;
  currentUserId?: number;
  onDeleteItem?: (itemId: number) => void;
  showAddForm?: boolean;
  onAddItem?: (
    item: Omit<PotluckItem, "id" | "created_at" | "updated_at" | "user_name">,
  ) => void;
}

const CATEGORIES = [
  "appetizer",
  "main",
  "side",
  "dessert",
  "drinks",
  "bread",
  "other",
] as const;

export default function PotluckList({
  items,
  eventId,
  currentUserId,
  onDeleteItem,
  showAddForm = false,
  onAddItem,
}: PotluckListProps) {
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PotluckItem[]>);

  const handleAddItem = (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const newItem = {
      event_id: eventId,
      user_id: currentUserId!,
      item_name: formData.get("item_name") as string,
      category: formData.get("category") as string,
      quantity: parseInt(formData.get("quantity") as string) || 1,
      notes: formData.get("notes") as string || undefined,
    };

    if (onAddItem) {
      onAddItem(newItem);
    }

    // Reset form
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">
        Potluck Contributions
      </h3>

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
                        {currentUserId === item.user_id && onDeleteItem && (
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            class="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
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

      {showAddForm && currentUserId && (
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                name="notes"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Serves 8 people"
              />
            </div>
          </div>
          <button
            type="submit"
            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Item
          </button>
        </form>
      )}
    </div>
  );
}
