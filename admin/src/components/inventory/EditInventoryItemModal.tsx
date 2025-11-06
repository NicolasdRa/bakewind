import { Component, createSignal, createResource, Show, createEffect } from "solid-js";
import { inventoryApi, UpdateInventoryItemRequest } from "~/api/inventory";

interface EditInventoryItemModalProps {
  isOpen: boolean;
  itemId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditInventoryItemModal: Component<EditInventoryItemModalProps> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Fetch existing item data
  const [itemData] = createResource(
    () => props.itemId,
    async (id) => {
      if (!id) return null;
      return inventoryApi.getInventoryItem(id);
    }
  );

  // Initialize form data as empty
  const [formData, setFormData] = createSignal<UpdateInventoryItemRequest>({});

  // Update form data when item loads
  createEffect(() => {
    const item = itemData();
    if (item && props.isOpen) {
      setFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        reorderPoint: item.reorderPoint,
        reorderQuantity: item.reorderQuantity,
        costPerUnit: item.costPerUnit,
        supplier: item.supplier || "",
        location: item.location || "",
        notes: item.notes || "",
      });
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!props.itemId) return;

    setLoading(true);
    setError(null);

    try {
      await inventoryApi.updateInventoryItem(props.itemId, formData());
      props.onSuccess();
      props.onClose();
    } catch (err: any) {
      setError(err?.data?.message || "Failed to update inventory item");
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof UpdateInventoryItemRequest>(
    field: K,
    value: UpdateInventoryItemRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Show when={props.isOpen && props.itemId}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ "background-color": "rgba(0, 0, 0, 0.5)" }}
        onClick={props.onClose}
      >
        <div
          class="rounded-xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="p-6 border-b" style={{ "border-color": "var(--border-color)" }}>
            <h2 class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Edit Inventory Item
            </h2>
          </div>

          <Show when={!itemData.loading && itemData()} fallback={
            <div class="p-12 text-center">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto" style={{
                "border-color": "var(--primary-color)"
              }}></div>
            </div>
          }>
            <form onSubmit={handleSubmit} class="p-6 space-y-4">
              <Show when={error()}>
                <div
                  class="p-4 rounded-lg"
                  style={{
                    "background-color": "var(--error-light)",
                    color: "var(--error-color)",
                  }}
                >
                  {error()}
                </div>
              </Show>

              {/* Name */}
              <div>
                <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Item Name
                </label>
                <input
                  type="text"
                  value={formData().name || ""}
                  onInput={(e) => updateField("name", e.currentTarget.value)}
                  class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    "background-color": "var(--bg-primary)",
                    "border-color": "var(--border-color)",
                    color: "var(--text-primary)",
                    "--tw-ring-color": "var(--primary-color)",
                  }}
                />
              </div>

              {/* Category and Unit */}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Category
                  </label>
                  <select
                    value={formData().category || ""}
                    onChange={(e) => updateField("category", e.currentTarget.value as any)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)",
                    }}
                  >
                    <option value="ingredient">Ingredient</option>
                    <option value="packaging">Packaging</option>
                    <option value="supplies">Supplies</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Unit
                  </label>
                  <select
                    value={formData().unit || ""}
                    onChange={(e) => updateField("unit", e.currentTarget.value as any)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)",
                    }}
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="unit">Unit</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </div>

              {/* Stock Quantities */}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData().currentStock ?? ""}
                    onInput={(e) => updateField("currentStock", parseFloat(e.currentTarget.value) || 0)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)",
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData().minimumStock ?? ""}
                    onInput={(e) => updateField("minimumStock", parseFloat(e.currentTarget.value) || 0)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)",
                    }}
                  />
                </div>
              </div>

              {/* Reorder Settings */}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData().reorderPoint ?? ""}
                    onInput={(e) => updateField("reorderPoint", parseFloat(e.currentTarget.value) || 0)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)",
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Reorder Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={formData().reorderQuantity ?? ""}
                    onInput={(e) => updateField("reorderQuantity", parseFloat(e.currentTarget.value) || 0)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)",
                    }}
                  />
                </div>
              </div>

              {/* Cost Per Unit */}
              <div>
                <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Cost Per Unit
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData().costPerUnit ?? ""}
                  onInput={(e) => updateField("costPerUnit", parseFloat(e.currentTarget.value) || 0)}
                  class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    "background-color": "var(--bg-primary)",
                    "border-color": "var(--border-color)",
                    color: "var(--text-primary)",
                    "--tw-ring-color": "var(--primary-color)",
                  }}
                />
              </div>

              {/* Optional Fields */}
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData().supplier || ""}
                    onInput={(e) => updateField("supplier", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)",
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData().location || ""}
                    onInput={(e) => updateField("location", e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)",
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Notes
                </label>
                <textarea
                  value={formData().notes || ""}
                  onInput={(e) => updateField("notes", e.currentTarget.value)}
                  rows={3}
                  class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    "background-color": "var(--bg-primary)",
                    "border-color": "var(--border-color)",
                    color: "var(--text-primary)",
                    "--tw-ring-color": "var(--primary-color)",
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={props.onClose}
                  class="px-5 py-2.5 rounded-lg font-medium transition-all"
                  style={{
                    "background-color": "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading()}
                  class="px-5 py-2.5 rounded-lg font-medium transition-all hover:shadow-md focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{
                    "background-color": "var(--primary-color)",
                    color: "white",
                    "--tw-ring-color": "var(--primary-color)",
                  }}
                >
                  {loading() ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default EditInventoryItemModal;
