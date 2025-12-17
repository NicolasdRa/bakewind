import { createSignal, onCleanup, createEffect } from 'solid-js';
import {
  realtimeClient,
  type DashboardMetrics,
  type OrderLockEvent,
  type OrderUnlockedEvent,
  type ConnectionStatus,
} from '../api/realtime';

// Store state
const [connectionStatus, setConnectionStatus] =
  createSignal<ConnectionStatus>('disconnected');
const [metrics, setMetrics] = createSignal<DashboardMetrics>({});
const [retryCount, setRetryCount] = createSignal(0);
const [isInitialized, setIsInitialized] = createSignal(false);

// Heartbeat interval (30 seconds)
let heartbeatInterval: number | null = null;

/**
 * Initialize realtime connection
 */
export function initializeRealtime(): void {
  if (isInitialized()) {
    console.log('[RealtimeStore] Already initialized');
    return;
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn('[RealtimeStore] No access token available');
    return;
  }

  console.log('[RealtimeStore] Initializing realtime connection');

  // Connect to WebSocket
  realtimeClient.connect(token);
  setIsInitialized(true);

  // Listen for connection status
  const unsubStatus = realtimeClient.onConnectionStatus((event) => {
    console.log('[RealtimeStore] Connection status:', event.status);
    setConnectionStatus(event.status);

    if (event.status === 'connected') {
      setRetryCount(0);
      startHeartbeat();
    } else if (event.status === 'reconnecting') {
      setRetryCount((prev) => prev + 1);
      stopHeartbeat();
    } else {
      stopHeartbeat();
    }
  });

  // Listen for metrics updates
  const unsubMetrics = realtimeClient.onMetricsUpdate((event) => {
    console.log('[RealtimeStore] Metrics update:', event.metrics);
    mergeMetrics(event.metrics);
  });

  // Listen for errors
  const unsubError = realtimeClient.onError((event) => {
    console.error('[RealtimeStore] Error:', event.code, event.message);

    if (event.code === 'AUTH_FAILED') {
      // Token expired, need to refresh or re-login
      disconnect();
      // TODO: Trigger token refresh or redirect to login
    }
  });

  // Monitor connection status changes
  createEffect(() => {
    const status = realtimeClient.getStatus();
    if (status !== connectionStatus()) {
      setConnectionStatus(status);
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    unsubStatus();
    unsubMetrics();
    unsubError();
    disconnect();
  });
}

/**
 * Disconnect from realtime server
 */
export function disconnect(): void {
  console.log('[RealtimeStore] Disconnecting');
  stopHeartbeat();
  realtimeClient.disconnect();
  setIsInitialized(false);
  setConnectionStatus('disconnected');
}

/**
 * Merge delta metrics with current state
 */
function mergeMetrics(deltaMetrics: DashboardMetrics): void {
  setMetrics((prev) => ({
    ...prev,
    ...deltaMetrics,
  }));
}

/**
 * Start heartbeat interval
 */
function startHeartbeat(): void {
  if (heartbeatInterval) return;

  heartbeatInterval = window.setInterval(() => {
    // Get active order locks from order-locks store
    // For now, send empty array (will be integrated with order-locks store)
    realtimeClient.sendHeartbeat([]);
  }, 30000); // 30 seconds

  console.log('[RealtimeStore] Heartbeat started');
}

/**
 * Stop heartbeat interval
 */
function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[RealtimeStore] Heartbeat stopped');
  }
}

/**
 * Listen for order locked events
 */
export function onOrderLocked(
  callback: (event: OrderLockEvent) => void
): () => void {
  return realtimeClient.onOrderLocked(callback);
}

/**
 * Listen for order unlocked events
 */
export function onOrderUnlocked(
  callback: (event: OrderUnlockedEvent) => void
): () => void {
  return realtimeClient.onOrderUnlocked(callback);
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus();
}

/**
 * Get current metrics
 */
export function getMetrics(): DashboardMetrics {
  return metrics();
}

/**
 * Get retry count
 */
export function getRetryCount(): number {
  return retryCount();
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return connectionStatus() === 'connected';
}

// Export signals for reactive access
export const realtimeStore = {
  connectionStatus,
  metrics,
  retryCount,
  isInitialized,
  initializeRealtime,
  disconnect,
  onOrderLocked,
  onOrderUnlocked,
  getConnectionStatus,
  getMetrics,
  getRetryCount,
  isConnected,
};
