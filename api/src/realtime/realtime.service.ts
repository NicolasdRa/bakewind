import { Injectable, Logger } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

interface DashboardMetrics {
  total_orders?: number;
  pending_orders?: number;
  revenue_today?: number;
  low_stock_items?: number;
  active_production_batches?: number;
}

interface OrderLockNotification {
  order_id: string;
  locked_by_user_id: string;
  locked_by_user_name: string;
  locked_at: string;
}

interface InventoryLowStockAlert {
  item_id: string;
  item_name: string;
  current_stock: number;
  threshold: number;
  days_of_supply_remaining?: number;
}

interface OrderUpdateNotification {
  order_id: string;
  changes: Record<string, unknown>;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly throttleMap = new Map<string, number>();
  private readonly throttleIntervalMs = 1000; // 1 second throttle

  constructor(private readonly gateway: RealtimeGateway) {}

  /**
   * Broadcast dashboard metrics to a specific user
   * Throttled to max 1 emit per second per metric type
   */
  broadcastMetrics(userId: string, deltaMetrics: DashboardMetrics): void {
    const throttleKey = `metrics:${userId}`;

    // Check throttle
    if (this.isThrottled(throttleKey)) {
      this.logger.debug(`Metrics broadcast throttled for user ${userId}`);
      return;
    }

    // Update throttle timestamp
    this.updateThrottle(throttleKey);

    // Emit metrics update to user's dashboard room
    this.gateway.emitToUser(userId, 'metrics:update', {
      timestamp: new Date().toISOString(),
      metrics: deltaMetrics,
    });

    this.logger.debug(`Broadcast metrics to user ${userId}:`, deltaMetrics);
  }

  /**
   * Broadcast order locked notification to all clients
   */
  broadcastOrderLocked(lockInfo: OrderLockNotification): void {
    this.gateway.emitToAll('order:locked', lockInfo);
    this.logger.log(`Broadcast order:locked for order ${lockInfo.order_id}`);
  }

  /**
   * Broadcast order unlocked notification to all clients
   */
  broadcastOrderUnlocked(orderId: string): void {
    this.gateway.emitToAll('order:unlocked', {
      order_id: orderId,
    });
    this.logger.log(`Broadcast order:unlocked for order ${orderId}`);
  }

  /**
   * Broadcast order updated notification to specific user
   */
  broadcastOrderUpdate(userId: string, update: OrderUpdateNotification): void {
    this.gateway.emitToUser(userId, 'order:updated', update);
    this.logger.debug(
      `Broadcast order:updated to user ${userId} for order ${update.order_id}`,
    );
  }

  /**
   * Broadcast inventory low stock alert to all clients
   */
  broadcastLowStockAlert(alert: InventoryLowStockAlert): void {
    this.gateway.emitToAll('inventory:low-stock-alert', alert);
    this.logger.log(
      `Broadcast low-stock alert for item ${alert.item_id} (${alert.item_name})`,
    );
  }

  /**
   * Broadcast generic event to all clients
   */
  broadcastToAll(event: string, data: unknown): void {
    this.gateway.emitToAll(event, data);
    this.logger.debug(`Broadcast event ${event} to all clients`);
  }

  /**
   * Broadcast generic event to specific user
   */
  broadcastToUser(userId: string, event: string, data: unknown): void {
    this.gateway.emitToUser(userId, event, data);
    this.logger.debug(`Broadcast event ${event} to user ${userId}`);
  }

  /**
   * Check if a throttle key is currently throttled
   */
  private isThrottled(key: string): boolean {
    const lastEmit = this.throttleMap.get(key);
    if (!lastEmit) {
      return false;
    }

    const now = Date.now();
    return now - lastEmit < this.throttleIntervalMs;
  }

  /**
   * Update throttle timestamp for a key
   */
  private updateThrottle(key: string): void {
    this.throttleMap.set(key, Date.now());

    // Clean up old throttle entries (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [k, timestamp] of this.throttleMap.entries()) {
      if (timestamp < fiveMinutesAgo) {
        this.throttleMap.delete(k);
      }
    }
  }

  /**
   * Get connected clients count for a user's dashboard room
   */
  async getUserRoomSize(userId: string): Promise<number> {
    const roomName = `dashboard:${userId}`;
    return this.gateway.getRoomSize(roomName);
  }
}
