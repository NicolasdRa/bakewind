import { Component, Show, For } from 'solid-js';
import { InternalOrder, InternalOrderStatus } from '~/api/internalOrders';
import Button from '~/components/common/Button';
import styles from './InternalOrderDetailsModal.module.css';

interface InternalOrderDetailsModalProps {
  show: boolean;
  order: InternalOrder | null;
  onClose: () => void;
  onEdit: (order: InternalOrder) => void;
  onDelete: (order: InternalOrder) => void;
  onStatusChange: (order: InternalOrder, status: InternalOrderStatus) => void;
  onScheduleProduction?: (order: InternalOrder) => void;
}

const InternalOrderDetailsModal: Component<InternalOrderDetailsModalProps> = (props) => {
  const formatDate = (dateString: string | null, includeTime = true) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (includeTime) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return '$0.00';
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const getStatusColor = (status: InternalOrderStatus): string => {
    const colors: Record<InternalOrderStatus, string> = {
      draft: '#6B7280',
      requested: '#F59E0B',
      approved: '#3B82F6',
      scheduled: '#8B5CF6',
      in_production: '#EC4899',
      quality_check: '#F97316',
      ready: '#10B981',
      completed: '#22C55E',
      delivered: '#059669',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      low: '#10B981',
      normal: '#3B82F6',
      high: '#F59E0B',
      rush: '#EF4444',
    };
    return colors[priority] || '#3B82F6';
  };

  const formatSource = (source: string): string => {
    return source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getNextStatus = (currentStatus: InternalOrderStatus): InternalOrderStatus | null => {
    const statusFlow: Record<InternalOrderStatus, InternalOrderStatus | null> = {
      draft: 'requested',
      requested: 'approved',
      approved: 'scheduled',
      scheduled: 'in_production',
      in_production: 'quality_check',
      quality_check: 'ready',
      ready: 'completed',
      completed: 'delivered',
      delivered: null,
      cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  const canAdvanceStatus = () => {
    if (!props.order) return false;
    const status = props.order.status;
    // Can't advance from approved directly - must use Schedule button
    if (status === 'approved') return false;
    return getNextStatus(status) !== null;
  };

  const handleAdvanceStatus = () => {
    if (!props.order) return;
    const nextStatus = getNextStatus(props.order.status);
    if (nextStatus) {
      props.onStatusChange(props.order, nextStatus);
    }
  };

  // Status-based visibility helpers
  const isScheduledOrLater = () => {
    if (!props.order) return false;
    const scheduledStatuses: InternalOrderStatus[] = [
      'scheduled', 'in_production', 'quality_check', 'ready', 'completed', 'delivered'
    ];
    return scheduledStatuses.includes(props.order.status);
  };

  const isInProductionOrLater = () => {
    if (!props.order) return false;
    const productionStatuses: InternalOrderStatus[] = [
      'in_production', 'quality_check', 'ready', 'completed', 'delivered'
    ];
    return productionStatuses.includes(props.order.status);
  };

  const isApproved = () => {
    if (!props.order) return false;
    return props.order.approvedAt !== null;
  };

  const getTotalItems = () => {
    if (!props.order) return 0;
    return props.order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <Show when={props.show && props.order}>
      {(order) => (
        <div class={styles.overlay} onClick={props.onClose}>
          <div class={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div class={styles.header}>
              <div class={styles.headerContent}>
                <h2 class={styles.orderNumber}>{order().orderNumber}</h2>
                <div class={styles.badges}>
                  <span
                    class={styles.badge}
                    style={{ "background-color": getStatusColor(order().status) }}
                  >
                    {order().status.replace('_', ' ')}
                  </span>
                  <span
                    class={styles.badge}
                    style={{ "background-color": getPriorityColor(order().priority) }}
                  >
                    {order().priority} priority
                  </span>
                </div>
              </div>
              <Button onClick={props.onClose} variant="ghost" size="sm">
                ×
              </Button>
            </div>

            {/* Content */}
            <div class={styles.content}>
              <div class={styles.sections}>
                {/* Order Information */}
                <div class={styles.section}>
                  <h3 class={styles.sectionTitle}>Order Information</h3>
                  <div class={styles.infoGrid}>
                    <div class={styles.infoItem}>
                      <span class={styles.infoLabel}>Source</span>
                      <span class={`${styles.infoValue} ${styles.infoValueCapitalize}`}>
                        {formatSource(order().source)}
                      </span>
                    </div>
                    <div class={styles.infoItem}>
                      <span class={styles.infoLabel}>Requested By</span>
                      <span class={styles.infoValue}>{order().requestedBy}</span>
                    </div>
                    <div class={styles.infoItem}>
                      <span class={styles.infoLabel}>Needed By</span>
                      <span class={styles.infoValue}>{formatDate(order().neededByDate, false)}</span>
                    </div>
                    <div class={styles.infoItem}>
                      <span class={styles.infoLabel}>Requested Date</span>
                      <span class={styles.infoValue}>{formatDate(order().requestedDate, false)}</span>
                    </div>
                    <Show when={order().batchNumber}>
                      <div class={styles.infoItem}>
                        <span class={styles.infoLabel}>Batch Number</span>
                        <span class={`${styles.infoValue} ${styles.infoValueMono}`}>
                          {order().batchNumber}
                        </span>
                      </div>
                    </Show>
                  </div>
                </div>

                {/* Products */}
                <div class={styles.section}>
                  <h3 class={styles.sectionTitle}>Products ({order().items.length})</h3>
                  <div class={styles.productsList}>
                    <For each={order().items}>
                      {(item) => (
                        <div class={styles.productItem}>
                          <div class={styles.productInfo}>
                            <span class={styles.productName}>{item.productName}</span>
                            <span class={styles.productCost}>
                              {formatCurrency(item.unitCost)} per unit
                            </span>
                          </div>
                          <div class={styles.productQuantity}>
                            <div class={styles.productQuantityValue}>{item.quantity} units</div>
                            <div class={styles.productTotal}>
                              {formatCurrency(
                                (parseFloat(item.unitCost || '0') * item.quantity).toString()
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                  {/* Total Cost */}
                  <div class={styles.totalCost}>
                    <span class={styles.totalCostLabel}>Total ({getTotalItems()} items)</span>
                    <span class={styles.totalCostValue}>{formatCurrency(order().totalCost)}</span>
                  </div>
                </div>

                {/* Notes */}
                <Show when={order().notes || order().specialInstructions}>
                  <div class={styles.section}>
                    <h3 class={styles.sectionTitle}>Notes</h3>
                    <Show when={order().notes}>
                      <div class={styles.notesBox}>{order().notes}</div>
                    </Show>
                    <Show when={order().specialInstructions}>
                      <div class={styles.notesBox}>
                        <strong>Special Instructions:</strong> {order().specialInstructions}
                      </div>
                    </Show>
                  </div>
                </Show>

                {/* Approval Information */}
                <Show when={isApproved()}>
                  <div class={styles.section}>
                    <h3 class={styles.sectionTitle}>Approval</h3>
                    <div class={styles.infoGrid}>
                      <div class={styles.infoItem}>
                        <span class={styles.infoLabel}>Approved By</span>
                        <span class={styles.infoValue}>{order().approvedBy || 'Unknown'}</span>
                      </div>
                      <div class={styles.infoItem}>
                        <span class={styles.infoLabel}>Approved At</span>
                        <span class={styles.infoValue}>{formatDate(order().approvedAt)}</span>
                      </div>
                    </div>
                  </div>
                </Show>

                {/* Production Details - Only show when scheduled or later */}
                <Show when={isScheduledOrLater()}>
                  <div class={styles.section}>
                    <h3 class={styles.sectionTitle}>Production Details</h3>
                    <div class={styles.infoGrid}>
                      <div class={styles.infoItem}>
                        <span class={styles.infoLabel}>Production Date</span>
                        <span class={styles.infoValue}>
                          {formatDate(order().productionDate, false)}
                        </span>
                      </div>
                      <Show when={order().productionShift}>
                        <div class={styles.infoItem}>
                          <span class={styles.infoLabel}>Shift</span>
                          <span class={`${styles.infoValue} ${styles.infoValueCapitalize}`}>
                            {order().productionShift}
                          </span>
                        </div>
                      </Show>
                      <Show when={order().assignedStaff}>
                        <div class={styles.infoItem}>
                          <span class={styles.infoLabel}>Assigned Staff</span>
                          <span class={styles.infoValue}>{order().assignedStaff}</span>
                        </div>
                      </Show>
                      <Show when={order().workstation}>
                        <div class={styles.infoItem}>
                          <span class={styles.infoLabel}>Workstation</span>
                          <span class={styles.infoValue}>{order().workstation}</span>
                        </div>
                      </Show>
                    </div>
                  </div>
                </Show>

                {/* Production Quantities - Only show when in production or later */}
                <Show when={isInProductionOrLater()}>
                  <div class={styles.section}>
                    <h3 class={styles.sectionTitle}>Production Quantities</h3>
                    <div class={styles.statCards}>
                      <div class={styles.statCard}>
                        <div class={styles.statLabel}>Target</div>
                        <div class={styles.statValue}>{order().targetQuantity || 0}</div>
                      </div>
                      <div class={styles.statCard}>
                        <div class={styles.statLabel}>Actual</div>
                        <div class={`${styles.statValue} ${styles.statValueSuccess}`}>
                          {order().actualQuantity || 0}
                        </div>
                      </div>
                      <div class={styles.statCard}>
                        <div class={styles.statLabel}>Waste</div>
                        <div class={`${styles.statValue} ${styles.statValueDanger}`}>
                          {order().wasteQuantity || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </Show>

                {/* Quality Notes */}
                <Show when={order().qualityNotes}>
                  <div class={styles.section}>
                    <h3 class={styles.sectionTitle}>Quality Notes</h3>
                    <div class={styles.notesBox}>{order().qualityNotes}</div>
                  </div>
                </Show>

                {/* Timeline */}
                <div class={styles.section}>
                  <h3 class={styles.sectionTitle}>Timeline</h3>
                  <div class={styles.timeline}>
                    <div class={styles.timelineItem}>
                      <span class={styles.timelineLabel}>Created</span>
                      <span class={styles.timelineValue}>{formatDate(order().createdAt)}</span>
                    </div>
                    <div class={styles.timelineItem}>
                      <span class={styles.timelineLabel}>Last Updated</span>
                      <span class={styles.timelineValue}>{formatDate(order().updatedAt)}</span>
                    </div>
                    <Show when={order().approvedAt}>
                      <div class={styles.timelineItem}>
                        <span class={styles.timelineLabel}>Approved</span>
                        <span class={styles.timelineValue}>{formatDate(order().approvedAt)}</span>
                      </div>
                    </Show>
                    <Show when={order().completedAt}>
                      <div class={styles.timelineItem}>
                        <span class={styles.timelineLabel}>Completed</span>
                        <span class={styles.timelineValueSuccess}>{formatDate(order().completedAt)}</span>
                      </div>
                    </Show>
                    <Show when={order().deliveredAt}>
                      <div class={styles.timelineItem}>
                        <span class={styles.timelineLabel}>Delivered</span>
                        <span class={styles.timelineValueSuccess}>{formatDate(order().deliveredAt)}</span>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div class={styles.footer}>
              <div class={styles.footerLeft}>
                <Button onClick={() => props.onEdit(order())} variant="text" size="sm">
                  Edit
                </Button>
                <Button onClick={() => props.onDelete(order())} variant="danger" size="sm">
                  Delete
                </Button>
              </div>

              <div class={styles.footerRight}>
                <Show when={order().status === 'approved' && props.onScheduleProduction}>
                  <Button
                    onClick={() => props.onScheduleProduction?.(order())}
                    variant="primary"
                    size="sm"
                  >
                    Schedule Production
                  </Button>
                </Show>
                <Show when={canAdvanceStatus()}>
                  <Button onClick={handleAdvanceStatus} variant="primary" size="sm">
                    Advance to {getNextStatus(order().status)?.replace('_', ' ')}
                  </Button>
                </Show>
                <Button onClick={props.onClose} variant="secondary" size="sm">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
};

export default InternalOrderDetailsModal;
