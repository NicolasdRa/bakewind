import { Component, createSignal, createResource, For, Show } from "solid-js";
import { useTenantRefetch } from "~/hooks/useTenantRefetch";
import { productsApi, Product, ProductCategory, ProductStatus, CreateProductRequest, UpdateProductRequest } from "~/api/products";
import DashboardPageLayout from "~/layouts/DashboardPageLayout";
import ProductFormModal from "~/components/products/ProductFormModal";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import Button from "~/components/common/Button";
import { PlusIcon } from "~/components/icons";
import { getCategoryBadgeColor, getProductStatusVariant } from "~/components/common/Badge.config";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmptyState,
  TableLoadingState,
} from "~/components/common/Table";
import { ConfirmationModal } from "~/components/common/ConfirmationModal";
import type { SortDirection } from "~/components/common/Table";
import styles from "./ProductsPage.module.css";

type SortField = 'name' | 'basePrice' | 'costOfGoods' | 'margin' | 'popularityScore';

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
  const [products, { refetch, mutate }] = createResource(
    () => ({
      category: selectedCategory() !== 'all' ? selectedCategory() as ProductCategory : undefined,
      status: selectedStatus() !== 'all' ? selectedStatus() as ProductStatus : undefined,
      search: searchQuery() || undefined,
    }),
    async (filters) => {
      return productsApi.getProducts(filters.category, filters.status, filters.search);
    }
  );

  // Refetch when ADMIN user switches tenant, clear data when tenant is deselected
  useTenantRefetch(refetch, () => {
    mutate([]);
  });

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

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(undefined);
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

  // Get sort direction for a field
  const getSortDirection = (field: SortField): SortDirection => {
    return sortField() === field ? sortDirection() : null;
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
        fallback={<TableLoadingState message="Loading products..." />}
      >
        <TableContainer>
          <Show
            when={(products() || []).length > 0}
            fallback={
              <TableEmptyState message="No products found for the selected criteria." />
            }
          >
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell
                    sortable
                    sortDirection={getSortDirection('name')}
                    onSort={() => handleSort('name')}
                    minWidth="140px"
                  >
                    Product Name
                  </TableHeaderCell>
                  <TableHeaderCell minWidth="80px">
                    Category
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sortDirection={getSortDirection('basePrice')}
                    onSort={() => handleSort('basePrice')}
                    minWidth="80px"
                  >
                    Price
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sortDirection={getSortDirection('costOfGoods')}
                    onSort={() => handleSort('costOfGoods')}
                    minWidth="70px"
                  >
                    Cost
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sortDirection={getSortDirection('margin')}
                    onSort={() => handleSort('margin')}
                    minWidth="80px"
                  >
                    Margin
                  </TableHeaderCell>
                  <TableHeaderCell minWidth="80px">
                    Status
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sortDirection={getSortDirection('popularityScore')}
                    onSort={() => handleSort('popularityScore')}
                    minWidth="100px"
                  >
                    Popularity
                  </TableHeaderCell>
                  <TableHeaderCell minWidth="100px">
                    Actions
                  </TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                <For each={sortedProducts()}>
                  {(product) => (
                    <TableRow>
                      <TableCell class={styles.cellWrap}>
                        <div>
                          <div class={styles.productName}>{product.name}</div>
                          <Show when={product.description}>
                            <div class={styles.productDescription}>
                              {product.description}
                            </div>
                          </Show>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge color={getCategoryBadgeColor(product.category)}>
                          {formatCategoryName(product.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span class={styles.priceText}>{formatPrice(product.basePrice)}</span>
                      </TableCell>
                      <TableCell>
                        <span class={styles.costText}>
                          <Show when={product.costOfGoods} fallback="—">
                            {formatPrice(product.costOfGoods!)}
                          </Show>
                        </span>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Badge variant={getProductStatusVariant(product.status)}>
                          {formatStatusName(product.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div class={styles.popularityContainer}>
                          <span>⭐</span>
                          <span>{product.popularityScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div class={styles.actionsRow}>
                          <Button variant="text" size="sm" onClick={() => handleEdit(product)}>
                            Edit
                          </Button>
                          <Button variant="text" size="sm" onClick={() => handleDeleteClick(product)} class={styles.deleteLink}>
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </Show>
        </TableContainer>
      </Show>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        product={selectedProduct()}
        mode={modalMode()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm()}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete()?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardPageLayout>
  );
};

export default ProductsPage;
