import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import { inventoryApi, InventoryItemWithTracking } from '../api/inventory';

const Inventory: Component = () => {
  const [items, setItems] = createSignal<InventoryItemWithTracking[]>([]);
  const [filteredItems, setFilteredItems] = createSignal<InventoryItemWithTracking[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = createSignal(false);
  const [categoryFilter, setCategoryFilter] = createSignal<string>('all');
  const [selectedItem, setSelectedItem] = createSignal<InventoryItemWithTracking | null>(null);
  const [thresholdModalOpen, setThresholdModalOpen] = createSignal(false);
  const [customThreshold, setCustomThreshold] = createSignal<string>('');

  // Fetch inventory on mount and when filters change
  createEffect(() => {
    fetchInventory();
  });

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);

    try {
      const category = categoryFilter() !== 'all' ? categoryFilter() : undefined;
      const data = await inventoryApi.getInventory(lowStockOnly(), category);
      setItems(data);
      setFilteredItems(data);
    } catch (err) {
      setError('Failed to load inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetThreshold = (item: InventoryItemWithTracking) => {
    setSelectedItem(item);
    setCustomThreshold(
      item.consumption_tracking?.has_custom_threshold
        ? String(item.consumption_tracking.avg_daily_consumption)
        : '',
    );
    setThresholdModalOpen(true);
  };

  const handleSaveThreshold = async () => {
    if (!selectedItem()) return;

    const threshold = parseFloat(customThreshold());
    if (isNaN(threshold) || threshold < 0) {
      alert('Please enter a valid threshold value');
      return;
    }

    try {
      await inventoryApi.setCustomThreshold(selectedItem()!.id, {
        custom_reorder_threshold: threshold,
      });

      // Refresh inventory
      await fetchInventory();
      setThresholdModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      alert('Failed to set custom threshold');
      console.error(err);
    }
  };

  const handleRemoveThreshold = async (itemId: string) => {
    if (!confirm('Remove custom threshold and revert to predictive calculation?')) {
      return;
    }

    try {
      await inventoryApi.deleteCustomThreshold(itemId);
      await fetchInventory();
    } catch (err) {
      alert('Failed to remove custom threshold');
      console.error(err);
    }
  };

  const handleRecalculate = async (itemId: string) => {
    try {
      await inventoryApi.recalculate(itemId);
      await fetchInventory();
    } catch (err) {
      alert('Failed to recalculate consumption');
      console.error(err);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventory</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Track inventory levels with predictive low-stock alerts
        </p>
      </div>

      {/* Filters */}
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          {/* Low Stock Toggle */}
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly()}
              onChange={(e) => {
                setLowStockOnly(e.currentTarget.checked);
                fetchInventory();
              }}
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show low stock only
            </span>
          </label>

          {/* Category Filter */}
          <div class="w-full md:w-48">
            <select
              value={categoryFilter()}
              onChange={(e) => {
                setCategoryFilter(e.currentTarget.value);
                fetchInventory();
              }}
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="ingredient">Ingredients</option>
              <option value="packaging">Packaging</option>
              <option value="supplies">Supplies</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchInventory}
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      <Show when={error()}>
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p class="text-red-800 dark:text-red-400">{error()}</p>
        </div>
      </Show>

      {/* Inventory List */}
      <Show
        when={!loading()}
        fallback={
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        }
      >
        <Show
          when={filteredItems().length > 0}
          fallback={
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p class="text-gray-500 dark:text-gray-400">No inventory items found</p>
            </div>
          }
        >
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Item
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Consumption
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Days Left
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <For each={filteredItems()}>
                  {(item) => (
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {item.category}
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 dark:text-white">
                          {item.current_stock} {item.unit}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <Show
                          when={item.low_stock}
                          fallback={
                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              Good
                            </span>
                          }
                        >
                          <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            ⚠️ Low Stock
                          </span>
                        </Show>
                        <Show when={item.consumption_tracking?.has_custom_threshold}>
                          <span class="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            Custom
                          </span>
                        </Show>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <Show
                          when={item.consumption_tracking}
                          fallback={<span class="text-gray-400">N/A</span>}
                        >
                          {item.consumption_tracking!.avg_daily_consumption.toFixed(2)} / day
                        </Show>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <Show
                          when={item.consumption_tracking}
                          fallback={<span class="text-gray-400">N/A</span>}
                        >
                          {item.consumption_tracking!.days_of_supply_remaining.toFixed(1)} days
                        </Show>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleSetThreshold(item)}
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Set Threshold
                        </button>
                        <Show when={item.consumption_tracking?.has_custom_threshold}>
                          <button
                            onClick={() => handleRemoveThreshold(item.id)}
                            class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </Show>
                        <button
                          onClick={() => handleRecalculate(item.id)}
                          class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Recalculate
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>

      {/* Custom Threshold Modal */}
      <Show when={thresholdModalOpen()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Set Custom Threshold
            </h2>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Item: <strong>{selectedItem()?.name}</strong>
            </p>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reorder Threshold ({selectedItem()?.unit})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customThreshold()}
                onInput={(e) => setCustomThreshold(e.currentTarget.value)}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter threshold value"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Alert when stock falls below this value
              </p>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                onClick={() => setThresholdModalOpen(false)}
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveThreshold}
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Threshold
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Inventory;
