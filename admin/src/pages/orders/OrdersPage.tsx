import { Component, createSignal, createResource, For, Show } from "solid-js";
import { ordersApi } from "../../api/client";

interface Order {
  id: string;
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
}

const OrdersPage: Component = () => {
  const [orders] = createResource<Order[]>(() => ordersApi.getOrders());
  const [selectedStatus, setSelectedStatus] = createSignal<string>('all');

  const filteredOrders = () => {
    const allOrders = orders() || [];
    if (selectedStatus() === 'all') return allOrders;
    return allOrders.filter(order => order.status === selectedStatus());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
        <p class="text-gray-600">Manage and track customer orders</p>
      </div>

      {/* Filter Controls */}
      <div class="mb-6 bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={selectedStatus()}
              onChange={(e) => setSelectedStatus(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
              New Order
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <Show
        when={!orders.loading}
        fallback={
          <div class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        }
      >
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <Show
            when={filteredOrders().length > 0}
            fallback={
              <div class="p-6 text-center text-gray-500">
                No orders found for the selected criteria.
              </div>
            }
          >
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <For each={filteredOrders()}>
                    {(order) => (
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customerName}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">
                          <div class="max-w-xs">
                            <For each={order.items.slice(0, 2)}>
                              {(item) => (
                                <div class="truncate">
                                  {item.quantity}x {item.productName}
                                </div>
                              )}
                            </For>
                            <Show when={order.items.length > 2}>
                              <div class="text-xs text-gray-500">
                                +{order.items.length - 2} more items
                              </div>
                            </Show>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div class="flex space-x-2">
                            <button class="text-primary-600 hover:text-primary-900">View</button>
                            <button class="text-primary-600 hover:text-primary-900">Edit</button>
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
    </div>
  );
};

export default OrdersPage;