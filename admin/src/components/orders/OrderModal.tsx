import { Component, Show, createSignal, onCleanup, createEffect } from 'solid-js';
import { orderLocksStore } from '../../stores/order-locks';
import OrderLockIndicator from './OrderLockIndicator';
import { XMarkIcon } from '../Icons/icons';
import Button from '../common/Button';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
  total_price: number;
  order_date: string;
  delivery_date?: string;
  notes?: string;
}

interface OrderModalProps {
  order: Order | null;
  orderType: 'customer' | 'internal';
  isOpen: boolean;
  onClose: () => void;
}

/**
 * OrderModal displays full order details with lock acquisition
 * Automatically acquires lock on mount, renews every 30s, releases on unmount
 */
const OrderModal: Component<OrderModalProps> = (props) => {
  const [isAcquiringLock, setIsAcquiringLock] = createSignal(false);
  const [lockError, setLockError] = createSignal<string | null>(null);
  const [renewalInterval, setRenewalInterval] = createSignal<number | null>(null);

  // Acquire lock when modal opens
  createEffect(() => {
    if (props.isOpen && props.order) {
      acquireLock();
    }
  });

  // Release lock when modal closes
  createEffect(() => {
    if (!props.isOpen && props.order) {
      releaseLock();
    }
  });

  const acquireLock = async () => {
    if (!props.order) return;

    setIsAcquiringLock(true);
    setLockError(null);

    try {
      await orderLocksStore.acquireLock(props.order.id, props.orderType);
      startLockRenewal();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to acquire lock';
      setLockError(errorMsg);
      console.error('[OrderModal] Failed to acquire lock:', error);
    } finally {
      setIsAcquiringLock(false);
    }
  };

  const releaseLock = async () => {
    if (!props.order) return;

    stopLockRenewal();

    try {
      await orderLocksStore.releaseLock(props.order.id);
    } catch (error) {
      console.error('[OrderModal] Failed to release lock:', error);
    }
  };

  const renewLock = async () => {
    if (!props.order) return;

    try {
      await orderLocksStore.renewLock(props.order.id);
    } catch (error) {
      console.error('[OrderModal] Failed to renew lock:', error);
      // If renewal fails, try to reacquire
      await acquireLock();
    }
  };

  const startLockRenewal = () => {
    stopLockRenewal();

    const interval = window.setInterval(() => {
      renewLock();
    }, 30000); // 30 seconds

    setRenewalInterval(interval);
  };

  const stopLockRenewal = () => {
    const interval = renewalInterval();
    if (interval) {
      clearInterval(interval);
      setRenewalInterval(null);
    }
  };

  const handleClose = () => {
    releaseLock();
    props.onClose();
  };

  const isLockedByOther = () => {
    if (!props.order) return false;
    const lock = orderLocksStore.locks.get(props.order.id);
    return lock ? !orderLocksStore.isLockedByMe(props.order.id) : false;
  };

  const canEdit = () => {
    if (!props.order) return false;
    return orderLocksStore.isLockedByMe(props.order.id) && !isAcquiringLock();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Order['status']): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in_production':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Cleanup on unmount
  onCleanup(() => {
    stopLockRenewal();
  });

  return (
    <Show when={props.isOpen && props.order}>
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        {/* Modal */}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                Order Details
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Order ID: {props.order!.id}
              </p>
            </div>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              class="p-2"
              aria-label="Close modal"
            >
              <XMarkIcon class="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>

          {/* Content */}
          <div class="p-6 space-y-6">
            {/* Lock Status */}
            <Show when={isAcquiringLock()}>
              <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-400">
                  Acquiring lock...
                </p>
              </div>
            </Show>

            <Show when={lockError()}>
              <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p class="text-sm text-red-800 dark:text-red-400">
                  {lockError()}
                </p>
              </div>
            </Show>

            <Show when={isLockedByOther()}>
              <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <OrderLockIndicator lock={orderLocksStore.locks.get(props.order!.id) || null} />
                <p class="text-sm text-amber-800 dark:text-amber-400 mt-2">
                  You cannot edit this order while it's locked by another user.
                </p>
              </div>
            </Show>

            {/* Customer Info */}
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Customer Information
              </h3>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">Name:</span>
                  <span class="text-sm text-gray-900 dark:text-white">{props.order!.customer_name}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">Email:</span>
                  <span class="text-sm text-gray-900 dark:text-white">{props.order!.customer_email}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">Phone:</span>
                  <span class="text-sm text-gray-900 dark:text-white">{props.order!.customer_phone}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Order Details
              </h3>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">Status:</span>
                  <span class={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(props.order!.status)}`}>
                    {props.order!.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">Total:</span>
                  <span class="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(props.order!.total_price)}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">Order Date:</span>
                  <span class="text-sm text-gray-900 dark:text-white">
                    {formatDate(props.order!.order_date)}
                  </span>
                </div>
                <Show when={props.order!.delivery_date}>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-400 w-32">Delivery:</span>
                    <span class="text-sm text-gray-900 dark:text-white">
                      {formatDate(props.order!.delivery_date!)}
                    </span>
                  </div>
                </Show>
              </div>
            </div>

            {/* Notes */}
            <Show when={props.order!.notes}>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Notes
                </h3>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {props.order!.notes}
                </p>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleClose}
              variant="secondary"
              size="sm"
            >
              Close
            </Button>
            <Button
              disabled={!canEdit()}
              variant="primary"
              size="sm"
            >
              Edit Order
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default OrderModal;
