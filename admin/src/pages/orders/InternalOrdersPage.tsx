import { Component, createSignal, onMount, onCleanup, For, Show } from "solid-js";
import {
  internalOrdersApi,
  InternalOrder,
  InternalOrderStatus,
  CreateInternalOrderRequest,
  UpdateInternalOrderRequest
} from "~/api/internalOrders";
import { productionApi } from "~/api/production";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import Badge from "~/components/common/Badge";
import Button from "~/components/common/Button";
import DatePicker from "~/components/common/DatePicker";
import { useInfoModal } from "~/stores/infoModalStore";
import { orderLocksStore } from "~/stores/order-locks";
import { getCurrentDateString } from "~/utils/dateUtils";
import InternalOrderFormModal from "~/components/orders/InternalOrderFormModal";
import InternalOrderDetailsModal from "~/components/orders/InternalOrderDetailsModal";
import styles from "./InternalOrdersPage.module.css";

const InternalOrdersPage: Component = () => {
  const { showError, showSuccess } = useInfoModal();
  const [orders, setOrders] = createSignal<InternalOrder[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal<InternalOrderStatus | "all">("all");

  // Stats
  const [totalOrders, setTotalOrders] = createSignal(0);
  const [pendingOrders, setPendingOrders] = createSignal(0);
  const [completedOrders, setCompletedOrders] = createSignal(0);

  // Modals
  const [showFormModal, setShowFormModal] = createSignal(false);
  const [showDetailsModal, setShowDetailsModal] = createSignal(false);
  const [selectedOrder, setSelectedOrder] = createSignal<InternalOrder | undefined>();
  const [editMode, setEditMode] = createSignal(false);

  // Delete confirmation
  const [orderToDelete, setOrderToDelete] = createSignal<InternalOrder | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  // Schedule Production modal
  const [showScheduleModal, setShowScheduleModal] = createSignal(false);
  const [orderToSchedule, setOrderToSchedule] = createSignal<InternalOrder | undefined>();
  const [scheduledProductionDate, setScheduledProductionDate] = createSignal(getCurrentDateString());
  const [isScheduling, setIsScheduling] = createSignal(false);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await internalOrdersApi.getAllOrders({
        status: statusFilter() !== 'all' ? statusFilter() as InternalOrderStatus : undefined,
        search: searchQuery() || undefined,
      });
      setOrders(data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      showError('Error', error?.message || 'Failed to fetch internal orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const stats = await internalOrdersApi.getOrderStats();
      setTotalOrders(stats.totalOrders);
      setPendingOrders(stats.pendingOrders);
      setCompletedOrders(stats.completedOrders);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  onMount(() => {
    fetchOrders();
    fetchStats();
  });

  // Cleanup locks on unmount
  onCleanup(() => {
    orderLocksStore.cleanup();
  });

  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchOrders();
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setStatusFilter(value as InternalOrderStatus | "all");
    fetchOrders();
  };

  // Create order
  const handleCreateOrder = async (orderData: CreateInternalOrderRequest) => {
    try {
      await internalOrdersApi.createOrder(orderData);
      showSuccess('Success', 'Internal order created successfully');
      await fetchOrders();
      await fetchStats();
    } catch (error: any) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Update order
  const handleUpdateOrder = async (orderData: CreateInternalOrderRequest) => {
    const order = selectedOrder();
    if (!order) return;

    try {
      const updateData: UpdateInternalOrderRequest = {
        priority: orderData.priority,
        batchNumber: orderData.batchNumber,
        notes: orderData.notes,
        status: orderData.status,
        source: orderData.source,
        requestedBy: orderData.requestedBy,
        requestedByEmail: orderData.requestedByEmail,
        neededByDate: orderData.neededByDate,
        specialInstructions: orderData.specialInstructions,
      };

      await internalOrdersApi.updateOrder(order.id, updateData);

      // Release lock after successful update
      await orderLocksStore.releaseLock(order.id);

      // Close modals first
      setShowFormModal(false);
      setShowDetailsModal(false);
      setEditMode(false);
      setSelectedOrder(undefined);

      // Then refresh the data
      await fetchOrders();
      await fetchStats();

      showSuccess('Success', 'Internal order updated successfully');
    } catch (error: any) {
      console.error('Error updating order:', error);
      throw error;
    }
  };

  // Handle status change
  const handleStatusChange = async (order: InternalOrder, newStatus: InternalOrderStatus) => {
    // If advancing to scheduled, use the schedule production modal to ensure production schedule is created
    if (newStatus === 'scheduled') {
      setOrderToSchedule(order);
      setShowScheduleModal(true);
      setShowDetailsModal(false);
      return;
    }

    try {
      await internalOrdersApi.updateOrderStatus(order.id, newStatus);
      showSuccess('Success', `Order status updated to ${newStatus.replace('_', ' ')}`);
      await fetchOrders();
      await fetchStats();
      setShowDetailsModal(false);
    } catch (error: any) {
      console.error('Error updating status:', error);
      showError('Error', error?.message || 'Failed to update order status');
    }
  };

  // Delete handlers
  const handleDeleteClick = (order: InternalOrder) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
    setShowDetailsModal(false);
  };

  const handleConfirmDelete = async () => {
    const order = orderToDelete();
    if (!order) return;

    try {
      setLoading(true);
      await internalOrdersApi.deleteOrder(order.id);
      setShowDeleteConfirm(false);
      setOrderToDelete(undefined);
      showSuccess('Success', 'Internal order deleted successfully');
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

  // Schedule Production handlers
  const handleScheduleProductionClick = (order: InternalOrder) => {
    setOrderToSchedule(order);
    setScheduledProductionDate(order.productionDate?.split('T')[0] || getCurrentDateString());
    setShowScheduleModal(true);
    setShowDetailsModal(false);
  };

  const handleScheduleProduction = async () => {
    const order = orderToSchedule();
    if (!order) return;

    try {
      setIsScheduling(true);

      // Create the production schedule
      await productionApi.createScheduleFromInternalOrder(order.id, scheduledProductionDate());

      // Update order status to 'scheduled'
      await internalOrdersApi.updateOrderStatus(order.id, 'scheduled');

      showSuccess('Success', `Production scheduled for Order #${order.orderNumber}`);
      setShowScheduleModal(false);
      setOrderToSchedule(undefined);
      await fetchOrders();
      await fetchStats();
    } catch (error: any) {
      console.error('Error scheduling production:', error);

      // Provide helpful error messages
      let errorMessage = error?.message || 'Failed to schedule production';

      // Check for missing recipe error
      if (errorMessage.includes('does not have a recipe associated')) {
        const productMatch = errorMessage.match(/Product (.+?) does not have/);
        const productName = productMatch ? productMatch[1] : 'One or more products';
        errorMessage = `${productName} does not have a recipe associated. Please create a recipe for this product in the Recipes page before scheduling production.`;
      }

      showError('Cannot Schedule Production', errorMessage);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelSchedule = () => {
    if (!isScheduling()) {
      setShowScheduleModal(false);
      setOrderToSchedule(undefined);
    }
  };

  // View details
  const handleViewDetails = (order: InternalOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Edit order
  const handleEditOrder = async (order: InternalOrder) => {
    // Try to acquire lock
    const lockAcquired = await orderLocksStore.acquireLock(order.id, 'internal');

    if (!lockAcquired) {
      const lock = orderLocksStore.getLock(order.id);
      showError(
        'Order Locked',
        lock
          ? `This order is currently being edited by ${lock.locked_by_user_name}`
          : 'Failed to acquire lock on this order'
      );
      return;
    }

    setSelectedOrder(order);
    setEditMode(true);
    setShowFormModal(true);
    setShowDetailsModal(false);
  };

  // Create new order
  const handleCreateNew = () => {
    setSelectedOrder(undefined);
    setEditMode(false);
    setShowFormModal(true);
  };

  // Get status badge variant
  const getStatusVariant = (status: InternalOrderStatus) => {
    const variants: Record<InternalOrderStatus, { variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral', color?: string }> = {
      draft: { variant: 'neutral' },
      requested: { variant: 'warning' },
      approved: { variant: 'info' },
      scheduled: { color: 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400' },
      in_production: { color: 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400' },
      quality_check: { color: 'border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400' },
      ready: { variant: 'success' },
      completed: { variant: 'success' },
      delivered: { variant: 'success' },
      cancelled: { variant: 'error' },
    };
    return variants[status] || { variant: 'neutral' as const };
  };

  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    const variants: Record<string, { variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral', color?: string }> = {
      low: { variant: 'success' },
      normal: { variant: 'info' },
      high: { variant: 'warning' },
      rush: { variant: 'error' },
    };
    return variants[priority] || { variant: 'info' as const };
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div class={styles.pageContainer}>
      {/* Header */}
      <div class={styles.pageHeader}>
        <div>
          <h1 class={styles.pageTitle}>Internal Production Orders</h1>
          <p class={styles.pageSubtitle}>Track and manage internal production orders</p>
        </div>
        <Button variant="primary" size="md" onClick={handleCreateNew}>
          + Create Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div class={styles.statsGrid}>
        <StatsCard
          title="Total Orders"
          value={totalOrders()}
          valueColor="var(--primary-color)"
        />
        <StatsCard
          title="In Production"
          value={pendingOrders()}
          valueColor="var(--warning-color)"
        />
        <StatsCard
          title="Completed"
          value={completedOrders()}
          valueColor="var(--success-color)"
        />
      </div>

      {/* Filter Controls */}
      <div class={styles.filterCard}>
        <div class={styles.filterRow}>
          <SearchInput
            value={searchQuery()}
            onInput={handleSearch}
            placeholder="Search by order number, batch number..."
            label="Search Orders"
          />
          <FilterSelect
            value={statusFilter()}
            onChange={handleFilterChange}
            label="Status"
            options={[
              { value: "all", label: "All Status" },
              { value: "draft", label: "Draft" },
              { value: "requested", label: "Requested" },
              { value: "approved", label: "Approved" },
              { value: "scheduled", label: "Scheduled" },
              { value: "in_production", label: "In Production" },
              { value: "quality_check", label: "Quality Check" },
              { value: "ready", label: "Ready" },
              { value: "completed", label: "Completed" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>
      </div>

      {/* Orders Table */}
      <Show
        when={!loading()}
        fallback={
          <div class={styles.loadingContainer}>
            <div class={styles.spinner}></div>
          </div>
        }
      >
        <div class={styles.tableContainer}>
          <Show
            when={orders().length > 0}
            fallback={
              <div class={styles.emptyState}>
                No internal orders found. Create your first production order!
              </div>
            }
          >
            <div class={styles.tableWrapper}>
              <table class={styles.table}>
                <thead class={styles.tableHead}>
                  <tr>
                    <th class={styles.tableHeaderCellNarrow}>
                      {/* Lock icon */}
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth100}>Order #</div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth100}>Batch Number</div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth120}>Items</div>
                    </th>
                    <th class={styles.tableHeaderCellCenter}>
                      <div class={styles.minWidth80}>Priority</div>
                    </th>
                    <th class={styles.tableHeaderCellCenter}>
                      <div class={styles.minWidth100}>Status</div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth120}>Production Date</div>
                    </th>
                    <th class={styles.tableHeaderCell}>
                      <div class={styles.minWidth100}>Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={orders()}>
                    {(order) => (
                      <tr
                        class={styles.tableRow}
                        onClick={() => handleViewDetails(order)}
                      >
                        <td class={styles.lockCell}>
                          <Show when={orderLocksStore.isLocked(order.id)}>
                            <span
                              class={styles.lockIcon}
                              title={
                                orderLocksStore.isLockedByMe(order.id)
                                  ? 'Locked by you'
                                  : `Locked by ${orderLocksStore.getLock(order.id)?.locked_by_user_name}`
                              }
                            >
                              {orderLocksStore.isLockedByMe(order.id) ? '🔓' : '🔒'}
                            </span>
                          </Show>
                        </td>
                        <td class={styles.tableCell}>
                          <div class={styles.orderNumber}>{order.orderNumber}</div>
                        </td>
                        <td class={styles.tableCell}>
                          <div class={styles.batchNumber}>
                            {order.batchNumber || '-'}
                          </div>
                        </td>
                        <td class={styles.tableCell}>
                          <div class={styles.itemCount}>
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                          <Show when={order.items.length > 0}>
                            <div class={styles.itemNames}>
                              {order.items.map(item => item.productName).join(', ')}
                            </div>
                          </Show>
                        </td>
                        <td class={styles.tableCellCenter}>
                          <Badge
                            {...getPriorityVariant(order.priority)}
                            size="sm"
                          >
                            {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                          </Badge>
                        </td>
                        <td class={styles.tableCellCenter}>
                          <Badge
                            {...getStatusVariant(order.status)}
                            size="sm"
                          >
                            {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                          </Badge>
                        </td>
                        <td class={styles.tableCell}>
                          <span class={styles.dateText}>
                            {order.productionDate ? formatDate(order.productionDate) : '-'}
                          </span>
                        </td>
                        <td class={styles.actionsCell}>
                          <div class={styles.actionsRow} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleViewDetails(order)}
                              class={styles.actionLink}
                            >Details</button>
                            <Show when={order.status === 'approved'}>
                              <button
                                onClick={() => handleScheduleProductionClick(order)}
                                class={styles.successLink}
                              >Schedule</button>
                            </Show>
                            <Show when={order.status !== 'delivered' && order.status !== 'cancelled'}>
                              <button
                                onClick={() => handleEditOrder(order)}
                                class={styles.actionLink}
                              >Edit</button>
                            </Show>
                            <Show when={order.status !== 'delivered' && order.status !== 'cancelled'}>
                              <button
                                onClick={() => handleDeleteClick(order)}
                                class={styles.deleteLink}
                              >Delete</button>
                            </Show>
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

      {/* Form Modal */}
      <InternalOrderFormModal
        show={showFormModal()}
        onClose={() => {
          // Release lock if editing
          const order = selectedOrder();
          if (editMode() && order) {
            orderLocksStore.releaseLock(order.id);
          }
          setShowFormModal(false);
          setEditMode(false);
          setSelectedOrder(undefined);
        }}
        onSubmit={editMode() ? handleUpdateOrder : handleCreateOrder}
        editOrder={editMode() ? selectedOrder() : undefined}
      />

      {/* Details Modal */}
      <InternalOrderDetailsModal
        show={showDetailsModal()}
        order={selectedOrder() || null}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(undefined);
        }}
        onEdit={handleEditOrder}
        onDelete={handleDeleteClick}
        onStatusChange={handleStatusChange}
        onScheduleProduction={handleScheduleProductionClick}
      />

      {/* Delete Confirmation Dialog */}
      <Show when={showDeleteConfirm()}>
        <div class={styles.modalBackdrop} onClick={handleCancelDelete}>
          <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 class={styles.modalTitle}>Delete Production Order</h3>
            <p class={styles.modalText}>
              Are you sure you want to delete order "{orderToDelete()?.orderNumber}"? This action cannot be undone.
            </p>
            <div class={styles.modalActions}>
              <button onClick={handleCancelDelete} class={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleConfirmDelete} class={styles.deleteButton}>
                Delete
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Schedule Production Modal */}
      <Show when={showScheduleModal()}>
        <div class={styles.modalBackdrop} onClick={handleCancelSchedule}>
          <div class={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
            <h3 class={styles.modalTitle}>Schedule Production</h3>

            <Show when={orderToSchedule()}>
              {(order) => (
                <div>
                  <div class={styles.orderDetailsCard}>
                    <h4 class={styles.orderDetailsTitle}>Order Details</h4>
                    <div class={styles.orderDetailsList}>
                      <div><strong>Order #:</strong> {order().orderNumber}</div>
                      <div><strong>Source:</strong> {order().source.replace('_', ' ')}</div>
                      <div><strong>Items:</strong> {order().items.length} product(s)</div>
                      <Show when={order().items.length > 0}>
                        <div class={styles.orderItemsList}>
                          <For each={order().items}>
                            {(item) => (
                              <div>• {item.quantity}x {item.productName}</div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>

                  <div class={styles.formGroup}>
                    <DatePicker
                      label="Production Date"
                      value={scheduledProductionDate()}
                      onChange={(value) => setScheduledProductionDate(value)}
                      minDate={getCurrentDateString()}
                      disabled={isScheduling()}
                    />
                    <p class={styles.formHint}>
                      A production schedule will be created for all products in this order.
                    </p>
                  </div>
                </div>
              )}
            </Show>

            <div class={styles.modalActions}>
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
                onClick={handleScheduleProduction}
                disabled={isScheduling()}
              >
                {isScheduling() ? 'Scheduling...' : 'Schedule Production'}
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default InternalOrdersPage;
