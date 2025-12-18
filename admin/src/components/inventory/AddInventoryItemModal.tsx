import { Component, createSignal, Show } from "solid-js";
import { inventoryApi, CreateInventoryItemRequest } from "~/api/inventory";
import Button from "~/components/common/Button";

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddInventoryItemModal: Component<AddInventoryItemModalProps> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const [formData, setFormData] = createSignal<CreateInventoryItemRequest>({
    name: "",
    category: "ingredient",
    unit: "kg",
    currentStock: 0,
    minimumStock: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    costPerUnit: 0,
    supplier: "",
    location: "",
    notes: "",
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await inventoryApi.createInventoryItem(formData());
      props.onSuccess();
      props.onClose();
      // Reset form
      setFormData({
        name: "",
        category: "ingredient",
        unit: "kg",
        currentStock: 0,
        minimumStock: 0,
        reorderPoint: 0,
        reorderQuantity: 0,
        costPerUnit: 0,
        supplier: "",
        location: "",
        notes: "",
      });
    } catch (err: any) {
      setError(err?.data?.message || "Failed to create inventory item");
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof CreateInventoryItemRequest>(
    field: K,
    value: CreateInventoryItemRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Show when={props.isOpen}>
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
              Add Inventory Item
            </h2>
          </div>

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
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData().name}
                onInput={(e) => updateField("name", e.currentTarget.value)}
                class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                style={{
                  "background-color": "var(--bg-primary)",
                  "border-color": "var(--border-color)",
                  color: "var(--text-primary)",
                  "--tw-ring-color": "var(--primary-color)",
                }}
                placeholder="e.g., All-Purpose Flour"
              />
            </div>

            {/* Category and Unit */}
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Category *
                </label>
                <select
                  required
                  value={formData().category}
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
                  Unit *
                </label>
                <select
                  required
                  value={formData().unit}
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
                  Current Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.001"
                  value={formData().currentStock}
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
                  Minimum Stock *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.001"
                  value={formData().minimumStock}
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
                  Reorder Point *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.001"
                  value={formData().reorderPoint}
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
                  Reorder Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.001"
                  value={formData().reorderQuantity}
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
                Cost Per Unit *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData().costPerUnit}
                onInput={(e) => updateField("costPerUnit", parseFloat(e.currentTarget.value) || 0)}
                class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                style={{
                  "background-color": "var(--bg-primary)",
                  "border-color": "var(--border-color)",
                  color: "var(--text-primary)",
                  "--tw-ring-color": "var(--primary-color)",
                }}
                placeholder="0.00"
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
                  placeholder="e.g., King Arthur Flour Co."
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
                  placeholder="e.g., Storage Room A"
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
                placeholder="Additional notes or instructions"
              />
            </div>

            {/* Action Buttons */}
            <div class="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={props.onClose}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading()}
                variant="primary"
                size="sm"
              >
                {loading() ? "Creating..." : "Create Item"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};

export default AddInventoryItemModal;
