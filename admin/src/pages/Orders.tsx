import { Component, createSignal, createEffect, For, Show } from 'solid-js';
import OrderCard from '../components/orders/OrderCard';
import { orderLocksStore } from '../stores/order-locks';

// Mock orders data - Replace with actual API call
interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
  total_price: number;
  order_date: string;
  delivery_date?: string;
}

const Orders: Component = () => {
  const [orders, setOrders] = createSignal<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = createSignal<Order[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [statusFilter, setStatusFilter] = createSignal<string>('all');
  const [loading, setLoading] = createSignal(true);
  const [selectedOrderId, setSelectedOrderId] = createSignal<string | null>(null);
  const [modalOpen, setModalOpen] = createSignal(false);

  // Fetch orders on mount
  createEffect(() => {
    fetchOrders();
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const data = await ordersApi.getOrders();

      // Mock data for demonstration
      const mockOrders: Order[] = [
        {
          id: '1',
          customer_name: 'John Doe',
          customer_phone: '(555) 123-4567',
          customer_email: 'john@example.com',
          status: 'pending',
          total_price: 125.50,
          order_date: '2025-01-15T10:30:00Z',
          delivery_date: '2025-01-20T14:00:00Z',
        },
        {
          id: '2',
          customer_name: 'Jane Smith',
          customer_phone: '(555) 987-6543',
          customer_email: 'jane@example.com',
          status: 'confirmed',
          total_price: 89.99,
          order_date: '2025-01-14T09:15:00Z',
          delivery_date: '2025-01-19T16:00:00Z',
        },
        {
          id: '3',
          customer_name: 'Bob Johnson',
          customer_phone: '(555) 456-7890',
          customer_email: 'bob@example.com',
          status: 'in_production',
          total_price: 245.00,
          order_date: '2025-01-13T14:45:00Z',
          delivery_date: '2025-01-18T10:00:00Z',
        },
      ];

      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search and status
  createEffect(() => {
    const query = searchQuery().toLowerCase();
    const status = statusFilter();

    let filtered = orders();

    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(query) ||
          order.customer_email.toLowerCase().includes(query) ||
          order.customer_phone.includes(query),
      );
    }

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter((order) => order.status === status);
    }

    setFilteredOrders(filtered);
  });

  const handleOrderClick = async (orderId: string) => {
    setSelectedOrderId(orderId);

    // Try to acquire lock
    const acquired = await orderLocksStore.acquireLock(orderId);

    if (acquired) {
      // Open modal to edit order
      setModalOpen(true);
    } else {
      // Show error - order is locked by another user
      alert(`This order is currently being edited by ${orderLocksStore.getLock(orderId)?.locked_by_user_name}`);
    }
  };

  const handleCloseModal = async () => {
    if (selectedOrderId()) {
      await orderLocksStore.releaseLock(selectedOrderId()!);
    }
    setModalOpen(false);
    setSelectedOrderId(null);
  };

  const getOrderLock = (orderId: string) => {
    return orderLocksStore.getLock(orderId);
  };

  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Orders</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage customer orders and track their status
        </p>
      </div>

      {/* Filters */}
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div class="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div class="w-full md:w-48">
            <select
              value={statusFilter()}
              onChange={(e) => setStatusFilter(e.currentTarget.value)}
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_production">In Production</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <Show
        when={!loading()}
        fallback={
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        }
      >
        <Show
          when={filteredOrders().length > 0}
          fallback={
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <p class="text-gray-500 dark:text-gray-400">No orders found</p>
            </div>
          }
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <For each={filteredOrders()}>
              {(order) => (
                <OrderCard
                  order={order}
                  isLocked={orderLocksStore.isLocked(order.id)}
                  lockedBy={getOrderLock(order.id)}
                  onClick={() => handleOrderClick(order.id)}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* Order Modal - Placeholder */}
      <Show when={modalOpen()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Order
              </h2>
              <button
                onClick={handleCloseModal}
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div class="mb-4">
              <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p class="text-green-800 dark:text-green-400">
                  🔒 You have acquired the lock on this order. Other users cannot edit it while you're working.
                </p>
              </div>
            </div>

            <div class="text-gray-600 dark:text-gray-400 mb-6">
              <p>Order ID: {selectedOrderId()}</p>
              <p class="text-sm mt-2">
                Order editing functionality will be implemented here. The lock will auto-renew every 30 seconds while this modal is open.
              </p>
            </div>

            <div class="flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Orders;
