import { Component, createSignal, createResource, For, Show } from "solid-js";
import { inventoryApi } from "../../api/client";

interface InventoryItem {
  id: string;
  name: string;
  category: 'ingredients' | 'packaging' | 'supplies';
  currentStock: number;
  minimumStock: number;
  unit: string;
  costPerUnit: number;
  supplier?: string;
  lastRestocked?: string;
  expirationDate?: string;
}

const InventoryPage: Component = () => {
  const [inventory] = createResource<InventoryItem[]>(() => inventoryApi.getInventory());
  const [selectedCategory, setSelectedCategory] = createSignal<string>('all');
  const [showLowStock, setShowLowStock] = createSignal(false);

  const filteredInventory = () => {
    let items = inventory() || [];

    if (selectedCategory() !== 'all') {
      items = items.filter(item => item.category === selectedCategory());
    }

    if (showLowStock()) {
      items = items.filter(item => item.currentStock <= item.minimumStock);
    }

    return items;
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { status: 'out', color: 'bg-red-100 text-red-800' };
    if (item.currentStock <= item.minimumStock) return { status: 'low', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'good', color: 'bg-green-100 text-green-800' };
  };

  const getTotalValue = () => {
    return (inventory() || []).reduce((total, item) => total + (item.currentStock * item.costPerUnit), 0);
  };

  const getLowStockCount = () => {
    return (inventory() || []).filter(item => item.currentStock <= item.minimumStock).length;
  };

  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p class="text-gray-600">Track ingredients, packaging, and supplies</p>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Items</h3>
          <p class="text-3xl font-bold text-primary-600">{inventory()?.length || 0}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Low Stock Alerts</h3>
          <p class="text-3xl font-bold text-yellow-600">{getLowStockCount()}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Value</h3>
          <p class="text-3xl font-bold text-green-600">${getTotalValue().toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div class="mb-6 bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              value={selectedCategory()}
              onChange={(e) => setSelectedCategory(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              <option value="ingredients">Ingredients</option>
              <option value="packaging">Packaging</option>
              <option value="supplies">Supplies</option>
            </select>
          </div>
          <div class="flex items-center space-x-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                checked={showLowStock()}
                onChange={(e) => setShowLowStock(e.target.checked)}
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700">Show Low Stock Only</span>
            </label>
            <button class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <Show
        when={!inventory.loading}
        fallback={
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        }
      >
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <Show
            when={filteredInventory().length > 0}
            fallback={
              <div class="p-6 text-center text-gray-500">
                No inventory items found for the selected criteria.
              </div>
            }
          >
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Stock
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <For each={filteredInventory()}>
                    {(item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr class="hover:bg-gray-50">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div class="text-sm font-medium text-gray-900">{item.name}</div>
                              <Show when={item.supplier}>
                                <div class="text-xs text-gray-500">Supplier: {item.supplier}</div>
                              </Show>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.currentStock} {item.unit}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.minimumStock} {item.unit}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.costPerUnit.toFixed(2)} per {item.unit}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(item.currentStock * item.costPerUnit).toFixed(2)}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                              {stockStatus.status === 'out' ? 'Out of Stock' :
                               stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div class="flex space-x-2">
                              <button class="text-primary-600 hover:text-primary-900">Adjust</button>
                              <button class="text-primary-600 hover:text-primary-900">Edit</button>
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
    </div>
  );
};

export default InventoryPage;