import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config/constants';

// Event payload types
export interface DashboardMetrics {
  total_orders?: number;
  pending_orders?: number;
  revenue_today?: number;
  low_stock_items?: number;
  active_production_batches?: number;
}

export interface MetricsUpdateEvent {
  timestamp: string;
  metrics: DashboardMetrics;
}

export interface OrderLockEvent {
  order_id: string;
  locked_by_user_id: string;
  locked_by_user_name: string;
  locked_at: string;
}

export interface OrderUnlockedEvent {
  order_id: string;
}

export interface OrderUpdateEvent {
  order_id: string;
  changes: Record<string, unknown>;
}

export interface InventoryLowStockAlert {
  item_id: string;
  item_name: string;
  current_stock: number;
  threshold: number;
  days_of_supply_remaining?: number;
}

export interface ConnectionStatusEvent {
  status: 'connected' | 'reconnecting' | 'disconnected';
  message?: string;
}

export interface ErrorEvent {
  code: 'AUTH_FAILED' | 'RATE_LIMIT' | 'INVALID_EVENT' | 'SERVER_ERROR';
  message: string;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

// Event listener types
export type MetricsUpdateListener = (data: MetricsUpdateEvent) => void;
export type OrderLockListener = (data: OrderLockEvent) => void;
export type OrderUnlockedListener = (data: OrderUnlockedEvent) => void;
export type OrderUpdateListener = (data: OrderUpdateEvent) => void;
export type InventoryAlertListener = (data: InventoryLowStockAlert) => void;
export type ConnectionStatusListener = (data: ConnectionStatusEvent) => void;
export type ErrorListener = (data: ErrorEvent) => void;

class RealtimeClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 2000; // 2 seconds
  private reconnectTimer: number | null = null;

  /**
   * Connect to WebSocket server with JWT authentication
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[Realtime] Already connected');
      return;
    }

    const wsUrl = API_URL.replace('http', 'ws');

    console.log('[Realtime] Connecting to:', wsUrl);

    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // WebSocket first, fallback to polling
      reconnection: false, // We'll handle reconnection manually for exponential backoff
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket?.disconnect();
    this.socket = null;
    this.reconnectAttempts = 0;
    console.log('[Realtime] Disconnected');
  }

  /**
   * Join user's dashboard room for metric updates
   */
  joinDashboard(userId: string): void {
    if (!this.socket?.connected) {
      console.warn('[Realtime] Cannot join dashboard: not connected');
      return;
    }

    this.socket.emit('dashboard:join', { userId });
    console.log('[Realtime] Joined dashboard room:', userId);
  }

  /**
   * Send heartbeat with active order locks
   */
  sendHeartbeat(activeOrderLocks: string[] = []): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('heartbeat', {
      timestamp: new Date().toISOString(),
      active_order_locks: activeOrderLocks,
    });
  }

  /**
   * Listen for metrics updates
   */
  onMetricsUpdate(listener: MetricsUpdateListener): () => void {
    if (!this.socket) return () => {};
    this.socket.on('metrics:update', listener);
    return () => this.socket?.off('metrics:update', listener);
  }

  /**
   * Listen for order locked events
   */
  onOrderLocked(listener: OrderLockListener): () => void {
    if (!this.socket) return () => {};
    this.socket.on('order:locked', listener);
    return () => this.socket?.off('order:locked', listener);
  }

  /**
   * Listen for order unlocked events
   */
  onOrderUnlocked(listener: OrderUnlockedListener): () => void {
    if (!this.socket) return () => {};
    this.socket.on('order:unlocked', listener);
    return () => this.socket?.off('order:unlocked', listener);
  }

  /**
   * Listen for order update events
   */
  onOrderUpdate(listener: OrderUpdateListener): () => void {
    if (!this.socket) return () => {};
    this.socket.on('order:updated', listener);
    return () => this.socket?.off('order:updated', listener);
  }

  /**
   * Listen for inventory low stock alerts
   */
  onInventoryLowStock(listener: InventoryAlertListener): () => void {
    if (!this.socket) return () => {};
    this.socket.on('inventory:low-stock-alert', listener);
    return () => this.socket?.off('inventory:low-stock-alert', listener);
  }

  /**
   * Listen for connection status changes
   */
  onConnectionStatus(listener: ConnectionStatusListener): () => void {
    if (!this.socket) return () => {};
    this.socket.on('connection:status', listener);
    return () => this.socket?.off('connection:status', listener);
  }

  /**
   * Listen for errors
   */
  onError(listener: ErrorListener): () => void {
    if (!this.socket) return () => {};
    this.socket.on('error', listener);
    return () => this.socket?.off('error', listener);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Setup internal event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Realtime] Connected');
      this.reconnectAttempts = 0;

      // Auto-join dashboard room if user ID is available
      const userId = this.getUserIdFromToken();
      if (userId) {
        this.joinDashboard(userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Realtime] Disconnected:', reason);

      // Attempt reconnection with exponential backoff if not a manual disconnect
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Realtime] Connection error:', error);
      this.scheduleReconnect();
    });

    this.socket.on('dashboard:joined', (data) => {
      console.log('[Realtime] Dashboard joined:', data);
    });

    this.socket.on('heartbeat:ack', () => {
      // Heartbeat acknowledged
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Realtime] Max reconnection attempts reached');
      return;
    }

    // Calculate delay with exponential backoff: 2s, 4s, 8s, 16s, 32s, ...
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      60000 // Max 60 seconds
    );

    console.log(
      `[Realtime] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`
    );

    this.reconnectAttempts++;

    this.reconnectTimer = window.setTimeout(() => {
      if (!this.socket?.connected) {
        const token = localStorage.getItem('access_token');
        if (token) {
          this.connect(token);
        }
      }
    }, delay);
  }

  /**
   * Extract user ID from JWT token
   */
  private getUserIdFromToken(): string | null {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch (error) {
      console.error('[Realtime] Failed to parse token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const realtimeClient = new RealtimeClient();
