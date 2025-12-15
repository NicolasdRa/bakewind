import { Component, createSignal, onMount, For, Show } from "solid-js";
import { customerOrdersApi, CustomerOrder, CustomerOrderStatus, OrderSource } from "~/api/orders";
import { productionApi } from "~/api/production";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import { useInfoModal } from "~/stores/infoModalStore";

const CustomerOrdersPage: Component = () => {
  const { showError } = useInfoModal();
  const [orders, setOrders] = createSignal<CustomerOrder[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal<CustomerOrderStatus | "all">("all");

  // Stats
  const [totalOrders, setTotalOrders] = createSignal(0);
  const [pendingOrders, setPendingOrders] = createSignal(0);
  const [completedOrders, setCompletedOrders] = createSignal(0);
  const [totalRevenue, setTotalRevenue] = createSignal("0");

  // Delete confirmation
  const [orderToDelete, setOrderToDelete] = createSignal<CustomerOrder | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  // Schedule production
  const [orderToSchedule, setOrderToSchedule] = createSignal<CustomerOrder | undefined>();
  const [showScheduleModal, setShowScheduleModal] = createSignal(false);
  const [scheduledDate, setScheduledDate] = createSignal("");

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await customerOrdersApi.getAllOrders({
        status: statusFilter() !== 'all' ? statusFilter() as CustomerOrderStatus : undefined,
        search: searchQuery() || undefined,
      });
      setOrders(data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      showError('Error', error?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const stats = await customerOrdersApi.getOrderStats();
      setTotalOrders(stats.totalOrders);
      setPendingOrders(stats.pendingOrders);
      setCompletedOrders(stats.completedOrders);
      setTotalRevenue(stats.totalRevenue);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  onMount(() => {
    fetchOrders();
    fetchStats();
  });

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchOrders();
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setStatusFilter(value as CustomerOrderStatus | "all");
    fetchOrders();
  };

  // Delete handlers
  const handleDeleteClick = (order: CustomerOrder) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const order = orderToDelete();
    if (!order) return;

    try {
      setLoading(true);
      await customerOrdersApi.deleteOrder(order.id);
      setShowDeleteConfirm(false);
      setOrderToDelete(undefined);
      await fetchOrders();
      await fetchStats();
    } catch (error: any) {
      console.error('Error deleting order:', error);
      const message = error.message || 'Failed to delete order';
      setShowDeleteConfirm(false);
      setOrderToDelete(undefined);
      showError('Cannot Delete Order', message);
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setOrderToDelete(undefined);
  };

  // Schedule production handlers
  const handleScheduleClick = (order: CustomerOrder) => {
    setOrderToSchedule(order);
    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async () => {
    const order = orderToSchedule();
    if (!order || !scheduledDate()) return;

    try {
      setLoading(true);
      await productionApi.createScheduleFromCustomerOrder(order.id, scheduledDate());
      setShowScheduleModal(false);
      setOrderToSchedule(undefined);
      setScheduledDate("");
      await fetchOrders();
      await fetchStats();
    } catch (error: any) {
      console.error('Error scheduling production:', error);
      const message = error.message || 'Failed to schedule production';
      setShowScheduleModal(false);
      setOrderToSchedule(undefined);
      showError('Cannot Schedule Production', message);
      setLoading(false);
    }
  };

  const handleCancelSchedule = () => {
    setShowScheduleModal(false);
    setOrderToSchedule(undefined);
    setScheduledDate("");
  };

  // Get status badge color
  const getStatusColor = (status: CustomerOrderStatus): string => {
    const colors: Record<CustomerOrderStatus, string> = {
      draft: '#666',
      pending: '#FFA500',
      confirmed: '#4169E1',
      ready: '#32CD32',
      delivered: '#228B22',
      cancelled: '#DC143C',
    };
    return colors[status] || '#666';
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: '#FFA500',
      paid: '#228B22',
      partial: '#4169E1',
      refunded: '#DC143C',
    };
    return colors[status] || '#666';
  };

  // Format currency
  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ "margin-bottom": "2rem" }}>
        <h1
          style={{
            "font-size": "2rem",
            "font-weight": "600",
            color: "var(--text-primary)",
            "margin-bottom": "0.5rem",
          }}
        >
          Customer Orders
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Manage and track customer orders
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          "grid-template-columns": "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          "margin-bottom": "2rem",
        }}
      >
        <StatsCard
          title="Total Orders"
          value={totalOrders().toString()}
          icon="📦"
        />
        <StatsCard
          title="Pending Orders"
          value={pendingOrders().toString()}
          icon="⏳"
        />
        <StatsCard
          title="Completed"
          value={completedOrders().toString()}
          icon="✅"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue())}
          icon="💰"
        />
      </div>

      {/* Filters and Search */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          "margin-bottom": "1.5rem",
          "flex-wrap": "wrap",
        }}
      >
        <div style={{ flex: "1", "min-width": "250px" }}>
          <SearchInput
            value={searchQuery()}
            onInput={handleSearch}
            placeholder="Search by order number, customer..."
          />
        </div>
        <FilterSelect
          value={statusFilter()}
          onChange={handleFilterChange}
          options={[
            { value: "all", label: "All Status" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "in_production", label: "In Production" },
            { value: "ready", label: "Ready" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </div>

      {/* Orders Table */}
      <div
        style={{
          "background-color": "var(--bg-secondary)",
          "border-radius": "8px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
        }}
      >
        <Show
          when={!loading()}
          fallback={
            <div style={{ padding: "3rem", "text-align": "center" }}>
              <p style={{ color: "var(--text-secondary)" }}>Loading orders...</p>
            </div>
          }
        >
          <Show
            when={orders().length > 0}
            fallback={
              <div style={{ padding: "3rem", "text-align": "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>
                  No orders found. Create your first order!
                </p>
              </div>
            }
          >
            <table style={{ width: "100%", "border-collapse": "collapse" }}>
              <thead>
                <tr style={{ "background-color": "var(--bg-primary)" }}>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "left",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Order #
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "left",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Customer
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "left",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Source
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "left",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Items
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "right",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Total
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "center",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "center",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Payment
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "left",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      "text-align": "center",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={orders()}>
                  {(order) => (
                    <tr
                      style={{
                        "border-bottom": "1px solid var(--border-color)",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--bg-primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "1rem",
                          color: "var(--text-primary)",
                          "font-weight": "500",
                        }}
                      >
                        {order.orderNumber}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ color: "var(--text-primary)" }}>
                          {order.customerName}
                        </div>
                        <Show when={order.customerEmail}>
                          <div
                            style={{
                              color: "var(--text-secondary)",
                              "font-size": "0.875rem",
                            }}
                          >
                            {order.customerEmail}
                          </div>
                        </Show>
                      </td>
                      <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                        {order.source.replace('_', ' ').toUpperCase()}
                      </td>
                      <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          "text-align": "right",
                          color: "var(--text-primary)",
                          "font-weight": "500",
                        }}
                      >
                        {formatCurrency(order.total)}
                      </td>
                      <td style={{ padding: "1rem", "text-align": "center" }}>
                        <Badge
                          label={order.status.replace('_', ' ')}
                          color={getStatusColor(order.status)}
                        />
                      </td>
                      <td style={{ padding: "1rem", "text-align": "center" }}>
                        <Badge
                          label={order.paymentStatus}
                          color={getPaymentStatusColor(order.paymentStatus)}
                        />
                      </td>
                      <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td style={{ padding: "1rem", "text-align": "center" }}>
                        <div style={{ display: "flex", gap: "0.5rem", "justify-content": "center" }}>
                          <button
                            onClick={() => handleScheduleClick(order)}
                            style={{
                              padding: "0.5rem 1rem",
                              "background-color": "var(--primary-color)",
                              color: "white",
                              border: "none",
                              "border-radius": "4px",
                              cursor: "pointer",
                              "font-size": "0.875rem",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.opacity = "0.8")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.opacity = "1")
                            }
                          >
                            Schedule
                          </button>
                          <button
                            onClick={() => handleDeleteClick(order)}
                            style={{
                              padding: "0.5rem 1rem",
                              "background-color": "var(--error-color)",
                              color: "white",
                              border: "none",
                              "border-radius": "4px",
                              cursor: "pointer",
                              "font-size": "0.875rem",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "var(--error-hover)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "var(--error-color)")
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </Show>
      </div>

      {/* Schedule Production Modal */}
      <Show when={showScheduleModal()}>
        <div
          style={{
            "position": "fixed",
            "top": "0",
            "left": "0",
            "right": "0",
            "bottom": "0",
            "z-index": "9999",
            "display": "flex",
            "align-items": "center",
            "justify-content": "center",
            "padding": "1rem",
            "background-color": "var(--overlay-bg)",
            "overflow-y": "auto"
          }}
          onClick={handleCancelSchedule}
        >
          <div
            style={{
              "background-color": "var(--bg-primary)",
              "border": "1px solid var(--border-color)",
              "border-radius": "0.5rem",
              "box-shadow": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              "width": "100%",
              "max-width": "28rem",
              "padding": "1.5rem",
              "margin": "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary)">
              Schedule Production
            </h3>
            <p class="mb-4" style="color: var(--text-secondary)">
              Schedule production for order "{orderToSchedule()?.orderNumber}"
            </p>
            <div class="mb-6">
              <label class="block mb-2" style="color: var(--text-primary); font-weight: 500;">
                Scheduled Date
              </label>
              <input
                type="date"
                value={scheduledDate()}
                onInput={(e) => setScheduledDate(e.currentTarget.value)}
                style={{
                  "width": "100%",
                  "padding": "0.5rem",
                  "border": "1px solid var(--border-color)",
                  "border-radius": "4px",
                  "background-color": "var(--bg-secondary)",
                  "color": "var(--text-primary)"
                }}
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button
                onClick={handleCancelSchedule}
                class="px-4 py-2 rounded-md font-medium transition-colors"
                style={{
                  "background-color": "transparent",
                  "border": "1px solid var(--border-color)",
                  "color": "var(--text-primary)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                class="px-4 py-2 rounded-md font-medium transition-colors"
                style={{
                  "background-color": "var(--primary-color)",
                  "color": "white"
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                Schedule Production
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteConfirm()}>
        <div
          style={{
            "position": "fixed",
            "top": "0",
            "left": "0",
            "right": "0",
            "bottom": "0",
            "z-index": "9999",
            "display": "flex",
            "align-items": "center",
            "justify-content": "center",
            "padding": "1rem",
            "background-color": "var(--overlay-bg)",
            "overflow-y": "auto"
          }}
          onClick={handleCancelDelete}
        >
          <div
            style={{
              "background-color": "var(--bg-primary)",
              "border": "1px solid var(--border-color)",
              "border-radius": "0.5rem",
              "box-shadow": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              "width": "100%",
              "max-width": "28rem",
              "padding": "1.5rem",
              "margin": "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary)">
              Delete Order
            </h3>
            <p class="mb-6" style="color: var(--text-secondary)">
              Are you sure you want to delete order "{orderToDelete()?.orderNumber}"? This action cannot be undone.
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
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
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

export default CustomerOrdersPage;
