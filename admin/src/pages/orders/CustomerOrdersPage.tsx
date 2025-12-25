
import { Component, createSignal, onMount, For, Show } from "solid-js";
import { customerOrdersApi, CustomerOrder, CustomerOrderStatus } from "~/api/orders";
import { productionApi } from "~/api/production";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import Button from "~/components/common/Button";
import DatePicker from "~/components/common/DatePicker";
import { useInfoModal } from "~/stores/infoModalStore";
import { getCurrentDateString } from "~/utils/dateUtils";
import styles from "./CustomerOrdersPage.module.css";

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
    <div class={styles.pageContainer}>
      {/* Header */}
      <div class={styles.pageHeader}>
        <h1 class={styles.pageTitle}>Customer Orders</h1>
        <p class={styles.pageSubtitle}>Manage and track customer orders</p>
      </div>

      {/* Stats Cards */}
      <div class={styles.statsGrid}>
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
      <div class={styles.filterSection}>
        <div class={styles.searchWrapper}>
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
      <div class={styles.tableContainer}>
        <Show
          when={!loading()}
          fallback={
            <div class={styles.loadingState}>
              <p>Loading orders...</p>
            </div>
          }
        >
          <Show
            when={orders().length > 0}
            fallback={
              <div class={styles.emptyState}>
                <p>No orders found. Create your first order!</p>
              </div>
            }
          >
            <table class={styles.table}>
              <thead class={styles.tableHead}>
                <tr>
                  <th class={styles.tableHeaderCell}>Order #</th>
                  <th class={styles.tableHeaderCell}>Customer</th>
                  <th class={styles.tableHeaderCell}>Source</th>
                  <th class={styles.tableHeaderCell}>Items</th>
                  <th class={styles.tableHeaderCellRight}>Total</th>
                  <th class={styles.tableHeaderCellCenter}>Status</th>
                  <th class={styles.tableHeaderCellCenter}>Payment</th>
                  <th class={styles.tableHeaderCell}>Date</th>
                  <th class={styles.tableHeaderCellCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={orders()}>
                  {(order) => (
                    <tr class={styles.tableRow}>
                      <td class={styles.tableCell}>
                        <span class={styles.orderNumber}>{order.orderNumber}</span>
                      </td>
                      <td class={styles.tableCell}>
                        <div class={styles.customerName}>{order.customerName}</div>
                        <Show when={order.customerEmail}>
                          <div class={styles.customerEmail}>{order.customerEmail}</div>
                        </Show>
                      </td>
                      <td class={styles.tableCell}>
                        <span class={styles.sourceText}>
                          {order.source.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td class={styles.tableCell}>
                        <span class={styles.itemCount}>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td class={styles.tableCellRight}>
                        <span class={styles.totalAmount}>{formatCurrency(order.total)}</span>
                      </td>
                      <td class={styles.tableCellCenter}>
                        <Badge
                          label={order.status.replace('_', ' ')}
                          color={getStatusColor(order.status)}
                        />
                      </td>
                      <td class={styles.tableCellCenter}>
                        <Badge
                          label={order.paymentStatus}
                          color={getPaymentStatusColor(order.paymentStatus)}
                        />
                      </td>
                      <td class={styles.tableCell}>
                        <span class={styles.dateText}>{formatDate(order.createdAt)}</span>
                      </td>
                      <td class={styles.tableCellCenter}>
                        <div class={styles.actionsWrapper}>
                          <button
                            onClick={() => handleScheduleClick(order)}
                            class={styles.scheduleButton}
                          >
                            Schedule
                          </button>
                          <button
                            onClick={() => handleDeleteClick(order)}
                            class={styles.deleteButtonSmall}
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
        <div class={styles.modalBackdrop} onClick={handleCancelSchedule}>
          <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 class={styles.modalTitle}>Schedule Production</h3>
            <p class={styles.modalText}>
              Schedule production for order "{orderToSchedule()?.orderNumber}"
            </p>
            <div class={styles.formGroup}>
              <DatePicker
                label="Scheduled Date"
                value={scheduledDate()}
                onChange={(value) => setScheduledDate(value)}
                minDate={getCurrentDateString()}
              />
            </div>
            <div class={styles.modalActions}>
              <Button variant="secondary" size="sm" onClick={handleCancelSchedule}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmSchedule}>
                Schedule Production
              </Button>
            </div>
          </div>
        </div>
      </Show>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteConfirm()}>
        <div class={styles.modalBackdrop} onClick={handleCancelDelete}>
          <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 class={styles.modalTitle}>Delete Order</h3>
            <p class={styles.modalTextLarge}>
              Are you sure you want to delete order "{orderToDelete()?.orderNumber}"? This action cannot be undone.
            </p>
            <div class={styles.modalActions}>
              <Button variant="secondary" size="sm" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default CustomerOrdersPage;
