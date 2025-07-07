// Enhanced Potluck Manager with client-side caching
// Provides optimistic updates and cache management for better UX

import { Signal, useSignal } from "@preact/signals";
import { updatePotluckWithCache } from "../utils/cached-events.ts";
import type { PotluckItem } from "../utils/db-operations.ts";

interface CachedPotluckManagerProps {
  eventId: number;
  currentUserId?: number;
  initialItems: PotluckItem[];
}

export default function CachedPotluckManager({
  eventId,
  currentUserId,
  initialItems,
}: CachedPotluckManagerProps) {
  const items: Signal<PotluckItem[]> = useSignal(initialItems);
  const isLoading: Signal<boolean> = useSignal(false);
  const error: Signal<string | null> = useSignal(null);
  const showAddForm: Signal<boolean> = useSignal(false);
  const newItemName: Signal<string> = useSignal("");
  const newItemCategory: Signal<string> = useSignal("entrée");

  const categories = [
    { value: "entrée", label: "🥗 Entrée", emoji: "🥗" },
    { value: "plat", label: "🍽️ Plat principal", emoji: "🍽️" },
    { value: "dessert", label: "🍰 Dessert", emoji: "🍰" },
    { value: "boisson", label: "🥤 Boisson", emoji: "🥤" },
    { value: "autre", label: "📦 Autre", emoji: "📦" },
  ];

  const addItem = async () => {
    if (!newItemName.value.trim() || !currentUserId) return;

    const tempId = Date.now(); // Temporary ID for optimistic update
    const newItem: PotluckItem = {
      id: tempId,
      event_id: eventId,
      user_id: currentUserId,
      user_name: "Vous", // Will be updated by server
      item_name: newItemName.value.trim(),
      category: newItemCategory.value,
      quantity: 1, // Default quantity
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    items.value = [...items.value, newItem];
    isLoading.value = true;
    error.value = null;

    try {
      const success = await updatePotluckWithCache(eventId, "add", {
        item_name: newItem.item_name,
        category: newItem.category,
      });

      if (success) {
        // Clear form
        newItemName.value = "";
        showAddForm.value = false;

        // In a real implementation, you'd want to refresh the data
        // For now, we'll keep the optimistic update
      } else {
        // Remove the optimistic item on failure
        items.value = items.value.filter((item) => item.id !== tempId);
        error.value = "Erreur lors de l'ajout de l'article";
      }
    } catch (err) {
      // Remove the optimistic item on error
      items.value = items.value.filter((item) => item.id !== tempId);
      error.value = "Erreur de connexion";
      console.error("Add potluck item failed:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const deleteItem = async (itemId: number) => {
    if (!currentUserId) return;

    // Find the item to delete
    const itemToDelete = items.value.find((item) => item.id === itemId);
    if (!itemToDelete || itemToDelete.user_id !== currentUserId) return;

    // Optimistic update
    const originalItems = items.value;
    items.value = items.value.filter((item) => item.id !== itemId);
    isLoading.value = true;
    error.value = null;

    try {
      const success = await updatePotluckWithCache(eventId, "delete", {
        id: itemId,
      });

      if (!success) {
        // Revert optimistic update on failure
        items.value = originalItems;
        error.value = "Erreur lors de la suppression de l'article";
      }
    } catch (err) {
      // Revert optimistic update on error
      items.value = originalItems;
      error.value = "Erreur de connexion";
      console.error("Delete potluck item failed:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const groupedItems = categories.map((category) => ({
    ...category,
    items: items.value.filter((item) => item.category === category.value),
  }));

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-green-800">
          🍽️ Repas partagé
        </h2>
        {currentUserId && (
          <button
            type="button"
            onClick={() => showAddForm.value = !showAddForm.value}
            class="btn btn-primary text-sm"
            disabled={isLoading.value}
          >
            <span class="mr-1">➕</span>
            Ajouter
          </button>
        )}
      </div>

      {error.value && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p class="text-red-800 text-sm">{error.value}</p>
        </div>
      )}

      {showAddForm.value && currentUserId && (
        <div class="bg-green-50 rounded-lg p-4 mb-4">
          <h3 class="font-medium text-green-800 mb-3">Ajouter un article</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'article
              </label>
              <input
                type="text"
                value={newItemName.value}
                onInput={(e) =>
                  newItemName.value = (e.target as HTMLInputElement).value}
                placeholder="Ex: Salade de quinoa"
                class="form-input"
                disabled={isLoading.value}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={newItemCategory.value}
                onChange={(e) =>
                  newItemCategory.value = (e.target as HTMLSelectElement).value}
                class="form-input"
                disabled={isLoading.value}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                onClick={addItem}
                disabled={!newItemName.value.trim() || isLoading.value}
                class="btn btn-primary flex-1"
              >
                {isLoading.value ? "Ajout..." : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  showAddForm.value = false;
                  newItemName.value = "";
                  error.value = null;
                }}
                class="btn btn-secondary"
                disabled={isLoading.value}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div class="space-y-4">
        {groupedItems.map((category) => (
          <div key={category.value}>
            <h3 class="font-medium text-gray-800 mb-2 flex items-center">
              <span class="mr-2">{category.emoji}</span>
              {category.label.replace(category.emoji + " ", "")}
              <span class="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {category.items.length}
              </span>
            </h3>

            {category.items.length > 0
              ? (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      class="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div class="flex-1">
                        <p class="font-medium text-gray-900">
                          {item.item_name}
                        </p>
                        <p class="text-sm text-gray-600">
                          Par {item.user_name}
                        </p>
                      </div>
                      {item.user_id === currentUserId && (
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          disabled={isLoading.value}
                          class="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                          aria-label={`Supprimer ${item.item_name}`}
                        >
                          <span class="text-sm">🗑️</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
              : (
                <p class="text-gray-500 text-sm italic">
                  Aucun article dans cette catégorie
                </p>
              )}
          </div>
        ))}
      </div>

      {items.value.length === 0 && (
        <div class="text-center py-8">
          <div class="text-4xl mb-2">🍽️</div>
          <p class="text-gray-600 mb-2">Aucun article pour le moment</p>
          {currentUserId && (
            <p class="text-sm text-gray-500">
              Soyez le premier à ajouter quelque chose !
            </p>
          )}
        </div>
      )}
    </div>
  );
}
