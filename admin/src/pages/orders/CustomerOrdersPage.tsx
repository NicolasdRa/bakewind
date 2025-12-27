import { Component, createSignal, createEffect, onMount, For, Show } from "solid-js";
import { customerOrdersApi, CustomerOrder, CustomerOrderStatus } from "~/api/orders";
import { productionApi } from "~/api/production";
import DashboardPageLayout from "~/layouts/DashboardPageLayout";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import Button from "~/components/common/Button";
import DatePicker from "~/components/common/DatePicker";
import { Text } from "~/components/common/Typography";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "~/components/common/Modal/Modal";
import { ConfirmationModal } from "~/components/common/ConfirmationModal";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmptyState,
  TableLoadingState,
} from "~/components/common/Table";
import { useInfoModal } from "~/stores/infoModalStore";
import { getCurrentDateString, formatShortDate } from "~/utils/dateUtils";
import { getCustomerOrderStatusVariant, getPaymentStatusVariant } from "~/components/common/Badge.config";
import { CUSTOMER_ORDER_STATUS_OPTIONS } from "~/constants/orderFilters";
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
  const [isScheduling, setIsScheduling] = createSignal(false);

  // Debounce timer for search
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await customerOrdersApi.getAllOrders({
        status: statusFilter() !== 'all' ? statusFilter() as CustomerOrderStatus : undefined,
        search: searchQuery() || undefined,
      });
      setOrders(data);
    } catch (err: unknown) {
      console.error('Error fetching orders:', err);
      const error = err as { message?: string };
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
    } catch (err: unknown) {
      console.error('Error fetching stats:', err);
    }
  };

  onMount(() => {
    fetchOrders();
    fetchStats();
  });

  // Debounced search effect - tracks searchQuery and statusFilter for reactivity
  createEffect(() => {
    // Access reactive values to track them
    void searchQuery();
    void statusFilter();

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new debounce timer
    searchDebounceTimer = setTimeout(() => {
      fetchOrders();
    }, 300);
  });

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Fetch is handled by the debounced effect
  };

  // Handle filter change (immediate, no debounce)
  const handleFilterChange = (value: string) => {
    setStatusFilter(value as CustomerOrderStatus | "all");
    // Clear any pending search debounce and fetch immediately
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
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
    } catch (err: unknown) {
      console.error('Error deleting order:', err);
      const error = err as { message?: string };
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
      setIsScheduling(true);
      await productionApi.createScheduleFromCustomerOrder(order.id, scheduledDate());
      setShowScheduleModal(false);
      setOrderToSchedule(undefined);
      setScheduledDate("");
      await fetchOrders();
      await fetchStats();
    } catch (err: unknown) {
      console.error('Error scheduling production:', err);
      const error = err as { message?: string };
      const message = error.message || 'Failed to schedule production';
      setShowScheduleModal(false);
      setOrderToSchedule(undefined);
      showError('Cannot Schedule Production', message);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelSchedule = () => {
    if (!isScheduling()) {
      setShowScheduleModal(false);
      setOrderToSchedule(undefined);
      setScheduledDate("");
    }
  };

  // Format currency
  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <DashboardPageLayout
      title="Customer Orders"
      subtitle="Manage and track customer orders"
    >
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
          options={[...CUSTOMER_ORDER_STATUS_OPTIONS]}
        />
      </div>

      {/* Orders Table */}
      <Show
        when={!loading()}
        fallback={<TableLoadingState message="Loading orders..." />}
      >
        <TableContainer>
          <Show
            when={orders().length > 0}
            fallback={
              <TableEmptyState message="No orders found. Create your first order!" />
            }
          >
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Order #</TableHeaderCell>
                  <TableHeaderCell>Customer</TableHeaderCell>
                  <TableHeaderCell>Source</TableHeaderCell>
                  <TableHeaderCell>Items</TableHeaderCell>
                  <TableHeaderCell align="right">Total</TableHeaderCell>
                  <TableHeaderCell align="center">Status</TableHeaderCell>
                  <TableHeaderCell align="center">Payment</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell align="center">Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                <For each={orders()}>
                  {(order) => (
                    <TableRow>
                      <TableCell>
                        <span class={styles.orderNumber}>{order.orderNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div class={styles.customerName}>{order.customerName}</div>
                        <Show when={order.customerEmail}>
                          <div class={styles.customerEmail}>{order.customerEmail}</div>
                        </Show>
                      </TableCell>
                      <TableCell>
                        <span class={styles.sourceText}>
                          {order.source.replace('_', ' ').toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span class={styles.itemCount}>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell align="right">
                        <span class={styles.totalAmount}>{formatCurrency(order.total)}</span>
                      </TableCell>
                      <TableCell align="center">
                        <Badge variant={getCustomerOrderStatusVariant(order.status)}>
                          {formatStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell align="center">
                        <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                          {formatStatus(order.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span class={styles.dateText}>{formatShortDate(order.createdAt.split('T')[0])}</span>
                      </TableCell>
                      <TableCell align="center">
                        <div class={styles.actionsWrapper}>
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => handleScheduleClick(order)}
                          >
                            Schedule
                          </Button>
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => handleDeleteClick(order)}
                            class={styles.deleteButton}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </Show>
        </TableContainer>
      </Show>

      {/* Schedule Production Modal */}
      <Modal isOpen={showScheduleModal()} onClose={handleCancelSchedule} size="sm">
        <ModalHeader title="Schedule Production" onClose={handleCancelSchedule} />
        <ModalBody>
          <Text color="secondary" class={styles.modalText}>
            Schedule production for order "{orderToSchedule()?.orderNumber}"
          </Text>
          <div class={styles.formGroup}>
            <DatePicker
              label="Scheduled Date"
              value={scheduledDate()}
              onChange={(value) => setScheduledDate(value)}
              minDate={getCurrentDateString()}
              disabled={isScheduling()}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancelSchedule}
            disabled={isScheduling()}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmSchedule}
            loading={isScheduling()}
            disabled={isScheduling()}
          >
            Schedule Production
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm()}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Order"
        message={`Are you sure you want to delete order "${orderToDelete()?.orderNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardPageLayout>
  );
};

export default CustomerOrdersPage;
