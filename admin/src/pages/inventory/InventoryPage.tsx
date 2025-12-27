import { Component, createSignal, createResource, For, Show } from "solid-js";
import { useTenantRefetch } from "~/hooks/useTenantRefetch";
import { inventoryApi, InventoryItemWithTracking } from "~/api/inventory";
import DashboardPageLayout from "~/layouts/DashboardPageLayout";
import AddInventoryItemModal from "~/components/inventory/AddInventoryItemModal";
import InventoryDetailsModal from "~/components/inventory/InventoryDetailsModal";
import EditInventoryItemModal from "~/components/inventory/EditInventoryItemModal";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import Button from "~/components/common/Button";
import { PlusIcon } from "~/components/icons";
import { getStockStatusVariant } from "~/components/common/Badge.config";
import { useInfoModal } from "~/stores/infoModalStore";
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
import styles from "./InventoryPage.module.css";

type SortField = 'name' | 'current_stock' | 'avg_daily_consumption' | 'days_of_supply_remaining';

const InventoryPage: Component = () => {
  const { showError } = useInfoModal();
  const [selectedCategory, setSelectedCategory] = createSignal<string>('all');
  const [showLowStock, setShowLowStock] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [isAddModalOpen, setIsAddModalOpen] = createSignal(false);
  const [selectedItemId, setSelectedItemId] = createSignal<string | null>(null);
  const [editItemId, setEditItemId] = createSignal<string | null>(null);
  const [itemToDelete, setItemToDelete] = createSignal<InventoryItemWithTracking | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  // Sorting state
  const [sortField, setSortField] = createSignal<SortField>('name');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');

  // Fetch inventory with real-time filtering
  const [inventory, { refetch, mutate }] = createResource(
    () => ({
      lowStockOnly: showLowStock(),
      category: selectedCategory() !== 'all' ? selectedCategory() : undefined,
    }),
    async (filters) => {
      return inventoryApi.getInventory(filters.lowStockOnly, filters.category);
    }
  );

  // Refetch when ADMIN user switches tenant, clear data when tenant is deselected
  useTenantRefetch(refetch, () => {
    mutate([]);
  });

  const getStockStatus = (item: InventoryItemWithTracking) => {
    if (item.current_stock === 0) return 'out';
    if (item.low_stock) return 'low';
    return 'good';
  };

  const getStockStatusLabel = (status: string) => {
    if (status === 'out') return 'Out of Stock';
    if (status === 'low') return 'Low Stock';
    return 'In Stock';
  };

  const getLowStockCount = () => {
    return (inventory() || []).filter(item => item.low_stock).length;
  };

  // Handle delete
  const handleDeleteClick = (item: InventoryItemWithTracking) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const item = itemToDelete();
    if (!item) return;

    try {
      await inventoryApi.deleteInventoryItem(item.id);
      setShowDeleteConfirm(false);
      setItemToDelete(undefined);
      await refetch();
    } catch (error: unknown) {
      console.error('Failed to delete inventory item:', error);
      const err = error as { message?: string };
      const message = err?.message || 'Failed to delete inventory item. Please try again.';
      setShowDeleteConfirm(false);
      setItemToDelete(undefined);
      showError('Cannot Delete Item', message);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(undefined);
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

  // Get filtered and sorted inventory
  const sortedInventory = () => {
    let inventoryList = inventory() || [];

    // Apply search filter
    const search = searchQuery().toLowerCase().trim();
    if (search) {
      inventoryList = inventoryList.filter(item =>
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
      );
    }

    const field = sortField();
    const direction = sortDirection();

    return [...inventoryList].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'current_stock':
          aValue = a.current_stock;
          bValue = b.current_stock;
          break;
        case 'avg_daily_consumption':
          aValue = a.consumption_tracking?.avg_daily_consumption ?? 0;
          bValue = b.consumption_tracking?.avg_daily_consumption ?? 0;
          break;
        case 'days_of_supply_remaining':
          aValue = a.consumption_tracking?.days_of_supply_remaining ?? 0;
          bValue = b.consumption_tracking?.days_of_supply_remaining ?? 0;
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
      title="Inventory Management"
      subtitle="Track ingredients, packaging, and supplies"
      actions={
        <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon class={styles.buttonIcon} />
          <span class="btn-text">Add Item</span>
        </Button>
      }
    >
      {/* Stats Cards */}
      <div class={styles.statsGrid}>
        <StatsCard
          title="Total Items"
          value={inventory()?.length || 0}
          valueColor="var(--primary-color)"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={getLowStockCount()}
          valueColor="var(--warning-color)"
        />
        <StatsCard
          title="Items w/ Tracking"
          value={(inventory() || []).filter(item => item.consumption_tracking !== null).length}
          valueColor="var(--success-color)"
        />
      </div>

      {/* Filter Controls */}
      <div class={styles.filterCard}>
        <div class={styles.filterRow}>
          <SearchInput
            value={searchQuery()}
            onInput={setSearchQuery}
            placeholder="Search by name or category..."
            label="Search Inventory"
          />
          <FilterSelect
            value={selectedCategory()}
            onChange={setSelectedCategory}
            label="Category"
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'ingredient', label: 'Ingredients' },
              { value: 'packaging', label: 'Packaging' },
              { value: 'supplies', label: 'Supplies' }
            ]}
          />
          <div class={styles.checkboxWrapper}>
            <label class={styles.hiddenLabel} aria-hidden="true">&nbsp;</label>
            <label
              classList={{
                [styles.checkboxLabel]: !showLowStock(),
                [styles.checkboxLabelActive]: showLowStock()
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={showLowStock()}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  class={styles.checkboxInput}
                />
              </div>
              <span
                classList={{
                  [styles.checkboxText]: !showLowStock(),
                  [styles.checkboxTextActive]: showLowStock()
                }}
              >
                Low Stock Only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <Show
        when={!inventory.loading}
        fallback={<TableLoadingState message="Loading inventory..." />}
      >
        <TableContainer>
          <Show
            when={sortedInventory().length > 0}
            fallback={
              <TableEmptyState message="No inventory items found for the selected criteria." />
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
                    Item Name
                  </TableHeaderCell>
                  <TableHeaderCell minWidth="90px">
                    Category
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sortDirection={getSortDirection('current_stock')}
                    onSort={() => handleSort('current_stock')}
                    minWidth="120px"
                  >
                    Current Stock
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sortDirection={getSortDirection('avg_daily_consumption')}
                    onSort={() => handleSort('avg_daily_consumption')}
                    minWidth="110px"
                  >
                    Consumption
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sortDirection={getSortDirection('days_of_supply_remaining')}
                    onSort={() => handleSort('days_of_supply_remaining')}
                    minWidth="130px"
                  >
                    Days Remaining
                  </TableHeaderCell>
                  <TableHeaderCell minWidth="100px">
                    Status
                  </TableHeaderCell>
                  <TableHeaderCell minWidth="100px">
                    Actions
                  </TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                <For each={sortedInventory()}>
                  {(item) => {
                    const stockStatus = getStockStatus(item);
                    return (
                      <TableRow>
                        <TableCell>
                          <div>
                            <div class={styles.itemName}>{item.name}</div>
                            <Show when={item.consumption_tracking?.has_custom_threshold}>
                              <div class={styles.customThreshold}>Custom Threshold</div>
                            </Show>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span class={styles.categoryText}>
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span class={styles.stockText}>
                            {item.current_stock.toFixed(2)} {item.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span class={styles.consumptionText}>
                            <Show when={item.consumption_tracking} fallback="-">
                              {item.consumption_tracking!.avg_daily_consumption.toFixed(2)} {item.unit}/day
                            </Show>
                          </span>
                        </TableCell>
                        <TableCell>
                          <span class={styles.consumptionText}>
                            <Show when={item.consumption_tracking} fallback="-">
                              {item.consumption_tracking!.days_of_supply_remaining.toFixed(1)} days
                            </Show>
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStockStatusVariant(stockStatus)}>
                            {getStockStatusLabel(stockStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div class={styles.actionsRow}>
                            <Button variant="text" size="sm" onClick={() => setSelectedItemId(item.id)}>
                              Details
                            </Button>
                            <Button variant="text" size="sm" onClick={() => setEditItemId(item.id)}>
                              Edit
                            </Button>
                            <Button variant="text" size="sm" onClick={() => handleDeleteClick(item)} class={styles.deleteLink}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }}
                </For>
              </TableBody>
            </Table>
          </Show>
        </TableContainer>
      </Show>

      {/* Add Item Modal */}
      <AddInventoryItemModal
        isOpen={isAddModalOpen()}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Details Modal */}
      <InventoryDetailsModal
        isOpen={selectedItemId() !== null}
        itemId={selectedItemId()}
        onClose={() => setSelectedItemId(null)}
      />

      {/* Edit Modal */}
      <EditInventoryItemModal
        isOpen={editItemId() !== null}
        itemId={editItemId()}
        onClose={() => setEditItemId(null)}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm()}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Inventory Item"
        message={`Are you sure you want to delete "${itemToDelete()?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardPageLayout>
  );
};

export default InventoryPage;
