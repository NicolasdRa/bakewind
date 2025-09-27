import { Title, Meta } from "@solidjs/meta";
import { createSignal, Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { AuthGuard } from "../../auth/AuthContext";
import "../../styles/globals.css";

// Order interface
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

interface Order {
  id: string;
  date: string;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  total: number;
  items: OrderItem[];
  deliveryType: "pickup" | "delivery";
  estimatedReady?: string;
  notes?: string;
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: "BW789123",
    date: "2024-01-20T10:30:00Z",
    status: "completed",
    total: 24.50,
    deliveryType: "pickup",
    items: [
      { id: "1", name: "Artisan Sourdough Bread", quantity: 1, price: 4.50, category: "Bread" },
      { id: "2", name: "Butter Croissants (6-pack)", quantity: 1, price: 12.00, category: "Pastries" },
      { id: "3", name: "Chocolate Chip Cookies (12-pack)", quantity: 2, price: 4.00, category: "Cookies" },
    ],
  },
  {
    id: "BW456789",
    date: "2024-01-18T14:15:00Z",
    status: "completed",
    total: 15.25,
    deliveryType: "delivery",
    items: [
      { id: "4", name: "Blueberry Muffins (4-pack)", quantity: 1, price: 8.00, category: "Muffins" },
      { id: "5", name: "Coffee Cake Slice", quantity: 1, price: 3.25, category: "Cakes" },
      { id: "6", name: "Fresh Bagels (6-pack)", quantity: 1, price: 4.00, category: "Bread" },
    ],
  },
  {
    id: "BW123456",
    date: "2024-01-15T09:00:00Z",
    status: "ready",
    total: 18.75,
    deliveryType: "pickup",
    estimatedReady: "Ready for pickup",
    items: [
      { id: "7", name: "Birthday Cake (Small)", quantity: 1, price: 18.75, category: "Cakes" },
    ],
  },
  {
    id: "BW987654",
    date: "2024-01-12T16:45:00Z",
    status: "preparing",
    total: 32.00,
    deliveryType: "pickup",
    estimatedReady: "Ready in 30 minutes",
    items: [
      { id: "8", name: "Wedding Cake (Medium)", quantity: 1, price: 32.00, category: "Cakes" },
    ],
    notes: "White frosting with red roses"
  },
  {
    id: "BW654321",
    date: "2024-01-10T11:20:00Z",
    status: "cancelled",
    total: 12.50,
    deliveryType: "delivery",
    items: [
      { id: "9", name: "Danish Pastries (6-pack)", quantity: 1, price: 12.50, category: "Pastries" },
    ],
  },
];

// Filter and sort options
const statusFilters = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount-high", label: "Amount: High to Low" },
  { value: "amount-low", label: "Amount: Low to High" },
];

// Status configuration
const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return { color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-200" };
    case "preparing":
      return { color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200" };
    case "ready":
      return { color: "text-green-700", bg: "bg-green-100", border: "border-green-200" };
    case "completed":
      return { color: "text-gray-700", bg: "bg-gray-100", border: "border-gray-200" };
    case "cancelled":
      return { color: "text-red-700", bg: "bg-red-100", border: "border-red-200" };
    default:
      return { color: "text-gray-700", bg: "bg-gray-100", border: "border-gray-200" };
  }
};

// Order Card Component
function OrderCard(props: { order: Order }) {
  const { order } = props;
  const statusConfig = getStatusConfig(order.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canReorder = order.status === "completed";
  const canCancel = order.status === "pending" || order.status === "preparing";

  return (
    <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Order Header */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
          <p class="text-sm text-gray-600">{formatDate(order.date)}</p>
        </div>
        <div class="mt-2 sm:mt-0 text-right">
          <span class={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <p class="text-xl font-bold text-gray-900 mt-1">
            ${order.total.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Delivery Info */}
      <div class="flex items-center space-x-4 mb-4 text-sm text-gray-600">
        <span class="flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d={order.deliveryType === "pickup" ? "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-2 4h2m-6 0h2" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
          </svg>
          {order.deliveryType === "pickup" ? "Store Pickup" : "Delivery"}
        </span>
        <Show when={order.estimatedReady}>
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {order.estimatedReady}
          </span>
        </Show>
      </div>

      {/* Order Items */}
      <div class="mb-4">
        <h4 class="font-medium text-gray-800 mb-2">Items ({order.items.length})</h4>
        <div class="space-y-2">
          <For each={order.items}>
            {(item) => (
              <div class="flex justify-between items-center text-sm">
                <div class="flex-1">
                  <span class="font-medium text-gray-900">{item.name}</span>
                  <span class="text-gray-600 ml-2">x{item.quantity}</span>
                </div>
                <span class="font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Order Notes */}
      <Show when={order.notes}>
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-800 mb-1">Special Instructions</h4>
          <p class="text-sm text-gray-600">{order.notes}</p>
        </div>
      </Show>

      {/* Actions */}
      <div class="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
        <A
          href={`/account/orders/${order.id}`}
          class="btn-outline text-center flex-1"
        >
          View Details
        </A>

        <Show when={canReorder}>
          <button class="btn-primary flex-1">
            Reorder
          </button>
        </Show>

        <Show when={canCancel}>
          <button class="btn bg-red-600 text-white hover:bg-red-700 flex-1">
            Cancel Order
          </button>
        </Show>

        <Show when={order.status === "ready"}>
          <button class="btn-primary flex-1">
            Mark as Picked Up
          </button>
        </Show>
      </div>
    </div>
  );
}

// Main Orders Page Component
export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = createSignal("all");
  const [sortBy, setSortBy] = createSignal("newest");

  // Filter and sort orders
  const filteredOrders = () => {
    let orders = [...mockOrders];

    // Apply status filter
    if (statusFilter() !== "all") {
      orders = orders.filter(order => order.status === statusFilter());
    }

    // Apply sorting
    orders.sort((a, b) => {
      switch (sortBy()) {
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-high":
          return b.total - a.total;
        case "amount-low":
          return a.total - b.total;
        case "newest":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return orders;
  };

  return (
    <AuthGuard redirectTo="/login">
      <Title>My Orders - BakeWind Bakery</Title>
      <Meta name="description" content="View and manage your BakeWind Bakery orders." />

      <main class="min-h-screen bg-bakery-cream">
        {/* Header */}
        <section class="bg-white border-b border-gray-200">
          <div class="max-w-content container-padding py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 class="text-3xl font-display font-bold text-bakery-brown mb-2">
                  My Orders
                </h1>
                <p class="text-gray-600">
                  Track your orders and reorder your favorites.
                </p>
              </div>
              <A href="/account" class="btn-outline mt-4 sm:mt-0">
                ← Back to Account
              </A>
            </div>
          </div>
        </section>

        {/* Filters and Sorting */}
        <section class="bg-white border-b border-gray-200">
          <div class="max-w-content container-padding py-4">
            <div class="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div class="flex flex-col sm:flex-row gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter()}
                    onChange={(e) => setStatusFilter(e.currentTarget.value)}
                    class="input-field w-full sm:w-auto"
                  >
                    <For each={statusFilters}>
                      {(option) => (
                        <option value={option.value}>{option.label}</option>
                      )}
                    </For>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Sort by
                  </label>
                  <select
                    value={sortBy()}
                    onChange={(e) => setSortBy(e.currentTarget.value)}
                    class="input-field w-full sm:w-auto"
                  >
                    <For each={sortOptions}>
                      {(option) => (
                        <option value={option.value}>{option.label}</option>
                      )}
                    </For>
                  </select>
                </div>
              </div>

              <div class="text-sm text-gray-600">
                Showing {filteredOrders().length} of {mockOrders.length} orders
              </div>
            </div>
          </div>
        </section>

        {/* Orders List */}
        <section class="section-padding">
          <div class="max-w-content container-padding">
            <Show
              when={filteredOrders().length > 0}
              fallback={
                <div class="text-center py-12">
                  <div class="text-6xl mb-4">📦</div>
                  <h3 class="text-xl font-semibold text-gray-700 mb-2">
                    No orders found
                  </h3>
                  <p class="text-gray-500 mb-6">
                    {statusFilter() === "all"
                      ? "You haven't placed any orders yet."
                      : `No orders with status "${statusFilter()}" found.`}
                  </p>
                  <A href="/products" class="btn-primary">
                    Start Shopping
                  </A>
                </div>
              }
            >
              <div class="space-y-6">
                <For each={filteredOrders()}>
                  {(order) => <OrderCard order={order} />}
                </For>
              </div>
            </Show>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}