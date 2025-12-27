import { Component, createSignal, createResource, For, Show } from "solid-js";
import { inventoryApi, InventoryItemWithTracking } from "~/api/inventory";
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
import styles from "./InventoryPage.module.css";

type SortField = 'name' | 'current_stock' | 'avg_daily_consumption' | 'days_of_supply_remaining';
type SortDirection = 'asc' | 'desc';

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
  const [inventory, { refetch }] = createResource(
    () => ({
      lowStockOnly: showLowStock(),
      category: selectedCategory() !== 'all' ? selectedCategory() : undefined,
    }),
    async (filters) => {
      return inventoryApi.getInventory(filters.lowStockOnly, filters.category);
    }
  );

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
    } catch (error: any) {
      console.error('Failed to delete inventory item:', error);
      const message = error?.message || 'Failed to delete inventory item. Please try again.';
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
    <div class={styles.pageContainer}>
      <div class={styles.pageHeader}>
        <div>
          <h1 class={styles.pageTitle}>Inventory Management</h1>
          <p class={styles.pageSubtitle}>Track ingredients, packaging, and supplies</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
          <PlusIcon class={styles.buttonIcon} />
          <span class="btn-text">Add Item</span>
        </Button>
      </div>

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
        fallback={
          <div class={styles.loadingContainer}>
            <div class={styles.spinner}></div>
          </div>
        }
      >
        <div class={styles.tableContainer}>
          <Show
            when={(inventory() || []).length > 0}
            fallback={
              <div class={styles.emptyState}>
                No inventory items found for the selected criteria.
              </div>
            }
          >
            <div class={styles.tableWrapper}>
              <table class={styles.table}>
                <thead class={styles.tableHead}>
                  <tr>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('name')}>
                      <div class={`${styles.headerContent} ${styles.minWidth140}`}>
                        <span>Item Name</span>
                        {SortIndicator('name')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth90}>Category</div>
                    </th>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('current_stock')}>
                      <div class={`${styles.headerContent} ${styles.minWidth120}`}>
                        <span>Current Stock</span>
                        {SortIndicator('current_stock')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('avg_daily_consumption')}>
                      <div class={`${styles.headerContent} ${styles.minWidth110}`}>
                        <span>Consumption</span>
                        {SortIndicator('avg_daily_consumption')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('days_of_supply_remaining')}>
                      <div class={`${styles.headerContent} ${styles.minWidth130}`}>
                        <span>Days Remaining</span>
                        {SortIndicator('days_of_supply_remaining')}
                      </div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth100}>Status</div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth100}>Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={sortedInventory()}>
                    {(item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr class={styles.tableRow}>
                          <td class={styles.tableCell}>
                            <div>
                              <div class={styles.itemName}>{item.name}</div>
                              <Show when={item.consumption_tracking?.has_custom_threshold}>
                                <div class={styles.customThreshold}>Custom Threshold</div>
                              </Show>
                            </div>
                          </td>
                          <td class={styles.tableCell}>
                            <span class={styles.categoryText}>
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                            </span>
                          </td>
                          <td class={styles.tableCell}>
                            <span class={styles.stockText}>
                              {item.current_stock.toFixed(2)} {item.unit}
                            </span>
                          </td>
                          <td class={styles.tableCell}>
                            <span class={styles.consumptionText}>
                              <Show when={item.consumption_tracking} fallback="-">
                                {item.consumption_tracking!.avg_daily_consumption.toFixed(2)} {item.unit}/day
                              </Show>
                            </span>
                          </td>
                          <td class={styles.tableCell}>
                            <span class={styles.consumptionText}>
                              <Show when={item.consumption_tracking} fallback="-">
                                {item.consumption_tracking!.days_of_supply_remaining.toFixed(1)} days
                              </Show>
                            </span>
                          </td>
                          <td class={styles.tableCell}>
                            <Badge variant={getStockStatusVariant(stockStatus)}>
                              {getStockStatusLabel(stockStatus)}
                            </Badge>
                          </td>
                          <td class={styles.tableCell}>
                            <div class={styles.actionsRow}>
                              <button onClick={() => setSelectedItemId(item.id)} class={styles.actionLink}>
                                Details
                              </button>
                              <button onClick={() => setEditItemId(item.id)} class={styles.actionLink}>
                                Edit
                              </button>
                              <button onClick={() => handleDeleteClick(item)} class={styles.deleteLink}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
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

      {/* Delete Confirmation Dialog */}
      <Show when={showDeleteConfirm()}>
        <div class={styles.modalBackdrop} onClick={handleCancelDelete}>
          <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 class={styles.modalTitle}>Delete Inventory Item</h3>
            <p class={styles.modalText}>
              Are you sure you want to delete "{itemToDelete()?.name}"? This action cannot be undone.
            </p>
            <div class={styles.modalActions}>
              <button onClick={handleCancelDelete} class={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} class={styles.deleteButton}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default InventoryPage;