import { Component, createSignal, createResource, For, Show } from "solid-js";
import { productsApi, Product, ProductCategory, ProductStatus, CreateProductRequest, UpdateProductRequest } from "~/api/products";
import DashboardPageLayout from "~/layouts/DashboardPageLayout";
import ProductFormModal from "~/components/products/ProductFormModal";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import Button from "~/components/common/Button";
import { PlusIcon } from "~/components/icons";
import { Heading, Text } from "~/components/common/Typography";
import { getCategoryBadgeColor, getProductStatusVariant } from "~/components/common/Badge.config";
import styles from "./ProductsPage.module.css";

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

  const formatCategoryName = (category: ProductCategory) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatStatusName = (status: ProductStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
    const isActive = () => sortField() === field;
    return (
      <span class={styles.sortIndicator}>
        <span
          class={styles.sortArrow}
          classList={{
            [styles.sortArrowActive]: isActive() && sortDirection() === 'asc',
            [styles.sortArrowInactive]: !isActive() || sortDirection() !== 'asc'
          }}
        >
          ▲
        </span>
        <span
          class={styles.sortArrow}
          classList={{
            [styles.sortArrowActive]: isActive() && sortDirection() === 'desc',
            [styles.sortArrowInactive]: !isActive() || sortDirection() !== 'desc'
          }}
        >
          ▼
        </span>
      </span>
    );
  };

  return (
    <DashboardPageLayout
      title="Products Management"
      subtitle="Manage your bakery products and menu items"
      actions={
        <Button variant="primary" size="md" onClick={handleCreate}>
          <PlusIcon class={styles.buttonIcon} />
          <span class="btn-text">Create Product</span>
        </Button>
      }
    >
      {/* Stats Cards */}
      <div class={styles.statsGrid}>
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
      <div class={styles.filterCard}>
        <div class={styles.filterRow}>
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
          <div class={styles.loadingContainer}>
            <div class={styles.spinner}></div>
          </div>
        }
      >
        <div class={styles.tableContainer}>
          <Show
            when={(products() || []).length > 0}
            fallback={
              <div class={styles.emptyState}>
                No products found for the selected criteria.
              </div>
            }
          >
            <div class={styles.tableWrapper}>
              <table class={styles.table}>
                <thead class={styles.tableHead}>
                  <tr>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('name')}>
                      <div class={`${styles.headerContent} ${styles.minWidth140}`}>
                        <span>Product Name</span>
                        {SortIndicator('name')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth80}>Category</div>
                    </th>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('basePrice')}>
                      <div class={`${styles.headerContent} ${styles.minWidth80}`}>
                        <span>Price</span>
                        {SortIndicator('basePrice')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('costOfGoods')}>
                      <div class={`${styles.headerContent} ${styles.minWidth70}`}>
                        <span>Cost</span>
                        {SortIndicator('costOfGoods')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('margin')}>
                      <div class={`${styles.headerContent} ${styles.minWidth80}`}>
                        <span>Margin</span>
                        {SortIndicator('margin')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth80}>Status</div>
                    </th>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('popularityScore')}>
                      <div class={`${styles.headerContent} ${styles.minWidth100}`}>
                        <span>Popularity</span>
                        {SortIndicator('popularityScore')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth100}>Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={sortedProducts()}>
                    {(product) => (
                      <tr class={styles.tableRow}>
                        <td class={styles.tableCellWrap}>
                          <div>
                            <div class={styles.productName}>{product.name}</div>
                            <Show when={product.description}>
                              <div class={styles.productDescription}>
                                {product.description}
                              </div>
                            </Show>
                          </div>
                        </td>
                        <td class={styles.tableCell}>
                          <Badge color={getCategoryBadgeColor(product.category)}>
                            {formatCategoryName(product.category)}
                          </Badge>
                        </td>
                        <td class={styles.tableCell}>
                          <span class={styles.priceText}>{formatPrice(product.basePrice)}</span>
                        </td>
                        <td class={styles.tableCell}>
                          <span class={styles.costText}>
                            <Show when={product.costOfGoods} fallback="—">
                              {formatPrice(product.costOfGoods!)}
                            </Show>
                          </span>
                        </td>
                        <td class={styles.tableCell}>
                          <Show when={product.margin !== null} fallback={
                            <span class={styles.marginText}>—</span>
                          }>
                            <div class={styles.marginContainer}>
                              <span
                                classList={{
                                  [styles.marginWarning]: product.marginWarning,
                                  [styles.marginText]: !product.marginWarning
                                }}
                              >
                                {product.margin!.toFixed(1)}%
                              </span>
                              <Show when={product.marginWarning}>
                                <span class={styles.warningIcon} title="Low margin warning (below 20%)">
                                  ⚠️
                                </span>
                              </Show>
                            </div>
                          </Show>
                        </td>
                        <td class={styles.tableCell}>
                          <Badge variant={getProductStatusVariant(product.status)}>
                            {formatStatusName(product.status)}
                          </Badge>
                        </td>
                        <td class={styles.tableCell}>
                          <div class={styles.popularityContainer}>
                            <span>⭐</span>
                            <span>{product.popularityScore}</span>
                          </div>
                        </td>
                        <td class={styles.tableCell}>
                          <div class={styles.actionsRow}>
                            <Button variant="text" size="sm" onClick={() => handleEdit(product)}>
                              Edit
                            </Button>
                            <Button variant="text" size="sm" onClick={() => handleDeleteClick(product)} class={styles.deleteLink}>
                              Delete
                            </Button>
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
        <div class={styles.modalBackdrop}>
          <div class={styles.modalContent}>
            <Heading variant="card" class={styles.modalTitle}>Delete Product</Heading>
            <Text class={styles.modalText}>
              Are you sure you want to delete "{productToDelete()?.name}"? This action cannot be undone.
            </Text>
            <div class={styles.modalActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(undefined);
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </DashboardPageLayout>
  );
};

export default ProductsPage;
