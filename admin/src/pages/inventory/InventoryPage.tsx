import { Component, createSignal, createResource, For, Show } from "solid-js";
import { inventoryApi, InventoryItemWithTracking } from "~/api/inventory";
import AddInventoryItemModal from "~/components/inventory/AddInventoryItemModal";
import InventoryDetailsModal from "~/components/inventory/InventoryDetailsModal";
import EditInventoryItemModal from "~/components/inventory/EditInventoryItemModal";

const InventoryPage: Component = () => {
  const [selectedCategory, setSelectedCategory] = createSignal<string>('all');
  const [showLowStock, setShowLowStock] = createSignal(false);
  const [isAddModalOpen, setIsAddModalOpen] = createSignal(false);
  const [selectedItemId, setSelectedItemId] = createSignal<string | null>(null);
  const [editItemId, setEditItemId] = createSignal<string | null>(null);

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
    if (item.current_stock === 0) return { status: 'out', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' };
    if (item.low_stock) return { status: 'low', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' };
    return { status: 'good', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' };
  };

  const getLowStockCount = () => {
    return (inventory() || []).filter(item => item.low_stock).length;
  };

  return (
    <div class="p-6 md:p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Inventory Management</h1>
        <p class="text-base" style="color: var(--text-secondary)">Track ingredients, packaging, and supplies</p>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="rounded-xl p-6 border transition-all hover:shadow-md" style={{
          "background-color": "var(--bg-primary)",
          "border-color": "var(--border-color)",
          "box-shadow": "var(--shadow-card)"
        }}>
          <h3 class="text-lg font-semibold mb-2" style="color: var(--text-secondary)">Total Items</h3>
          <p class="text-4xl font-bold" style="color: var(--primary-color)">{inventory()?.length || 0}</p>
        </div>
        <div class="rounded-xl p-6 border transition-all hover:shadow-md" style={{
          "background-color": "var(--bg-primary)",
          "border-color": "var(--border-color)",
          "box-shadow": "var(--shadow-card)"
        }}>
          <h3 class="text-lg font-semibold mb-2" style="color: var(--text-secondary)">Low Stock Alerts</h3>
          <p class="text-4xl font-bold" style="color: var(--warning-color)">{getLowStockCount()}</p>
        </div>
        <div class="rounded-xl p-6 border transition-all hover:shadow-md" style={{
          "background-color": "var(--bg-primary)",
          "border-color": "var(--border-color)",
          "box-shadow": "var(--shadow-card)"
        }}>
          <h3 class="text-lg font-semibold mb-2" style="color: var(--text-secondary)">Items w/ Tracking</h3>
          <p class="text-4xl font-bold" style="color: var(--success-color)">
            {(inventory() || []).filter(item => item.consumption_tracking !== null).length}
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div class="mb-8 rounded-xl p-5 border" style={{
        "background-color": "var(--bg-primary)",
        "border-color": "var(--border-color)",
        "box-shadow": "var(--shadow-card)"
      }}>
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <label class="block text-sm font-medium mb-2" style="color: var(--text-secondary)">
              Filter by Category
            </label>
            <select
              value={selectedCategory()}
              onChange={(e) => setSelectedCategory(e.target.value)}
              class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
              style={{
                "background-color": "var(--bg-primary)",
                "border-color": "var(--border-color)",
                "color": "var(--text-primary)",
                "--tw-ring-color": "var(--primary-color)"
              }}
            >
              <option value="all">All Categories</option>
              <option value="ingredient">Ingredients</option>
              <option value="packaging">Packaging</option>
              <option value="supplies">Supplies</option>
            </select>
          </div>
          <div class="flex items-center space-x-4">
            <label class="flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-lg transition-all hover:shadow-sm" style={{
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
              <span class="text-sm font-medium select-none" style={{
                "color": showLowStock() ? "var(--primary-color)" : "var(--text-secondary)"
              }}>
                Show Low Stock Only
              </span>
            </label>
            <button
              onClick={() => setIsAddModalOpen(true)}
              class="px-5 py-2.5 rounded-lg font-medium transition-all hover:shadow-md focus:outline-none focus:ring-2"
              style={{
                "background-color": "var(--primary-color)",
                "color": "white",
                "--tw-ring-color": "var(--primary-color)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--primary-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--primary-color)"}
            >
              Add Item
            </button>
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
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      Item Name
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      Category
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      Current Stock
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      Consumption
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      Days Remaining
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      Status
                    </th>
                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={inventory() || []}>
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
                            <span class={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                              {stockStatus.status === 'out' ? 'Out of Stock' :
                               stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                            </span>
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
    </div>
  );
};

export default InventoryPage;