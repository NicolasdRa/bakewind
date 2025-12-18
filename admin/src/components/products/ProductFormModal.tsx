import { Component, createSignal, Show, createEffect } from "solid-js";
import {
  Product,
  ProductCategory,
  ProductStatus,
  CreateProductRequest,
  UpdateProductRequest,
} from "~/api/products";
import Button from "~/components/common/Button";

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
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ "background-color": "rgba(0, 0, 0, 0.5)" }}>
        <div
          class="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border"
          style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)",
            "box-shadow": "var(--shadow-card)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="sticky top-0 z-10 px-6 py-4 border-b flex justify-between items-center" style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)"
          }}>
            <h2 class="text-2xl font-bold" style="color: var(--text-primary)">
              {props.mode === 'create' ? 'Create New Product' : 'Edit Product'}
            </h2>
            <Button
              onClick={props.onClose}
              variant="ghost"
              size="sm"
              class="p-1"
            >
              ×
            </Button>
          </div>

          <form onSubmit={handleSubmit} class="p-6">
            <Show when={error()}>
              <div class="mb-4 p-4 rounded-lg border" style={{
                "background-color": "var(--error-bg)",
                "border-color": "var(--error-color)",
                "color": "var(--error-color)"
              }}>
                {error()}
              </div>
            </Show>

            {/* Basic Information */}
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary)">Basic Information</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={name()}
                    onInput={(e) => setName(e.currentTarget.value)}
                    required
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Category *
                  </label>
                  <select
                    value={category()}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    required
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  >
                    <option value="bread">Bread</option>
                    <option value="pastry">Pastry</option>
                    <option value="cake">Cake</option>
                    <option value="cookie">Cookie</option>
                    <option value="sandwich">Sandwich</option>
                    <option value="beverage">Beverage</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Status *
                  </label>
                  <select
                    value={status()}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    required
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Base Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={basePrice()}
                    onInput={(e) => setBasePrice(e.currentTarget.value)}
                    required
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Cost of Goods ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costOfGoods()}
                    onInput={(e) => setCostOfGoods(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                  <p class="mt-1 text-xs" style="color: var(--text-tertiary)">
                    Margin will be calculated automatically based on base price and cost of goods
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                  Description
                </label>
                <textarea
                  value={description()}
                  onInput={(e) => setDescription(e.currentTarget.value)}
                  rows="3"
                  class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                  style={{
                    "background-color": "var(--bg-primary)",
                    "border-color": "var(--border-color)",
                    "color": "var(--text-primary)",
                    "--tw-ring-color": "var(--primary-color)"
                  }}
                />
              </div>
            </div>

            {/* Additional Details */}
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary)">Additional Details</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Estimated Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={estimatedPrepTime()}
                    onInput={(e) => setEstimatedPrepTime(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Shelf Life (hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shelfLife()}
                    onInput={(e) => setShelfLife(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Minimum Order Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minimumOrderQuantity()}
                    onInput={(e) => setMinimumOrderQuantity(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl()}
                    onInput={(e) => setImageUrl(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Allergens (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={allergens()}
                    onInput={(e) => setAllergens(e.currentTarget.value)}
                    placeholder="e.g., gluten, dairy, nuts"
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags()}
                    onInput={(e) => setTags(e.currentTarget.value)}
                    placeholder="e.g., popular, signature, vegan"
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
                    Storage Instructions
                  </label>
                  <textarea
                    value={storageInstructions()}
                    onInput={(e) => setStorageInstructions(e.currentTarget.value)}
                    rows="2"
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-primary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div class="flex justify-end gap-3 pt-4 border-t" style={{ "border-color": "var(--border-color)" }}>
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
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};

export default ProductFormModal;
