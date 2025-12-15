import { Component, Show, For } from 'solid-js';
import { Order, OrderStatus } from '~/api/orders';

interface InternalOrderDetailsModalProps {
  show: boolean;
  order: Order | null;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
}

const InternalOrderDetailsModal: Component<InternalOrderDetailsModalProps> = (props) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: OrderStatus): string => {
    const colors: Record<OrderStatus, string> = {
      draft: '#6B7280',
      pending: '#F59E0B',
      confirmed: '#3B82F6',
      scheduled: '#8B5CF6',
      ready: '#10B981',
      in_production: '#EC4899',
      quality_check: '#F97316',
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

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      draft: 'scheduled',
      pending: 'scheduled',
      confirmed: 'scheduled',
      scheduled: 'ready',
      ready: 'in_production',
      in_production: 'quality_check',
      quality_check: 'completed',
      completed: null,
      delivered: null,
      cancelled: null,
    };
    return statusFlow[currentStatus];
  };

  const canAdvanceStatus = () => {
    if (!props.order) return false;
    return getNextStatus(props.order.status) !== null;
  };

  const handleAdvanceStatus = () => {
    if (!props.order) return;
    const nextStatus = getNextStatus(props.order.status);
    if (nextStatus) {
      props.onStatusChange(props.order, nextStatus);
    }
  };

  return (
    <Show when={props.show && props.order}>
      {(order) => (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            'z-index': '9999',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            padding: '1rem',
            'background-color': 'var(--overlay-bg)',
            'overflow-y': 'auto',
          }}
          onClick={props.onClose}
        >
          <div
            style={{
              'background-color': 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              'border-radius': '0.5rem',
              'box-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              width: '100%',
              'max-width': '800px',
              'max-height': '90vh',
              display: 'flex',
              'flex-direction': 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              'border-bottom': '1px solid var(--border-color)',
              display: 'flex',
              'justify-content': 'space-between',
              'align-items': 'flex-start',
            }}>
              <div>
                <h2 style={{
                  'font-size': '1.5rem',
                  'font-weight': '600',
                  color: 'var(--text-primary)',
                  margin: '0 0 0.5rem 0',
                }}>
                  {order().orderNumber}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', 'align-items': 'center' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    'border-radius': '9999px',
                    'background-color': getStatusColor(order().status),
                    color: 'white',
                    'font-size': '0.75rem',
                    'font-weight': '500',
                    'text-transform': 'capitalize',
                  }}>
                    {order().status.replace('_', ' ')}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    'border-radius': '9999px',
                    'background-color': getPriorityColor(order().priority),
                    color: 'white',
                    'font-size': '0.75rem',
                    'font-weight': '500',
                    'text-transform': 'capitalize',
                  }}>
                    {order().priority} Priority
                  </span>
                </div>
              </div>
              <button
                onClick={props.onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  'font-size': '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0.25rem',
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '1.5rem',
              'overflow-y': 'auto',
              flex: '1',
            }}>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '1.5rem' }}>
                {/* Production Details */}
                <div>
                  <h3 style={{
                    'font-weight': '600',
                    color: 'var(--text-primary)',
                    'margin-bottom': '1rem',
                    'font-size': '1.125rem',
                  }}>
                    Production Details
                  </h3>
                  <div style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(2, 1fr)',
                    gap: '1rem',
                  }}>
                    <div>
                      <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)', 'margin-bottom': '0.25rem' }}>
                        Production Date
                      </div>
                      <div style={{ color: 'var(--text-primary)', 'font-weight': '500' }}>
                        {formatDate(order().productionDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)', 'margin-bottom': '0.25rem' }}>
                        Production Shift
                      </div>
                      <div style={{ color: 'var(--text-primary)', 'font-weight': '500', 'text-transform': 'capitalize' }}>
                        {order().productionShift || 'Not set'}
                      </div>
                    </div>
                    <div>
                      <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)', 'margin-bottom': '0.25rem' }}>
                        Assigned Staff
                      </div>
                      <div style={{ color: 'var(--text-primary)', 'font-weight': '500' }}>
                        {order().assignedStaff || 'Not assigned'}
                      </div>
                    </div>
                    <div>
                      <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)', 'margin-bottom': '0.25rem' }}>
                        Workstation
                      </div>
                      <div style={{ color: 'var(--text-primary)', 'font-weight': '500' }}>
                        {order().workstation || 'Not assigned'}
                      </div>
                    </div>
                    <div>
                      <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)', 'margin-bottom': '0.25rem' }}>
                        Batch Number
                      </div>
                      <div style={{ color: 'var(--text-primary)', 'font-weight': '500', 'font-family': 'monospace' }}>
                        {order().batchNumber || 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantities */}
                <div>
                  <h3 style={{
                    'font-weight': '600',
                    color: 'var(--text-primary)',
                    'margin-bottom': '1rem',
                    'font-size': '1.125rem',
                  }}>
                    Quantities
                  </h3>
                  <div style={{
                    display: 'grid',
                    'grid-template-columns': 'repeat(3, 1fr)',
                    gap: '1rem',
                  }}>
                    <div style={{
                      padding: '1rem',
                      'background-color': 'var(--bg-secondary)',
                      'border-radius': '0.5rem',
                      border: '1px solid var(--border-color)',
                    }}>
                      <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)', 'margin-bottom': '0.5rem' }}>
                        Target
                      </div>
                      <div style={{ 'font-size': '1.5rem', 'font-weight': '600', color: 'var(--text-primary)' }}>
                        {order().targetQuantity || 0}
                      </div>
                    </div>
                    <div style={{
                      padding: '1rem',
                      'background-color': 'var(--bg-secondary)',
                      'border-radius': '0.5rem',
                      border: '1px solid var(--border-color)',
                    }}>
                      <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)', 'margin-bottom': '0.5rem' }}>
                        Actual
                      </div>
                      <div style={{ 'font-size': '1.5rem', 'font-weight': '600', color: '#10B981' }}>
                        {order().actualQuantity || 0}
                      </div>
                    </div>
                    <div style={{
                      padding: '1rem',
                      'background-color': 'var(--bg-secondary)',
                      'border-radius': '0.5rem',
                      border: '1px solid var(--border-color)',
                    }}>
                      <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)', 'margin-bottom': '0.5rem' }}>
                        Waste
                      </div>
                      <div style={{ 'font-size': '1.5rem', 'font-weight': '600', color: '#EF4444' }}>
                        {order().wasteQuantity || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h3 style={{
                    'font-weight': '600',
                    color: 'var(--text-primary)',
                    'margin-bottom': '1rem',
                    'font-size': '1.125rem',
                  }}>
                    Products ({order().items.length})
                  </h3>
                  <div style={{
                    border: '1px solid var(--border-color)',
                    'border-radius': '0.5rem',
                    overflow: 'hidden',
                  }}>
                    <For each={order().items}>
                      {(item, index) => (
                        <div style={{
                          padding: '1rem',
                          display: 'flex',
                          'justify-content': 'space-between',
                          'align-items': 'center',
                          'border-bottom': index() < order().items.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}>
                          <div>
                            <div style={{ 'font-weight': '500', color: 'var(--text-primary)' }}>
                              {item.productName}
                            </div>
                            <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)' }}>
                              ${item.unitPrice} per unit
                            </div>
                          </div>
                          <div style={{ 'text-align': 'right' }}>
                            <div style={{ 'font-weight': '600', color: 'var(--text-primary)' }}>
                              {item.quantity} units
                            </div>
                            <div style={{ 'font-size': '0.875rem', color: 'var(--text-secondary)' }}>
                              ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                {/* Quality Notes */}
                <Show when={order().qualityNotes}>
                  <div>
                    <h3 style={{
                      'font-weight': '600',
                      color: 'var(--text-primary)',
                      'margin-bottom': '1rem',
                      'font-size': '1.125rem',
                    }}>
                      Quality Notes
                    </h3>
                    <div style={{
                      padding: '1rem',
                      'background-color': 'var(--bg-secondary)',
                      'border-radius': '0.5rem',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      'white-space': 'pre-wrap',
                    }}>
                      {order().qualityNotes}
                    </div>
                  </div>
                </Show>

                {/* Notes */}
                <Show when={order().notes}>
                  <div>
                    <h3 style={{
                      'font-weight': '600',
                      color: 'var(--text-primary)',
                      'margin-bottom': '1rem',
                      'font-size': '1.125rem',
                    }}>
                      Notes
                    </h3>
                    <div style={{
                      padding: '1rem',
                      'background-color': 'var(--bg-secondary)',
                      'border-radius': '0.5rem',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      'white-space': 'pre-wrap',
                    }}>
                      {order().notes}
                    </div>
                  </div>
                </Show>

                {/* Timestamps */}
                <div>
                  <h3 style={{
                    'font-weight': '600',
                    color: 'var(--text-primary)',
                    'margin-bottom': '1rem',
                    'font-size': '1.125rem',
                  }}>
                    Timeline
                  </h3>
                  <div style={{ display: 'flex', 'flex-direction': 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Created:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{formatDate(order().createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Last Updated:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{formatDate(order().updatedAt)}</span>
                    </div>
                    <Show when={order().completedAt}>
                      <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
                        <span style={{ color: '#10B981', 'font-weight': '500' }}>{formatDate(order().completedAt)}</span>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1.5rem',
              'border-top': '1px solid var(--border-color)',
              display: 'flex',
              'justify-content': 'space-between',
              gap: '1rem',
            }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => props.onEdit(order())}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--border-color)',
                    'border-radius': '0.375rem',
                    'background-color': 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => props.onDelete(order())}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    'border-radius': '0.375rem',
                    'background-color': 'var(--error-color)',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Show when={canAdvanceStatus()}>
                  <button
                    onClick={handleAdvanceStatus}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      'border-radius': '0.375rem',
                      'background-color': 'var(--primary-color)',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Advance to {getNextStatus(order().status)?.replace('_', ' ')}
                  </button>
                </Show>
                <button
                  onClick={props.onClose}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--border-color)',
                    'border-radius': '0.375rem',
                    'background-color': 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
};

export default InternalOrderDetailsModal;
