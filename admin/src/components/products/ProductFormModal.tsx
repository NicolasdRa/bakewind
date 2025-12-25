import { Component, createSignal, Show, createEffect } from "solid-js";
import {
  Product,
  ProductCategory,
  ProductStatus,
  CreateProductRequest,
  UpdateProductRequest,
} from "~/api/products";

// Common components
import { Modal, ModalHeader, ModalBody, ModalFooter } from "~/components/common/Modal";
import { FormRow, FormStack } from "~/components/common/FormRow";
import { SectionTitle, ButtonGroup } from "~/components/common/Card";
import Alert from "~/components/common/Alert";
import Button from "~/components/common/Button";
import TextField from "~/components/common/TextField";
import TextArea from "~/components/common/TextArea";
import Select from "~/components/common/Select";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  product?: Product;
  mode: 'create' | 'edit';
}

const ProductFormModal: Component<ProductFormModalProps> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Form fields
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [category, setCategory] = createSignal<ProductCategory>('bread');
  const [status, setStatus] = createSignal<ProductStatus>('active');
  const [basePrice, setBasePrice] = createSignal('');
  const [costOfGoods, setCostOfGoods] = createSignal('');
  const [estimatedPrepTime, setEstimatedPrepTime] = createSignal('');
  const [allergens, setAllergens] = createSignal('');
  const [tags, setTags] = createSignal('');
  const [imageUrl, setImageUrl] = createSignal('');
  const [minimumOrderQuantity, setMinimumOrderQuantity] = createSignal('1');
  const [storageInstructions, setStorageInstructions] = createSignal('');
  const [shelfLife, setShelfLife] = createSignal('');

  // Populate form when product changes (for edit mode)
  createEffect(() => {
    if (props.isOpen && props.product && props.mode === 'edit') {
      setName(props.product.name);
      setDescription(props.product.description || '');
      setCategory(props.product.category);
      setStatus(props.product.status);
      setBasePrice(props.product.basePrice.toString());
      setCostOfGoods(props.product.costOfGoods?.toString() || '');
      setEstimatedPrepTime(props.product.estimatedPrepTime?.toString() || '');
      setAllergens(props.product.allergens?.join(', ') || '');
      setTags(props.product.tags?.join(', ') || '');
      setImageUrl(props.product.imageUrl || '');
      setMinimumOrderQuantity(props.product.minimumOrderQuantity.toString());
      setStorageInstructions(props.product.storageInstructions || '');
      setShelfLife(props.product.shelfLife?.toString() || '');
    } else if (props.isOpen && props.mode === 'create') {
      // Reset form for create mode
      setName('');
      setDescription('');
      setCategory('bread');
      setStatus('active');
      setBasePrice('');
      setCostOfGoods('');
      setEstimatedPrepTime('');
      setAllergens('');
      setTags('');
      setImageUrl('');
      setMinimumOrderQuantity('1');
      setStorageInstructions('');
      setShelfLife('');
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: CreateProductRequest = {
        name: name().trim(),
        description: description().trim() || undefined,
        category: category(),
        status: status(),
        basePrice: parseFloat(basePrice()),
        costOfGoods: costOfGoods() ? parseFloat(costOfGoods()) : undefined,
        estimatedPrepTime: estimatedPrepTime() ? parseInt(estimatedPrepTime()) : undefined,
        allergens: allergens() ? allergens().split(',').map(a => a.trim()).filter(Boolean) : undefined,
        tags: tags() ? tags().split(',').map(t => t.trim()).filter(Boolean) : undefined,
        imageUrl: imageUrl().trim() || undefined,
        minimumOrderQuantity: minimumOrderQuantity() ? parseInt(minimumOrderQuantity()) : 1,
        storageInstructions: storageInstructions().trim() || undefined,
        shelfLife: shelfLife() ? parseInt(shelfLife()) : undefined,
      };

      await props.onSubmit(data);
      props.onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} size="xl">
      <ModalHeader
        title={props.mode === 'create' ? 'Create New Product' : 'Edit Product'}
        onClose={props.onClose}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FormStack>
            <Show when={error()}>
              <Alert variant="error">{error()}</Alert>
            </Show>

            {/* Basic Information */}
            <FormStack>
              <SectionTitle>Basic Information</SectionTitle>

              <FormRow cols={2}>
                <TextField
                  label="Product Name *"
                  type="text"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  required
                />

                <Select
                  label="Category *"
                  value={category()}
                  onChange={(e) => setCategory(e.currentTarget.value as ProductCategory)}
                  required
                >
                  <option value="bread">Bread</option>
                  <option value="pastry">Pastry</option>
                  <option value="cake">Cake</option>
                  <option value="cookie">Cookie</option>
                  <option value="sandwich">Sandwich</option>
                  <option value="beverage">Beverage</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="custom">Custom</option>
                </Select>
              </FormRow>

              <FormRow cols={2}>
                <Select
                  label="Status *"
                  value={status()}
                  onChange={(e) => setStatus(e.currentTarget.value as ProductStatus)}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="discontinued">Discontinued</option>
                </Select>

                <TextField
                  label="Base Price ($) *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={basePrice()}
                  onInput={(e) => setBasePrice(e.currentTarget.value)}
                  required
                />
              </FormRow>

              <TextField
                label="Cost of Goods ($)"
                type="number"
                step="0.01"
                min="0"
                value={costOfGoods()}
                onInput={(e) => setCostOfGoods(e.currentTarget.value)}
                helperText="Margin will be calculated automatically based on base price and cost of goods"
              />

              <TextArea
                label="Description"
                value={description()}
                onInput={(e) => setDescription(e.currentTarget.value)}
                rows={3}
              />
            </FormStack>

            {/* Additional Details */}
            <FormStack>
              <SectionTitle>Additional Details</SectionTitle>

              <FormRow cols={2}>
                <TextField
                  label="Estimated Prep Time (minutes)"
                  type="number"
                  min="0"
                  value={estimatedPrepTime()}
                  onInput={(e) => setEstimatedPrepTime(e.currentTarget.value)}
                />

                <TextField
                  label="Shelf Life (hours)"
                  type="number"
                  min="0"
                  value={shelfLife()}
                  onInput={(e) => setShelfLife(e.currentTarget.value)}
                />
              </FormRow>

              <FormRow cols={2}>
                <TextField
                  label="Minimum Order Quantity"
                  type="number"
                  min="1"
                  value={minimumOrderQuantity()}
                  onInput={(e) => setMinimumOrderQuantity(e.currentTarget.value)}
                />

                <TextField
                  label="Image URL"
                  type="url"
                  value={imageUrl()}
                  onInput={(e) => setImageUrl(e.currentTarget.value)}
                />
              </FormRow>

              <TextField
                label="Allergens (comma-separated)"
                type="text"
                value={allergens()}
                onInput={(e) => setAllergens(e.currentTarget.value)}
                placeholder="e.g., gluten, dairy, nuts"
              />

              <TextField
                label="Tags (comma-separated)"
                type="text"
                value={tags()}
                onInput={(e) => setTags(e.currentTarget.value)}
                placeholder="e.g., popular, signature, vegan"
              />

              <TextArea
                label="Storage Instructions"
                value={storageInstructions()}
                onInput={(e) => setStorageInstructions(e.currentTarget.value)}
                rows={2}
              />
            </FormStack>
          </FormStack>
        </ModalBody>

        <ModalFooter>
          <ButtonGroup>
            <Button
              type="button"
              onClick={props.onClose}
              disabled={loading()}
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
              {loading() ? 'Saving...' : props.mode === 'create' ? 'Create Product' : 'Save Changes'}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default ProductFormModal;
