import { Component, createSignal, createResource, For, Show } from "solid-js";
import { inventoryApi, InventoryItemWithTracking } from "~/api/inventory";
import AddInventoryItemModal from "~/components/inventory/AddInventoryItemModal";
import InventoryDetailsModal from "~/components/inventory/InventoryDetailsModal";
import EditInventoryItemModal from "~/components/inventory/EditInventoryItemModal";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import { getStockStatusVariant } from "~/components/common/Badge.config";
import { useInfoModal } from "~/stores/infoModalStore";

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
          <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Inventory Management</h1>
          <p class="text-base" style="color: var(--text-secondary)">Track ingredients, packaging, and supplies</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          class="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
          style={{
            "background-color": "var(--primary-color)",
            "color": "white"
          }}
        >
          + Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
      <div class="mb-8 rounded-xl p-5 border" style={{
        "background-color": "var(--bg-primary)",
        "border-color": "var(--border-color)",
        "box-shadow": "var(--shadow-card)"
      }}>
        <div class="flex flex-wrap gap-4 items-end">
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
          <div class="flex-shrink-0 flex flex-col">
            <label class="block text-sm font-medium mb-2 opacity-0 pointer-events-none select-none" aria-hidden="true">
              &nbsp;
            </label>
            <label class="flex items-center gap-3 cursor-pointer px-4 rounded-lg transition-all hover:shadow-sm border" style={{
              "height": "42px",
              "background-color": showLowStock() ? "var(--primary-light)" : "transparent",
              "border": "1px solid",
              "border-color": showLowStock() ? "var(--primary-color)" : "var(--border-color)"
            }}>
              <div class="relative flex items-center">
                <input
                  type="checkbox"
                  checked={showLowStock()}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  class="w-5 h-5 rounded border-2 transition-all cursor-pointer focus:ring-2 focus:ring-offset-2 appearance-none checked:border-0"
                  style={{
                    "border-color": "var(--border-hover)",
                    "background-color": showLowStock() ? "var(--primary-color)" : "var(--bg-primary)",
                    "--tw-ring-color": "var(--primary-color)",
                    "background-image": showLowStock() ?
                      "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")" :
                      "none",
                    "background-size": "100% 100%",
                    "background-position": "center",
                    "background-repeat": "no-repeat"
                  }}
                />
              </div>
              <span class="text-sm font-medium select-none whitespace-nowrap" style={{
                "color": showLowStock() ? "var(--primary-color)" : "var(--text-secondary)"
              }}>
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
            when={(inventory() || []).length > 0}
            fallback={
              <div class="p-12 text-center" style="color: var(--text-secondary)">
                No inventory items found for the selected criteria.
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
                        <span>Item Name</span>
                        {SortIndicator('name')}
                      </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      <div class="min-w-[90px]">Category</div>
                    </th>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                      style={{
                        "color": "var(--text-secondary)",
                        "border-color": "var(--border-color)"
                      }}
                      onClick={() => handleSort('current_stock')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div class="flex items-center justify-between w-full min-w-[120px]">
                        <span>Current Stock</span>
                        {SortIndicator('current_stock')}
                      </div>
                    </th>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                      style={{
                        "color": "var(--text-secondary)",
                        "border-color": "var(--border-color)"
                      }}
                      onClick={() => handleSort('avg_daily_consumption')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div class="flex items-center justify-between w-full min-w-[110px]">
                        <span>Consumption</span>
                        {SortIndicator('avg_daily_consumption')}
                      </div>
                    </th>
                    <th
                      class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                      style={{
                        "color": "var(--text-secondary)",
                        "border-color": "var(--border-color)"
                      }}
                      onClick={() => handleSort('days_of_supply_remaining')}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <div class="flex items-center justify-between w-full min-w-[130px]">
                        <span>Days Remaining</span>
                        {SortIndicator('days_of_supply_remaining')}
                      </div>
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      <div class="min-w-[100px]">Status</div>
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
                  <For each={sortedInventory()}>
                    {(item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr class="transition-colors border-b" style={{
                          "border-color": "var(--border-light)"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div class="text-sm font-medium" style="color: var(--text-primary)">{item.name}</div>
                              <Show when={item.consumption_tracking?.has_custom_threshold}>
                                <div class="text-xs mt-0.5" style="color: var(--info-color)">Custom Threshold</div>
                              </Show>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--text-primary)">
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--text-primary)">
                            {item.current_stock.toFixed(2)} {item.unit}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--text-tertiary)">
                            <Show when={item.consumption_tracking} fallback="-">
                              {item.consumption_tracking!.avg_daily_consumption.toFixed(2)} {item.unit}/day
                            </Show>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--text-tertiary)">
                            <Show when={item.consumption_tracking} fallback="-">
                              {item.consumption_tracking!.days_of_supply_remaining.toFixed(1)} days
                            </Show>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStockStatusVariant(stockStatus)}>
                              {getStockStatusLabel(stockStatus)}
                            </Badge>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <div class="flex space-x-3">
                              <button
                                onClick={() => setSelectedItemId(item.id)}
                                class="font-medium transition-colors"
                                style={{
                                  "color": "var(--primary-color)"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "var(--primary-color)"}
                              >Details</button>
                              <button
                                onClick={() => setEditItemId(item.id)}
                                class="font-medium transition-colors"
                                style={{
                                  "color": "var(--primary-color)"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "var(--primary-color)"}
                              >Edit</button>
                              <button
                                onClick={() => handleDeleteClick(item)}
                                class="font-medium transition-colors"
                                style={{
                                  "color": "var(--error-color)"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "var(--error-hover)"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "var(--error-color)"}
                              >Delete</button>
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
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ "background-color": "var(--overlay-bg)" }}
          onClick={handleCancelDelete}
        >
          <div
            class="rounded-lg shadow-xl max-w-md w-full p-6"
            style={{
              "background-color": "var(--bg-primary)",
              "border": "1px solid var(--border-color)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary)">
              Delete Inventory Item
            </h3>
            <p class="mb-6" style="color: var(--text-secondary)">
              Are you sure you want to delete "{itemToDelete()?.name}"? This action cannot be undone.
            </p>
            <div class="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                class="px-4 py-2 rounded-md font-medium transition-colors"
                style={{
                  "background-color": "transparent",
                  "border": "1px solid var(--border-color)",
                  "color": "var(--text-primary)"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                class="px-4 py-2 rounded-md font-medium transition-colors"
                style={{
                  "background-color": "var(--error-color)",
                  "color": "white"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--error-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--error-color)"}
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

export default InventoryPage;