import { Component, Show } from 'solid-js';
import { OrderLock } from '../../api/order-locks';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';
  total_price: number;
  order_date: string;
  delivery_date?: string;
}

interface OrderCardProps {
  order: Order;
  isLocked: boolean;
  lockedBy?: OrderLock;
  onClick: () => void;
}

const OrderCard: Component<OrderCardProps> = (props) => {
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={props.onClick}
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {props.order.customer_name}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{props.order.customer_email}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">{props.order.customer_phone}</p>
        </div>

        <div class="flex flex-col items-end space-y-2">
          <span class={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(props.order.status)}`}>
            {props.order.status.replace('_', ' ').toUpperCase()}
          </span>

          <Show when={props.isLocked}>
            <span class="px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs font-medium flex items-center">
              🔒 Locked
            </span>
          </Show>
        </div>
      </div>

      <div class="flex items-center justify-between text-sm">
        <div>
          <p class="text-gray-600 dark:text-gray-300">
            <span class="font-medium">Order Date:</span> {formatDate(props.order.order_date)}
          </p>
          <Show when={props.order.delivery_date}>
            <p class="text-gray-600 dark:text-gray-300">
              <span class="font-medium">Delivery:</span> {formatDate(props.order.delivery_date!)}
            </p>
          </Show>
        </div>

        <div class="text-right">
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(props.order.total_price)}
          </p>
        </div>
      </div>

      <Show when={props.isLocked && props.lockedBy}>
        <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs text-red-600 dark:text-red-400">
            🔒 Currently being edited by <strong>{props.lockedBy?.locked_by_user_name}</strong>
          </p>
        </div>
      </Show>
    </div>
  );
};

export default OrderCard;
