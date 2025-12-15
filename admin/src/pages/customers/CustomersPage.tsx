import { Component, createSignal, createResource, For, Show } from "solid-js";
import { customersApi } from "../../api/customers";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  dateOfBirth?: string;
  allergens?: string[];
  preferences?: string[];
  orderHistory: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    lastOrderDate?: string;
  };
  loyalty: {
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  notes?: string;
}

const CustomersPage: Component = () => {
  const [customers] = createResource<Customer[]>(() => customersApi.getCustomers());
  const [selectedCustomer, setSelectedCustomer] = createSignal<Customer | null>(null);
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedStatus, setSelectedStatus] = createSignal<string>('all');
  const [selectedTier, setSelectedTier] = createSignal<string>('all');

  const filteredCustomers = () => {
    let filtered = customers() || [];

    if (searchTerm()) {
      const term = searchTerm().toLowerCase();
      filtered = filtered.filter(customer =>
        customer.firstName.toLowerCase().includes(term) ||
        customer.lastName.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      );
    }

    if (selectedStatus() !== 'all') {
      filtered = filtered.filter(customer => customer.status === selectedStatus());
    }

    if (selectedTier() !== 'all') {
      filtered = filtered.filter(customer => customer.loyalty.tier === selectedTier());
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalCustomers = () => customers()?.length || 0;
  const getActiveCustomers = () => customers()?.filter(c => c.status === 'active').length || 0;
  const getTotalRevenue = () => customers()?.reduce((sum, c) => sum + c.orderHistory.totalSpent, 0) || 0;
  const getAvgOrderValue = () => {
    const allCustomers = customers() || [];
    if (allCustomers.length === 0) return 0;
    const totalValue = allCustomers.reduce((sum, c) => sum + c.orderHistory.avgOrderValue, 0);
    return totalValue / allCustomers.length;
  };

  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
        <p class="text-gray-600">Manage customer information and relationships</p>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Customers</h3>
          <p class="text-3xl font-bold text-primary-600">{getTotalCustomers()}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Active Customers</h3>
          <p class="text-3xl font-bold text-green-600">{getActiveCustomers()}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          <p class="text-3xl font-bold text-blue-600">${getTotalRevenue().toFixed(2)}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Avg Order Value</h3>
          <p class="text-3xl font-bold text-yellow-600">${getAvgOrderValue().toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div class="mb-6 bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search Customers</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm()}
              onChange={(e) => setSearchTerm(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus()}
              onChange={(e) => setSelectedStatus(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Loyalty Tier</label>
            <select
              value={selectedTier()}
              onChange={(e) => setSelectedTier(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
              Add Customer
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">
                Customers ({filteredCustomers().length})
              </h2>
            </div>

            <Show
              when={!customers.loading}
              fallback={
                <div class="flex justify-center items-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              }
            >
              <Show
                when={filteredCustomers().length > 0}
                fallback={
                  <div class="p-6 text-center text-gray-500">
                    No customers found matching your criteria.
                  </div>
                }
              >
                <div class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  <For each={filteredCustomers()}>
                    {(customer) => (
                      <div
                        class="p-6 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                              <h3 class="text-lg font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </h3>
                              <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                              </span>
                              <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(customer.loyalty.tier)}`}>
                                {customer.loyalty.tier.charAt(0).toUpperCase() + customer.loyalty.tier.slice(1)}
                              </span>
                            </div>

                            <div class="text-sm text-gray-600 mb-2">
                              <p>{customer.email}</p>
                              <Show when={customer.phone}>
                                <p>{customer.phone}</p>
                              </Show>
                            </div>

                            <div class="grid grid-cols-3 gap-4 text-sm text-gray-600">
                              <div>
                                <span class="font-medium">Orders:</span> {customer.orderHistory.totalOrders}
                              </div>
                              <div>
                                <span class="font-medium">Spent:</span> ${customer.orderHistory.totalSpent.toFixed(2)}
                              </div>
                              <div>
                                <span class="font-medium">Points:</span> {customer.loyalty.points}
                              </div>
                            </div>
                          </div>

                          <div class="flex space-x-2 ml-4">
                            <button class="text-primary-600 hover:text-primary-900 text-sm">Edit</button>
                            <button class="text-gray-600 hover:text-gray-900 text-sm">Orders</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Show>
          </div>
        </div>

        {/* Customer Detail */}
        <div class="lg:col-span-1">
          <Show
            when={selectedCustomer()}
            fallback={
              <div class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Select a customer to view details
              </div>
            }
          >
            {(customer) => (
              <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h2 class="text-lg font-semibold text-gray-900">
                    {customer().firstName} {customer().lastName}
                  </h2>
                  <p class="text-sm text-gray-600">{customer().email}</p>
                </div>

                <div class="p-6 space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 class="text-md font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div class="space-y-2 text-sm">
                      <Show when={customer().phone}>
                        <div>
                          <span class="font-medium">Phone:</span> {customer().phone}
                        </div>
                      </Show>
                      <Show when={customer().address}>
                        <div>
                          <span class="font-medium">Address:</span>
                          <div class="ml-4 text-gray-600">
                            {customer().address!.street}<br/>
                            {customer().address!.city}, {customer().address!.state} {customer().address!.zipCode}
                          </div>
                        </div>
                      </Show>
                    </div>
                  </div>

                  {/* Order History */}
                  <div>
                    <h3 class="text-md font-semibold text-gray-900 mb-3">Order History</h3>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span class="font-medium">Total Orders:</span>
                        <div class="text-lg font-bold text-primary-600">{customer().orderHistory.totalOrders}</div>
                      </div>
                      <div>
                        <span class="font-medium">Total Spent:</span>
                        <div class="text-lg font-bold text-green-600">${customer().orderHistory.totalSpent.toFixed(2)}</div>
                      </div>
                      <div>
                        <span class="font-medium">Avg Order:</span>
                        <div class="text-lg font-bold text-blue-600">${customer().orderHistory.avgOrderValue.toFixed(2)}</div>
                      </div>
                      <div>
                        <span class="font-medium">Last Order:</span>
                        <div class="text-sm text-gray-600">
                          {customer().orderHistory.lastOrderDate ?
                            new Date(customer().orderHistory.lastOrderDate!).toLocaleDateString() :
                            'Never'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loyalty Information */}
                  <div>
                    <h3 class="text-md font-semibold text-gray-900 mb-3">Loyalty Program</h3>
                    <div class="space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium">Tier:</span>
                        <span class={`px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(customer().loyalty.tier)}`}>
                          {customer().loyalty.tier.charAt(0).toUpperCase() + customer().loyalty.tier.slice(1)}
                        </span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-medium">Points:</span>
                        <span class="text-lg font-bold text-yellow-600">{customer().loyalty.points}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dietary Information */}
                  <Show when={customer().allergens && customer().allergens!.length > 0}>
                    <div>
                      <h3 class="text-md font-semibold text-gray-900 mb-3">Allergens</h3>
                      <div class="flex flex-wrap gap-1">
                        <For each={customer().allergens}>
                          {(allergen) => (
                            <span class="inline-flex px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                              {allergen}
                            </span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  <Show when={customer().preferences && customer().preferences!.length > 0}>
                    <div>
                      <h3 class="text-md font-semibold text-gray-900 mb-3">Preferences</h3>
                      <div class="flex flex-wrap gap-1">
                        <For each={customer().preferences}>
                          {(preference) => (
                            <span class="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              {preference}
                            </span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  <Show when={customer().notes}>
                    <div>
                      <h3 class="text-md font-semibold text-gray-900 mb-3">Notes</h3>
                      <p class="text-sm text-gray-600">{customer().notes}</p>
                    </div>
                  </Show>

                  <div class="flex space-x-2">
                    <button class="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
                      View Orders
                    </button>
                    <button class="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;