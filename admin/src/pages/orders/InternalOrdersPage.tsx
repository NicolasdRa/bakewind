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
import { useInfoModal } from "~/stores/infoModalStore";
import { orderLocksStore } from "~/stores/order-locks";
import InternalOrderFormModal from "~/components/orders/InternalOrderFormModal";
import InternalOrderDetailsModal from "~/components/orders/InternalOrderDetailsModal";

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
  const [scheduledProductionDate, setScheduledProductionDate] = createSignal(new Date().toISOString().split('T')[0]);
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
        // Production-specific fields
        priority: orderData.priority,
        productionDate: orderData.productionDate,
        productionShift: orderData.productionShift,
        assignedStaff: orderData.assignedStaff,
        workstation: orderData.workstation,
        batchNumber: orderData.batchNumber,
        targetQuantity: orderData.targetQuantity,
        notes: orderData.notes,
        // Status and other fields
        status: orderData.status,
        source: orderData.source,
        department: orderData.department,
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
    setScheduledProductionDate(order.productionDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
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

  // Get available status actions based on current status
  const getStatusActions = (status: InternalOrderStatus) => {
    const actions: Array<{ label: string; status: InternalOrderStatus | 'schedule_production'; icon: string; color: string }> = [];

    switch (status) {
      case 'draft':
        actions.push({ label: 'Request', status: 'requested', icon: '📝', color: '#3b82f6' });
        break;
      case 'requested':
        actions.push({ label: 'Approve', status: 'approved', icon: '✅', color: '#10b981' });
        break;
      case 'approved':
        // Special action that opens modal instead of direct status change
        actions.push({ label: 'Schedule Production', status: 'schedule_production', icon: '📅', color: '#8b5cf6' });
        break;
      case 'scheduled':
        actions.push({ label: 'Start Production', status: 'in_production', icon: '🏭', color: '#f59e0b' });
        break;
      case 'in_production':
        actions.push({ label: 'Quality Check', status: 'quality_check', icon: '🔍', color: '#06b6d4' });
        break;
      case 'quality_check':
        actions.push({ label: 'Mark Ready', status: 'ready', icon: '✨', color: '#10b981' });
        actions.push({ label: 'Back to Production', status: 'in_production', icon: '↩️', color: '#f59e0b' });
        break;
      case 'ready':
        actions.push({ label: 'Complete', status: 'completed', icon: '✔️', color: '#059669' });
        actions.push({ label: 'Deliver', status: 'delivered', icon: '🚚', color: '#0891b2' });
        break;
      case 'completed':
        actions.push({ label: 'Deliver', status: 'delivered', icon: '🚚', color: '#0891b2' });
        break;
    }

    // All statuses (except delivered and cancelled) can be cancelled
    if (status !== 'delivered' && status !== 'cancelled') {
      actions.push({ label: 'Cancel', status: 'cancelled', icon: '❌', color: '#ef4444' });
    }

    return actions;
  };

  // Handle action button click - special handling for schedule production
  const handleActionClick = (order: InternalOrder, actionStatus: InternalOrderStatus | 'schedule_production') => {
    if (actionStatus === 'schedule_production') {
      // Open schedule modal instead of changing status
      handleScheduleProductionClick(order);
    } else {
      // Regular status change
      handleStatusChange(order, actionStatus as InternalOrderStatus);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ "margin-bottom": "2rem", display: 'flex', 'justify-content': 'space-between', 'align-items': 'flex-start' }}>
        <div>
          <h1
            style={{
              "font-size": "2rem",
              "font-weight": "600",
              color: "var(--text-primary)",
              "margin-bottom": "0.5rem",
            }}
          >
            Internal Production Orders
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Track and manage internal production orders
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          style={{
            padding: '0.75rem 1.5rem',
            'background-color': 'var(--primary-color)',
            color: 'white',
            border: 'none',
            'border-radius': '0.5rem',
            'font-weight': '500',
            cursor: 'pointer',
            display: 'flex',
            'align-items': 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ 'font-size': '1.25rem' }}>+</span>
          Create Order
        </button>
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
          icon="🏭"
        />
        <StatsCard
          title="In Production"
          value={pendingOrders().toString()}
          icon="⚙️"
        />
        <StatsCard
          title="Completed"
          value={completedOrders().toString()}
          icon="✅"
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
            placeholder="Search by order number, batch number..."
          />
        </div>
        <FilterSelect
          value={statusFilter()}
          onChange={handleFilterChange}
          options={[
            { value: "all", label: "All Status" },
            { value: "draft", label: "Draft" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "scheduled", label: "Scheduled" },
            { value: "ready", label: "Ready" },
            { value: "in_production", label: "In Production" },
            { value: "quality_check", label: "Quality Check" },
            { value: "completed", label: "Completed" },
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
                  No internal orders found. Create your first production order!
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
                      "text-align": "center",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                      width: "50px",
                    }}
                  >
                    {/* Lock icon */}
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
                    Batch Number
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
                      "text-align": "center",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Priority
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
                      "text-align": "left",
                      "font-weight": "600",
                      color: "var(--text-primary)",
                      "border-bottom": "1px solid var(--border-color)",
                    }}
                  >
                    Production Date
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
                        cursor: 'pointer',
                      }}
                      onClick={() => handleViewDetails(order)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--bg-primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td style={{ padding: "0.5rem", "text-align": "center" }}>
                        <Show when={orderLocksStore.isLocked(order.id)}>
                          <span
                            style={{
                              "font-size": "1.25rem",
                              cursor: 'help',
                            }}
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
                        <div style={{ color: "var(--text-primary)", 'font-family': 'monospace', 'font-size': '0.875rem' }}>
                          {order.batchNumber || '-'}
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ color: "var(--text-secondary)" }}>
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <Show when={order.items.length > 0}>
                          <div
                            style={{
                              color: "var(--text-secondary)",
                              "font-size": "0.875rem",
                              "margin-top": "0.25rem",
                            }}
                          >
                            {order.items.map(item => item.productName).join(', ')}
                          </div>
                        </Show>
                      </td>
                      <td style={{ padding: "1rem", "text-align": "center" }}>
                        <Badge
                          {...getPriorityVariant(order.priority)}
                          size="sm"
                        >
                          {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                        </Badge>
                      </td>
                      <td style={{ padding: "1rem", "text-align": "center" }}>
                        <Badge
                          {...getStatusVariant(order.status)}
                          size="sm"
                        >
                          {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                        </Badge>
                      </td>
                      <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                        {order.productionDate ? formatDate(order.productionDate) : '-'}
                      </td>
                      <td style={{ padding: "1rem", "text-align": "center" }}>
                        <div
                          style={{ display: "flex", gap: "0.5rem", "justify-content": "center", "flex-wrap": "wrap" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Status transition actions */}
                          <For each={getStatusActions(order.status)}>
                            {(action) => (
                              <button
                                onClick={() => handleActionClick(order, action.status)}
                                style={{
                                  padding: "0.5rem 1rem",
                                  "background-color": action.color,
                                  color: "white",
                                  border: "none",
                                  "border-radius": "4px",
                                  cursor: "pointer",
                                  "font-size": "0.875rem",
                                  "white-space": "nowrap",
                                }}
                                title={action.status === 'schedule_production' ? 'Schedule for production' : `Change status to ${action.status.replace('_', ' ')}`}
                              >
                                {action.icon} {action.label}
                              </button>
                            )}
                          </For>

                          {/* Always show View and Edit */}
                          <button
                            onClick={() => handleViewDetails(order)}
                            style={{
                              padding: "0.5rem 1rem",
                              "background-color": "var(--primary-color)",
                              color: "white",
                              border: "none",
                              "border-radius": "4px",
                              cursor: "pointer",
                              "font-size": "0.875rem",
                            }}
                          >
                            View
                          </button>
                          <Show when={order.status !== 'delivered' && order.status !== 'cancelled'}>
                            <button
                              onClick={() => handleEditOrder(order)}
                              style={{
                                padding: "0.5rem 1rem",
                                "background-color": "var(--bg-primary)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--border-color)",
                                "border-radius": "4px",
                                cursor: "pointer",
                                "font-size": "0.875rem",
                              }}
                            >
                              Edit
                            </button>
                          </Show>
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
      />

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
              Delete Production Order
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
              "max-width": "32rem",
              "padding": "1.5rem",
              "margin": "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary)">
              Schedule Production
            </h3>

            <Show when={orderToSchedule()}>
              {(order) => (
                <div>
                  <div
                    style={{
                      "background-color": "var(--bg-secondary)",
                      "border-radius": "0.5rem",
                      "padding": "1rem",
                      "margin-bottom": "1.5rem",
                    }}
                  >
                    <h4 style={{ "font-size": "0.875rem", "font-weight": "600", "color": "var(--text-primary)", "margin-bottom": "0.5rem" }}>
                      Order Details
                    </h4>
                    <div style={{ "font-size": "0.875rem", "color": "var(--text-secondary)", "line-height": "1.5" }}>
                      <div><strong>Order #:</strong> {order().orderNumber}</div>
                      <div><strong>Customer:</strong> {order().customerName}</div>
                      <div><strong>Items:</strong> {order().items.length} product(s)</div>
                      <Show when={order().items.length > 0}>
                        <div style={{ "margin-left": "1rem", "margin-top": "0.25rem" }}>
                          <For each={order().items}>
                            {(item) => (
                              <div>• {item.quantity}x {item.productName}</div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2" style="color: var(--text-primary)">
                      Production Date
                    </label>
                    <input
                      type="date"
                      value={scheduledProductionDate()}
                      onInput={(e) => setScheduledProductionDate(e.currentTarget.value)}
                      disabled={isScheduling()}
                      style={{
                        "width": "100%",
                        "padding": "0.5rem 0.75rem",
                        "border": "1px solid var(--border-color)",
                        "border-radius": "0.375rem",
                        "background-color": isScheduling() ? "var(--bg-secondary)" : "var(--bg-primary)",
                        "color": "var(--text-primary)",
                        "cursor": isScheduling() ? "not-allowed" : "text",
                      }}
                    />
                    <p style={{ "margin-top": "0.5rem", "font-size": "0.875rem", "color": "var(--text-secondary)" }}>
                      A production schedule will be created for all products in this order.
                    </p>
                  </div>
                </div>
              )}
            </Show>

            <div class="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelSchedule}
                disabled={isScheduling()}
                class="px-4 py-2 rounded-md font-medium transition-colors"
                style={{
                  "background-color": "transparent",
                  "border": "1px solid var(--border-color)",
                  "color": "var(--text-primary)",
                  "cursor": isScheduling() ? "not-allowed" : "pointer",
                  "opacity": isScheduling() ? "0.5" : "1",
                }}
                onMouseEnter={(e) => !isScheduling() && (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => !isScheduling() && (e.currentTarget.style.opacity = "1")}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleProduction}
                disabled={isScheduling()}
                class="px-4 py-2 rounded-md font-medium transition-colors"
                style={{
                  "background-color": isScheduling() ? "var(--primary-hover, #0056b3)" : "var(--primary-color)",
                  "color": "white",
                  "cursor": isScheduling() ? "not-allowed" : "pointer",
                  "opacity": isScheduling() ? "0.7" : "1",
                }}
                onMouseEnter={(e) => !isScheduling() && (e.currentTarget.style.backgroundColor = "var(--primary-hover, #0056b3)")}
                onMouseLeave={(e) => !isScheduling() && (e.currentTarget.style.backgroundColor = "var(--primary-color)")}
              >
                {isScheduling() ? 'Scheduling...' : 'Schedule Production'}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default InternalOrdersPage;
