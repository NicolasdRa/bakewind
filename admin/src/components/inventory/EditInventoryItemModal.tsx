import { Component, createSignal, createResource, Show, createEffect } from "solid-js";
import { inventoryApi, UpdateInventoryItemRequest } from "~/api/inventory";

// Common components
import { Modal, ModalHeader, ModalBody, ModalFooter } from "~/components/common/Modal";
import { FormRow, FormStack } from "~/components/common/FormRow";
import { ButtonGroup } from "~/components/common/Card";
import Alert from "~/components/common/Alert";
import Button from "~/components/common/Button";
import TextField from "~/components/common/TextField";
import TextArea from "~/components/common/TextArea";
import Select from "~/components/common/Select";

import styles from "./EditInventoryItemModal.module.css";

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
    <Modal isOpen={props.isOpen && !!props.itemId} onClose={props.onClose} size="lg">
      <ModalHeader title="Edit Inventory Item" onClose={props.onClose} />

      <Show
        when={!itemData.loading && itemData()}
        fallback={
          <div class={styles.loadingContainer}>
            <div class={styles.spinner}></div>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormStack>
              <Show when={error()}>
                <Alert variant="error">{error()}</Alert>
              </Show>

              {/* Name */}
              <TextField
                label="Item Name"
                type="text"
                value={formData().name || ""}
                onInput={(e) => updateField("name", e.currentTarget.value)}
              />

              {/* Category and Unit */}
              <FormRow cols={2}>
                <Select
                  label="Category"
                  value={formData().category || ""}
                  onChange={(e) => updateField("category", e.currentTarget.value as any)}
                >
                  <option value="ingredient">Ingredient</option>
                  <option value="packaging">Packaging</option>
                  <option value="supplies">Supplies</option>
                </Select>

                <Select
                  label="Unit"
                  value={formData().unit || ""}
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
                  label="Current Stock"
                  type="number"
                  min="0"
                  step="0.001"
                  value={(formData().currentStock ?? "").toString()}
                  onInput={(e) => updateField("currentStock", parseFloat(e.currentTarget.value) || 0)}
                />

                <TextField
                  label="Minimum Stock"
                  type="number"
                  min="0"
                  step="0.001"
                  value={(formData().minimumStock ?? "").toString()}
                  onInput={(e) => updateField("minimumStock", parseFloat(e.currentTarget.value) || 0)}
                />
              </FormRow>

              {/* Reorder Settings */}
              <FormRow cols={2}>
                <TextField
                  label="Reorder Point"
                  type="number"
                  min="0"
                  step="0.001"
                  value={(formData().reorderPoint ?? "").toString()}
                  onInput={(e) => updateField("reorderPoint", parseFloat(e.currentTarget.value) || 0)}
                />

                <TextField
                  label="Reorder Quantity"
                  type="number"
                  min="0"
                  step="0.001"
                  value={(formData().reorderQuantity ?? "").toString()}
                  onInput={(e) => updateField("reorderQuantity", parseFloat(e.currentTarget.value) || 0)}
                />
              </FormRow>

              {/* Cost Per Unit */}
              <TextField
                label="Cost Per Unit"
                type="number"
                min="0"
                step="0.01"
                value={(formData().costPerUnit ?? "").toString()}
                onInput={(e) => updateField("costPerUnit", parseFloat(e.currentTarget.value) || 0)}
              />

              {/* Optional Fields */}
              <FormRow cols={2}>
                <TextField
                  label="Supplier"
                  type="text"
                  value={formData().supplier || ""}
                  onInput={(e) => updateField("supplier", e.currentTarget.value)}
                />

                <TextField
                  label="Location"
                  type="text"
                  value={formData().location || ""}
                  onInput={(e) => updateField("location", e.currentTarget.value)}
                />
              </FormRow>

              {/* Notes */}
              <TextArea
                label="Notes"
                value={formData().notes || ""}
                onInput={(e) => updateField("notes", e.currentTarget.value)}
                rows={3}
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
                {loading() ? "Saving..." : "Save Changes"}
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </form>
      </Show>
    </Modal>
  );
};

export default EditInventoryItemModal;
