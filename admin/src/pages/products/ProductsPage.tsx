import { Component, createSignal, createResource, For, Show } from "solid-js";
import { productsApi, Product, ProductCategory, ProductStatus, CreateProductRequest, UpdateProductRequest } from "~/api/products";
import ProductFormModal from "~/components/products/ProductFormModal";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";

type SortField = 'name' | 'basePrice' | 'costOfGoods' | 'margin' | 'popularityScore';
type SortDirection = 'asc' | 'desc';

const ProductsPage: Component = () => {
  const [selectedCategory, setSelectedCategory] = createSignal<ProductCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = createSignal<ProductStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = createSignal('');

  // Sorting state
  const [sortField, setSortField] = createSignal<SortField>('name');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');

  // Modal state
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = createSignal<Product | undefined>();

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [productToDelete, setProductToDelete] = createSignal<Product | undefined>();

  // Fetch products with real-time filtering
  const [products, { refetch }] = createResource(
    () => ({
      category: selectedCategory() !== 'all' ? selectedCategory() as ProductCategory : undefined,
      status: selectedStatus() !== 'all' ? selectedStatus() as ProductStatus : undefined,
      search: searchQuery() || undefined,
    }),
    async (filters) => {
      return productsApi.getProducts(filters.category, filters.status, filters.search);
    }
  );

  // Handle create product
  const handleCreate = () => {
    setSelectedProduct(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Handle edit product
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Handle delete product
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    const product = productToDelete();
    if (!product) return;

    try {
      await productsApi.deleteProduct(product.id);
      await refetch();
      setShowDeleteConfirm(false);
      setProductToDelete(undefined);
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Please try again.');
    }
  };

  // Handle form submit
  const handleFormSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    if (modalMode() === 'create') {
      await productsApi.createProduct(data as CreateProductRequest);
    } else {
      const product = selectedProduct();
      if (product) {
        await productsApi.updateProduct(product.id, data);
      }
    }
    await refetch();
  };

  const getCategoryBadgeColor = (category: ProductCategory) => {
    const colors: Record<ProductCategory, string> = {
      bread: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
      pastry: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      cake: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      cookie: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      sandwich: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      beverage: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      seasonal: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      custom: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
    };
    return colors[category] || colors.custom;
  };

  const getStatusBadgeColor = (status: ProductStatus) => {
    const colors: Record<ProductStatus, string> = {
      active: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      inactive: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
      seasonal: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      discontinued: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };
    return colors[status] || colors.inactive;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getActiveCount = () => {
    return (products() || []).filter(p => p.status === 'active').length;
  };

  const getTotalValue = () => {
    return (products() || []).reduce((sum, p) => sum + p.basePrice, 0);
  };

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending order
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sorted products
  const sortedProducts = () => {
    const productsList = products() || [];
    const field = sortField();
    const direction = sortDirection();

    return [...productsList].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'basePrice':
          aValue = a.basePrice;
          bValue = b.basePrice;
          break;
        case 'costOfGoods':
          aValue = a.costOfGoods ?? 0;
          bValue = b.costOfGoods ?? 0;
          break;
        case 'margin':
          aValue = a.margin ?? 0;
          bValue = b.margin ?? 0;
          break;
        case 'popularityScore':
          aValue = a.popularityScore;
          bValue = b.popularityScore;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return direction === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  };

  // Render sort indicator - always show for sortable columns
  const SortIndicator = (field: SortField) => {
    const isActive = sortField() === field;
    return (
      <span class="ml-1 inline-flex flex-col" style={{ "line-height": "0.5" }}>
        <span
          class="text-[10px] transition-colors"
          style={{
            color: isActive && sortDirection() === 'asc'
              ? 'var(--primary-color)'
              : 'var(--text-tertiary)',
            opacity: isActive && sortDirection() === 'asc' ? '1' : '0.4'
          }}
        >
          ▲
        </span>
        <span
          class="text-[10px] transition-colors"
          style={{
            color: isActive && sortDirection() === 'desc'
              ? 'var(--primary-color)'
              : 'var(--text-tertiary)',
            opacity: isActive && sortDirection() === 'desc' ? '1' : '0.4'
          }}
        >
          ▼
        </span>
      </span>
    );
  };

  return (
    <div class="p-6 md:p-8">
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Products Management</h1>
          <p class="text-base" style="color: var(--text-secondary)">Manage your bakery products and menu items</p>
        </div>
        <button
          onClick={handleCreate}
          class="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
          style={{
            "background-color": "var(--primary-color)",
            "color": "white"
          }}
        >
          + Create Product
        </button>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Products"
          value={products()?.length || 0}
          valueColor="var(--primary-color)"
        />
        <StatsCard
          title="Active Products"
          value={getActiveCount()}
          valueColor="var(--success-color)"
        />
        <StatsCard
          title="Total Value"
          value={formatPrice(getTotalValue())}
          valueColor="var(--primary-color)"
        />
      </div>

      {/* Filter Controls */}
      <div class="mb-8 rounded-xl p-5 border" style={{
        "background-color": "var(--bg-primary)",
        "border-color": "var(--border-color)",
        "box-shadow": "var(--shadow-card)"
      }}>
        <div class="flex flex-wrap gap-4">
          <SearchInput
            value={searchQuery()}
            onInput={setSearchQuery}
            placeholder="Search by name or description..."
            label="Search Products"
          />
          <FilterSelect
            value={selectedCategory()}
            onChange={(value) => setSelectedCategory(value as ProductCategory | 'all')}
            label="Category"
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'bread', label: 'Bread' },
              { value: 'pastry', label: 'Pastry' },
              { value: 'cake', label: 'Cake' },
              { value: 'cookie', label: 'Cookie' },
              { value: 'sandwich', label: 'Sandwich' },
              { value: 'beverage', label: 'Beverage' },
              { value: 'seasonal', label: 'Seasonal' },
              { value: 'custom', label: 'Custom' }
            ]}
          />
          <FilterSelect
            value={selectedStatus()}
            onChange={(value) => setSelectedStatus(value as ProductStatus | 'all')}
            label="Status"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'seasonal', label: 'Seasonal' },
              { value: 'discontinued', label: 'Discontinued' }
            ]}
          />
        </div>
      </div>

      {/* Products Table */}
      <Show
        when={!products.loading}
        fallback={
          <div class="flex justify-center items-center py-16 rounded-xl border" style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)"
          }}>
            <div class="animate-spin rounded-full h-10 w-10 border-b-2" style={{
              "border-color": "var(--primary-color)"
            }}></div>
          </div>
        }
      >
        <div class="rounded-xl border overflow-hidden" style={{
          "background-color": "var(--bg-primary)",
          "border-color": "var(--border-color)",
          "box-shadow": "var(--shadow-card)"
        }}>
          <Show
            when={(products() || []).length > 0}
            fallback={
              <div class="p-12 text-center" style="color: var(--text-secondary)">
                No products found for the selected criteria.
              </div>
            }
          >
            <div class="overflow-x-auto">
              <table class="min-w-full" style={{
                "border-collapse": "separate",
                "border-spacing": 0
              }}>
                <thead style="background-color: var(--bg-tertiary)">
                  <tr>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                      style={{
                        "color": "var(--text-secondary)",
                        "border-color": "var(--border-color)"
                      }}
                      onClick={() => handleSort('name')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div class="flex items-center justify-between w-full min-w-[140px]">
                        <span>Product Name</span>
                        {SortIndicator('name')}
                      </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      <div class="min-w-[80px]">Category</div>
                    </th>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                      style={{
                        "color": "var(--text-secondary)",
                        "border-color": "var(--border-color)"
                      }}
                      onClick={() => handleSort('basePrice')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div class="flex items-center justify-between w-full min-w-[80px]">
                        <span>Price</span>
                        {SortIndicator('basePrice')}
                      </div>
                    </th>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                      style={{
                        "color": "var(--text-secondary)",
                        "border-color": "var(--border-color)"
                      }}
                      onClick={() => handleSort('costOfGoods')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div class="flex items-center justify-between w-full min-w-[70px]">
                        <span>Cost</span>
                        {SortIndicator('costOfGoods')}
                      </div>
                    </th>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                      style={{
                        "color": "var(--text-secondary)",
                        "border-color": "var(--border-color)"
                      }}
                      onClick={() => handleSort('margin')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div class="flex items-center justify-between w-full min-w-[80px]">
                        <span>Margin</span>
                        {SortIndicator('margin')}
                      </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      <div class="min-w-[80px]">Status</div>
                    </th>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                      style={{
                        "color": "var(--text-secondary)",
                        "border-color": "var(--border-color)"
                      }}
                      onClick={() => handleSort('popularityScore')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div class="flex items-center justify-between w-full min-w-[100px]">
                        <span>Popularity</span>
                        {SortIndicator('popularityScore')}
                      </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      <div class="min-w-[100px]">Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={sortedProducts()}>
                    {(product) => (
                      <tr class="transition-colors border-b" style={{
                        "border-color": "var(--border-light)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <td class="px-6 py-4">
                          <div>
                            <div class="text-sm font-medium" style="color: var(--text-primary)">{product.name}</div>
                            <Show when={product.description}>
                              <div class="text-xs mt-0.5 line-clamp-1" style="color: var(--text-tertiary)">
                                {product.description}
                              </div>
                            </Show>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(product.category)}`}>
                            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--text-primary)">
                          {formatPrice(product.basePrice)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--text-tertiary)">
                          <Show when={product.costOfGoods} fallback="—">
                            {formatPrice(product.costOfGoods!)}
                          </Show>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <Show when={product.margin !== null} fallback={
                            <span style="color: var(--text-tertiary)">—</span>
                          }>
                            <div class="flex items-center gap-2">
                              <span style={{
                                color: product.marginWarning ? "var(--error-color)" : "var(--text-tertiary)",
                                "font-weight": product.marginWarning ? "600" : "normal"
                              }}>
                                {product.margin!.toFixed(1)}%
                              </span>
                              <Show when={product.marginWarning}>
                                <span
                                  title="Low margin warning (below 20%)"
                                  style={{
                                    color: "var(--error-color)",
                                    "font-size": "16px",
                                    cursor: "help"
                                  }}
                                >
                                  ⚠️
                                </span>
                              </Show>
                            </div>
                          </Show>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(product.status)}`}>
                            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--text-tertiary)">
                          <div class="flex items-center gap-1">
                            <span>⭐</span>
                            <span>{product.popularityScore}</span>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <div class="flex space-x-3">
                            <button
                              onClick={() => handleEdit(product)}
                              class="font-medium transition-colors"
                              style={{
                                "color": "var(--primary-color)"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary-hover)"}
                              onMouseLeave={(e) => e.currentTarget.style.color = "var(--primary-color)"}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              class="font-medium transition-colors"
                              style={{
                                "color": "var(--error-color)"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </Show>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        product={selectedProduct()}
        mode={modalMode()}
      />

      {/* Delete Confirmation Dialog */}
      <Show when={showDeleteConfirm()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ "background-color": "rgba(0, 0, 0, 0.5)" }}>
          <div
            class="w-full max-w-md rounded-xl border p-6"
            style={{
              "background-color": "var(--bg-primary)",
              "border-color": "var(--border-color)",
              "box-shadow": "var(--shadow-card)"
            }}
          >
            <h3 class="text-xl font-bold mb-4" style="color: var(--text-primary)">
              Delete Product
            </h3>
            <p class="mb-6" style="color: var(--text-secondary)">
              Are you sure you want to delete "{productToDelete()?.name}"? This action cannot be undone.
            </p>
            <div class="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(undefined);
                }}
                class="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  "background-color": "var(--bg-secondary)",
                  "color": "var(--text-primary)",
                  "border": "1px solid var(--border-color)"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                class="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                style={{
                  "background-color": "var(--error-color)",
                  "color": "white"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ProductsPage;
