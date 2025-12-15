import { createSignal } from 'solid-js';
import { orderLocksApi, OrderLock } from '../api/order-locks';

// Generate a unique session ID for this browser session
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const SESSION_ID = generateSessionId();
const LOCK_RENEWAL_INTERVAL = 30000; // 30 seconds

// Reactive state
const [locks, setLocks] = createSignal<Map<string, OrderLock>>(new Map());
const [myLocks, setMyLocks] = createSignal<Set<string>>(new Set());
const [loading, setLoading] = createSignal<Map<string, boolean>>(new Map());
const [error, setError] = createSignal<string | null>(null);

// Auto-renewal timers
const renewalTimers = new Map<string, number>();

// Order Locks Store
export const orderLocksStore = {
  get locks() {
    return locks();
  },

  get myLocks() {
    return myLocks();
  },

  get sessionId() {
    return SESSION_ID;
  },

  isLoading(orderId: string): boolean {
    return loading().get(orderId) || false;
  },

  get error() {
    return error();
  },

  clearError() {
    setError(null);
  },

  /**
   * Check if an order is locked
   */
  isLocked(orderId: string): boolean {
    return locks().has(orderId);
  },

  /**
   * Check if an order is locked by current user
   */
  isLockedByMe(orderId: string): boolean {
    return myLocks().has(orderId);
  },

  /**
   * Get lock info for an order
   */
  getLock(orderId: string): OrderLock | undefined {
    return locks().get(orderId);
  },

  /**
   * Acquire lock on an order
   */
  async acquireLock(orderId: string, orderType: 'customer' | 'internal'): Promise<boolean> {
    setLoading((prev) => new Map(prev).set(orderId, true));
    setError(null);

    try {
      const lock = await orderLocksApi.acquireLock(orderId, orderType, SESSION_ID);

      // Update state
      setLocks((prev) => new Map(prev).set(orderId, lock));
      setMyLocks((prev) => new Set(prev).add(orderId));

      // Start auto-renewal
      this.startAutoRenewal(orderId);

      return true;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 409) {
        // Lock conflict - update state with existing lock info
        const conflictError = err as { locked_by: OrderLock };
        if (conflictError.locked_by) {
          setLocks((prev) => new Map(prev).set(orderId, conflictError.locked_by));
        }
        setError(`Order is locked by ${conflictError.locked_by.locked_by_user_name}`);
      } else {
        setError('Failed to acquire lock');
      }
      return false;
    } finally {
      setLoading((prev) => {
        const newMap = new Map(prev);
        newMap.delete(orderId);
        return newMap;
      });
    }
  },

  /**
   * Release lock on an order
   */
  async releaseLock(orderId: string): Promise<void> {
    setLoading((prev) => new Map(prev).set(orderId, true));
    setError(null);

    try {
      await orderLocksApi.releaseLock(orderId);

      // Stop auto-renewal
      this.stopAutoRenewal(orderId);

      // Update state
      setLocks((prev) => {
        const newMap = new Map(prev);
        newMap.delete(orderId);
        return newMap;
      });
      setMyLocks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    } catch (err) {
      setError('Failed to release lock');
      throw err;
    } finally {
      setLoading((prev) => {
        const newMap = new Map(prev);
        newMap.delete(orderId);
        return newMap;
      });
    }
  },

  /**
   * Renew lock on an order (extend TTL)
   */
  async renewLock(orderId: string): Promise<boolean> {
    try {
      const lock = await orderLocksApi.renewLock(orderId);
      setLocks((prev) => new Map(prev).set(orderId, lock));
      return true;
    } catch (err) {
      // Lock might have expired, remove from state
      setLocks((prev) => {
        const newMap = new Map(prev);
        newMap.delete(orderId);
        return newMap;
      });
      setMyLocks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      this.stopAutoRenewal(orderId);
      return false;
    }
  },

  /**
   * Check lock status of an order
   */
  async checkLockStatus(orderId: string): Promise<void> {
    try {
      const status = await orderLocksApi.getLockStatus(orderId);

      if ('locked' in status && !status.locked) {
        // Order is unlocked
        setLocks((prev) => {
          const newMap = new Map(prev);
          newMap.delete(orderId);
          return newMap;
        });
      } else {
        // Order is locked
        const lock = status as OrderLock;
        setLocks((prev) => new Map(prev).set(orderId, lock));
      }
    } catch (err) {
      console.error('Failed to check lock status:', err);
    }
  },

  /**
   * Start auto-renewal for a lock
   */
  startAutoRenewal(orderId: string) {
    // Clear any existing timer
    this.stopAutoRenewal(orderId);

    // Set up new timer
    const timerId = window.setInterval(() => {
      this.renewLock(orderId);
    }, LOCK_RENEWAL_INTERVAL);

    renewalTimers.set(orderId, timerId);
  },

  /**
   * Stop auto-renewal for a lock
   */
  stopAutoRenewal(orderId: string) {
    const timerId = renewalTimers.get(orderId);
    if (timerId) {
      clearInterval(timerId);
      renewalTimers.delete(orderId);
    }
  },

  /**
   * Clean up all locks and timers (call on logout/unmount)
   */
  cleanup() {
    // Release all my locks
    const myLocksArray = Array.from(myLocks());
    myLocksArray.forEach((orderId) => {
      this.releaseLock(orderId).catch(() => {
        // Ignore errors during cleanup
      });
    });

    // Clear all timers
    renewalTimers.forEach((timerId) => clearInterval(timerId));
    renewalTimers.clear();

    // Reset state
    setLocks(new Map());
    setMyLocks(new Set());
    setLoading(new Map());
    setError(null);
  },
};

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  orderLocksStore.cleanup();
});
