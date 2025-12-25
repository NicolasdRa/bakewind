import { Component, createSignal, Show } from "solid-js";
import { inventoryApi, CreateInventoryItemRequest } from "~/api/inventory";

// Common components
import { Modal, ModalHeader, ModalBody, ModalFooter } from "~/components/common/Modal";
import { FormRow, FormStack } from "~/components/common/FormRow";
import { ButtonGroup } from "~/components/common/Card";
import Alert from "~/components/common/Alert";
import Button from "~/components/common/Button";
import TextField from "~/components/common/TextField";
import TextArea from "~/components/common/TextArea";
import Select from "~/components/common/Select";

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
    <Modal isOpen={props.isOpen} onClose={props.onClose} size="lg">
      <ModalHeader title="Add Inventory Item" onClose={props.onClose} />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FormStack>
            <Show when={error()}>
              <Alert variant="error">{error()}</Alert>
            </Show>

            {/* Name */}
            <TextField
              label="Item Name *"
              type="text"
              required
              value={formData().name}
              onInput={(e) => updateField("name", e.currentTarget.value)}
              placeholder="e.g., All-Purpose Flour"
            />

            {/* Category and Unit */}
            <FormRow cols={2}>
              <Select
                label="Category *"
                required
                value={formData().category}
                onChange={(e) => updateField("category", e.currentTarget.value as any)}
              >
                <option value="ingredient">Ingredient</option>
                <option value="packaging">Packaging</option>
                <option value="supplies">Supplies</option>
              </Select>

              <Select
                label="Unit *"
                required
                value={formData().unit}
                onChange={(e) => updateField("unit", e.currentTarget.value as any)}
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="l">Liter (l)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="unit">Unit</option>
                <option value="dozen">Dozen</option>
              </Select>
            </FormRow>

            {/* Stock Quantities */}
            <FormRow cols={2}>
              <TextField
                label="Current Stock *"
                type="number"
                required
                min="0"
                step="0.001"
                value={formData().currentStock.toString()}
                onInput={(e) => updateField("currentStock", parseFloat(e.currentTarget.value) || 0)}
              />

              <TextField
                label="Minimum Stock *"
                type="number"
                required
                min="0"
                step="0.001"
                value={formData().minimumStock.toString()}
                onInput={(e) => updateField("minimumStock", parseFloat(e.currentTarget.value) || 0)}
              />
            </FormRow>

            {/* Reorder Settings */}
            <FormRow cols={2}>
              <TextField
                label="Reorder Point *"
                type="number"
                required
                min="0"
                step="0.001"
                value={formData().reorderPoint.toString()}
                onInput={(e) => updateField("reorderPoint", parseFloat(e.currentTarget.value) || 0)}
              />

              <TextField
                label="Reorder Quantity *"
                type="number"
                required
                min="0"
                step="0.001"
                value={formData().reorderQuantity.toString()}
                onInput={(e) => updateField("reorderQuantity", parseFloat(e.currentTarget.value) || 0)}
              />
            </FormRow>

            {/* Cost Per Unit */}
            <TextField
              label="Cost Per Unit *"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData().costPerUnit.toString()}
              onInput={(e) => updateField("costPerUnit", parseFloat(e.currentTarget.value) || 0)}
              placeholder="0.00"
            />

            {/* Optional Fields */}
            <FormRow cols={2}>
              <TextField
                label="Supplier"
                type="text"
                value={formData().supplier || ""}
                onInput={(e) => updateField("supplier", e.currentTarget.value)}
                placeholder="e.g., King Arthur Flour Co."
              />

              <TextField
                label="Location"
                type="text"
                value={formData().location || ""}
                onInput={(e) => updateField("location", e.currentTarget.value)}
                placeholder="e.g., Storage Room A"
              />
            </FormRow>

            {/* Notes */}
            <TextArea
              label="Notes"
              value={formData().notes || ""}
              onInput={(e) => updateField("notes", e.currentTarget.value)}
              rows={3}
              placeholder="Additional notes or instructions"
            />
          </FormStack>
        </ModalBody>

        <ModalFooter>
          <ButtonGroup>
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
          </ButtonGroup>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AddInventoryItemModal;
