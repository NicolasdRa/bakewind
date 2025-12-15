import { Component, Show, onMount, onCleanup } from 'solid-js';
import { OrderLock } from '../../api/order-locks';
import { LockClosedIcon } from '../Icons/icons';

interface OrderLockIndicatorProps {
  lock: OrderLock | null;
}

/**
 * OrderLockIndicator displays a badge when an order is locked
 * Updates in real-time via WebSocket events
 */
const OrderLockIndicator: Component<OrderLockIndicatorProps> = (props) => {
  const formatLockTime = (lockedAt: string): string => {
    const lockDate = new Date(lockedAt);
    const now = new Date();
    const diffMs = now.getTime() - lockDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins === 1) {
      return '1 min ago';
    } else if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
  };

  return (
    <Show when={props.lock}>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent border-[1.5px] border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 text-sm font-medium">
        <LockClosedIcon class="w-4 h-4" />
        <span>
          Locked by <strong>{props.lock!.locked_by_user_name}</strong>
        </span>
        <span class="text-xs opacity-75">
          ({formatLockTime(props.lock!.locked_at)})
        </span>
      </div>
    </Show>
  );
};

export default OrderLockIndicator;
