import { apiClient } from './client';

// Types matching backend contract
export interface OrderLock {
  id: string;
  order_id: string;
  locked_by_user_id: string;
  locked_by_user_name: string;
  locked_by_session_id: string;
  locked_at: string;
  expires_at: string;
  last_activity_at: string;
}

export interface UnlockedStatus {
  order_id: string;
  locked: false;
}

export interface AcquireLockRequest {
  order_id: string;
  order_type: 'customer' | 'internal';
  session_id: string;
}

export interface LockConflictError {
  statusCode: 409;
  message: string;
  locked_by: OrderLock;
}

// Order Locks API
export const orderLocksApi = {
  /**
   * Acquire lock on an order
   */
  async acquireLock(orderId: string, orderType: 'customer' | 'internal', sessionId: string): Promise<OrderLock> {
    return apiClient.post<OrderLock>('/order-locks/acquire', {
      order_id: orderId,
      order_type: orderType,
      session_id: sessionId,
    });
  },

  /**
   * Release lock on an order
   */
  async releaseLock(orderId: string): Promise<void> {
    await apiClient.delete(`/order-locks/release/${orderId}`);
  },

  /**
   * Renew lock on an order (extend TTL)
   */
  async renewLock(orderId: string): Promise<OrderLock> {
    return apiClient.post<OrderLock>(`/order-locks/renew/${orderId}`, {});
  },

  /**
   * Get lock status of an order
   */
  async getLockStatus(orderId: string): Promise<OrderLock | UnlockedStatus> {
    return apiClient.get<OrderLock | UnlockedStatus>(`/order-locks/status/${orderId}`);
  },
};
