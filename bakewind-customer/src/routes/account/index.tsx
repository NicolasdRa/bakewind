import { Title, Meta } from "@solidjs/meta";
import { createSignal, Show, For } from "solid-js";
import { A } from "@solidjs/router";
import { AuthGuard, useAuth } from "../../auth/AuthContext";
import "../../styles/globals.css";

// Mock user data - in real app this would come from authentication context
const mockUser = {
  id: "user_123",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "(555) 123-4567",
  joinDate: "2024-01-15",
  totalOrders: 12,
  favoriteCategory: "Pastries",
};

// Recent orders mock data
const mockRecentOrders = [
  {
    id: "BW789123",
    date: "2024-01-20",
    status: "completed",
    total: 24.50,
    items: [
      { name: "Sourdough Bread", quantity: 1, price: 4.50 },
      { name: "Croissants (6-pack)", quantity: 1, price: 12.00 },
      { name: "Chocolate Chip Cookies", quantity: 2, price: 4.00 },
    ],
  },
  {
    id: "BW456789",
    date: "2024-01-18",
    status: "completed",
    total: 15.25,
    items: [
      { name: "Blueberry Muffins (4-pack)", quantity: 1, price: 8.00 },
      { name: "Coffee Cake Slice", quantity: 1, price: 3.25 },
      { name: "Fresh Bagels (6-pack)", quantity: 1, price: 4.00 },
    ],
  },
  {
    id: "BW123456",
    date: "2024-01-15",
    status: "ready",
    total: 18.75,
    items: [
      { name: "Birthday Cake (Small)", quantity: 1, price: 18.75 },
    ],
  },
];

// Account statistics
const accountStats = [
  {
    label: "Total Orders",
    value: mockUser.totalOrders,
    icon: "📦",
  },
  {
    label: "Member Since",
    value: new Date(mockUser.joinDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    }),
    icon: "📅",
  },
  {
    label: "Favorite Category",
    value: mockUser.favoriteCategory,
    icon: "❤️",
  },
  {
    label: "Loyalty Points",
    value: "245",
    icon: "⭐",
  },
];

// Order status mapping
const getStatusInfo = (status: string) => {
  switch (status) {
    case "completed":
      return { color: "text-green-600", bg: "bg-green-100", label: "Completed" };
    case "ready":
      return { color: "text-blue-600", bg: "bg-blue-100", label: "Ready for Pickup" };
    case "preparing":
      return { color: "text-yellow-600", bg: "bg-yellow-100", label: "Preparing" };
    case "cancelled":
      return { color: "text-red-600", bg: "bg-red-100", label: "Cancelled" };
    default:
      return { color: "text-gray-600", bg: "bg-gray-100", label: "Unknown" };
  }
};

// Quick Actions Component
function QuickActions() {
  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-bakery-brown mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <A href="/products" class="btn-outline text-center">
          Browse Products
        </A>
        <A href="/account/orders" class="btn-outline text-center">
          View All Orders
        </A>
        <A href="/account/profile" class="btn-outline text-center">
          Edit Profile
        </A>
        <A href="/products?category=specials" class="btn-primary text-center">
          Today's Specials
        </A>
      </div>
    </div>
  );
}

// Recent Orders Component
function RecentOrdersSection() {
  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-bakery-brown">Recent Orders</h2>
        <A href="/account/orders" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All →
        </A>
      </div>

      <div class="space-y-4">
        <For each={mockRecentOrders.slice(0, 3)}>
          {(order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h3 class="font-semibold text-gray-900">Order #{order.id}</h3>
                    <p class="text-sm text-gray-500">
                      {new Date(order.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div class="text-right">
                    <span class={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <p class="text-lg font-semibold text-gray-900 mt-1">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div class="text-sm text-gray-600">
                  <p class="mb-1">Items: {order.items.length}</p>
                  <div class="flex flex-wrap gap-1">
                    <For each={order.items.slice(0, 2)}>
                      {(item) => (
                        <span class="inline-block bg-gray-100 px-2 py-1 rounded text-xs">
                          {item.name} x{item.quantity}
                        </span>
                      )}
                    </For>
                    <Show when={order.items.length > 2}>
                      <span class="inline-block bg-gray-100 px-2 py-1 rounded text-xs">
                        +{order.items.length - 2} more
                      </span>
                    </Show>
                  </div>
                </div>

                <div class="mt-3 flex justify-between items-center">
                  <A
                    href={`/account/orders/${order.id}`}
                    class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View Details
                  </A>
                  <Show when={order.status === "completed"}>
                    <button class="text-gray-600 hover:text-primary-600 text-sm">
                      Reorder
                    </button>
                  </Show>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

// Account Stats Component
function AccountStatsSection() {
  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold text-bakery-brown mb-4">Account Overview</h2>
      <div class="grid grid-cols-2 gap-4">
        <For each={accountStats}>
          {(stat) => (
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl mb-2">{stat.icon}</div>
              <div class="text-lg font-semibold text-gray-900">{stat.value}</div>
              <div class="text-sm text-gray-600">{stat.label}</div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

// Favorite Products Section
function FavoriteProductsSection() {
  const favoriteProducts = [
    { id: "1", name: "Sourdough Bread", price: 4.50, image: "/assets/products/sourdough-1.jpg" },
    { id: "2", name: "Butter Croissants", price: 12.00, image: "/assets/products/croissants-1.jpg" },
  ];

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-bakery-brown">Favorites</h2>
        <A href="/account/favorites" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All →
        </A>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <For each={favoriteProducts}>
          {(product) => (
            <div class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <img
                src={product.image}
                alt={product.name}
                class="w-12 h-12 object-cover rounded"
              />
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 truncate">{product.name}</h3>
                <p class="text-sm text-gray-600">${product.price.toFixed(2)}</p>
              </div>
              <A
                href={`/products/${product.id}`}
                class="text-primary-600 hover:text-primary-700 text-sm"
              >
                View
              </A>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

// Main Account Dashboard Component
export default function AccountDashboard() {
  const { user } = useAuth();

  return (
    <AuthGuard redirectTo="/login">
      <Title>My Account - BakeWind Bakery</Title>
      <Meta name="description" content="Manage your BakeWind Bakery account, view orders, and track your preferences." />

      <main class="min-h-screen bg-bakery-cream">
        {/* Header */}
        <section class="bg-white border-b border-gray-200">
          <div class="max-w-content container-padding py-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 class="text-3xl font-display font-bold text-bakery-brown mb-2">
                  Welcome back, {user()?.firstName || mockUser.firstName}!
                </h1>
                <p class="text-gray-600">
                  Manage your account, view orders, and discover new favorites.
                </p>
              </div>
              <div class="mt-4 sm:mt-0">
                <A href="/account/profile" class="btn-outline">
                  Edit Profile
                </A>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section class="section-padding">
          <div class="max-w-content container-padding">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div class="lg:col-span-2 space-y-8">
                <RecentOrdersSection />
                <FavoriteProductsSection />
              </div>

              {/* Right Column - Sidebar */}
              <div class="lg:col-span-1 space-y-8">
                <AccountStatsSection />
                <QuickActions />
              </div>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}