import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { eq, and, lt } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  orderLocks,
  usersTable,
  customerOrders,
  internalOrders,
} from '../database/schemas';
import { RedisConfigService } from '../config/redis.config';
import {
  AcquireLockDto,
  OrderLockResponseDto,
  UnlockedStatusDto,
} from './dto/acquire-lock.dto';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class OrderLocksService {
  private readonly LOCK_TTL_SECONDS = 300; // 5 minutes

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(RedisConfigService)
    private readonly redisConfig: RedisConfigService,
    @Inject(forwardRef(() => RealtimeService))
    private readonly realtimeService: RealtimeService,
  ) {}

  async acquireLock(
    userId: string,
    dto: AcquireLockDto,
  ): Promise<OrderLockResponseDto> {
    const redis = this.redisConfig.getClient();
    const lockKey = `order_lock:${dto.order_type}:${dto.order_id}`;

    // Check if order exists in the appropriate table
    const orderTable =
      dto.order_type === 'customer' ? customerOrders : internalOrders;
    const [order] = await this.databaseService.database
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, dto.order_id))
      .limit(1);
    if (!order) {
      throw new NotFoundException(
        `${dto.order_type === 'customer' ? 'Customer' : 'Internal'} order not found`,
      );
    }

    // Try to acquire Redis lock first (fast check)
    const redisLockAcquired = await redis.set(
      lockKey,
      JSON.stringify({ userId, sessionId: dto.session_id }),
      'EX',
      this.LOCK_TTL_SECONDS,
      'NX', // Only set if not exists
    );

    if (!redisLockAcquired) {
      // Lock exists in Redis, get current lock from DB
      const existingLock = await this.getLockStatus(dto.order_id);
      if ('locked_by_user_id' in existingLock) {
        throw new ConflictException({
          statusCode: 409,
          message: `Order is currently locked by ${existingLock.locked_by_user_name}`,
          locked_by: existingLock,
        });
      }
    }

    // Create lock in PostgreSQL (persistent backup)
    const expiresAt = new Date(Date.now() + this.LOCK_TTL_SECONDS * 1000);

    try {
      // Check if lock already exists in DB
      const [existingDbLock] = await this.databaseService.database
        .select()
        .from(orderLocks)
        .where(eq(orderLocks.orderId, dto.order_id))
        .limit(1);

      let lockResponse: OrderLockResponseDto;

      if (existingDbLock) {
        // Update existing lock
        const [updatedLock] = await this.databaseService.database
          .update(orderLocks)
          .set({
            orderType: dto.order_type,
            lockedByUserId: userId,
            lockedBySessionId: dto.session_id,
            lockedAt: new Date(),
            expiresAt,
            lastActivityAt: new Date(),
          })
          .where(eq(orderLocks.orderId, dto.order_id))
          .returning();

        if (!updatedLock) {
          throw new Error('Failed to update order lock');
        }

        lockResponse = await this.mapToResponseDto(updatedLock);
      } else {
        // Insert new lock
        const [newLock] = await this.databaseService.database
          .insert(orderLocks)
          .values({
            orderType: dto.order_type,
            orderId: dto.order_id,
            lockedByUserId: userId,
            lockedBySessionId: dto.session_id,
            lockedAt: new Date(),
            expiresAt,
            lastActivityAt: new Date(),
          })
          .returning();

        if (!newLock) {
          throw new Error('Failed to create order lock');
        }

        lockResponse = await this.mapToResponseDto(newLock);
      }

      // Broadcast lock notification to all clients
      this.realtimeService.broadcastOrderLocked({
        order_id: lockResponse.order_id,
        locked_by_user_id: lockResponse.locked_by_user_id,
        locked_by_user_name: lockResponse.locked_by_user_name,
        locked_at: lockResponse.locked_at,
      });

      return lockResponse;
    } catch (error) {
      // Rollback Redis lock if DB operation fails
      await redis.del(lockKey);
      throw error;
    }
  }

  async releaseLock(userId: string, orderId: string): Promise<void> {
    const redis = this.redisConfig.getClient();

    // Find lock in DB
    const [lock] = await this.databaseService.database
      .select()
      .from(orderLocks)
      .where(
        and(
          eq(orderLocks.orderId, orderId),
          eq(orderLocks.lockedByUserId, userId),
        ),
      )
      .limit(1);

    if (!lock) {
      throw new NotFoundException('No lock found or not owned by current user');
    }

    // Build Redis lock key with order type
    const lockKey = `order_lock:${lock.orderType}:${orderId}`;

    // Delete from DB
    await this.databaseService.database
      .delete(orderLocks)
      .where(eq(orderLocks.id, lock.id));

    // Delete from Redis
    await redis.del(lockKey);

    // Broadcast unlock notification to all clients
    this.realtimeService.broadcastOrderUnlocked(orderId);
  }

  async renewLock(
    userId: string,
    orderId: string,
  ): Promise<OrderLockResponseDto> {
    const redis = this.redisConfig.getClient();

    // Find lock owned by user
    const [lock] = await this.databaseService.database
      .select()
      .from(orderLocks)
      .where(
        and(
          eq(orderLocks.orderId, orderId),
          eq(orderLocks.lockedByUserId, userId),
        ),
      )
      .limit(1);

    if (!lock) {
      throw new NotFoundException('Lock not found or expired');
    }

    // Build Redis lock key with order type
    const lockKey = `order_lock:${lock.orderType}:${orderId}`;

    // Extend TTL in Redis
    await redis.expire(lockKey, this.LOCK_TTL_SECONDS);

    // Update DB
    const expiresAt = new Date(Date.now() + this.LOCK_TTL_SECONDS * 1000);
    const [updatedLock] = await this.databaseService.database
      .update(orderLocks)
      .set({
        expiresAt,
        lastActivityAt: new Date(),
      })
      .where(eq(orderLocks.id, lock.id))
      .returning();

    if (!updatedLock) {
      throw new Error('Failed to renew order lock');
    }

    return this.mapToResponseDto(updatedLock);
  }

  async getLockStatus(
    orderId: string,
  ): Promise<OrderLockResponseDto | UnlockedStatusDto> {
    // Check if order exists in either table
    const [customerOrder] = await this.databaseService.database
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.id, orderId))
      .limit(1);

    const [internalOrder] = await this.databaseService.database
      .select()
      .from(internalOrders)
      .where(eq(internalOrders.id, orderId))
      .limit(1);

    if (!customerOrder && !internalOrder) {
      throw new NotFoundException('Order not found');
    }

    // Get lock from DB
    const [lock] = await this.databaseService.database
      .select()
      .from(orderLocks)
      .where(
        and(
          eq(orderLocks.orderId, orderId),
          lt(orderLocks.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!lock) {
      return {
        order_id: orderId,
        locked: false,
      };
    }

    return this.mapToResponseDto(lock);
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.databaseService.database
      .delete(orderLocks)
      .where(lt(orderLocks.expiresAt, new Date()));
    return result.rowCount || 0;
  }

  private async mapToResponseDto(
    lock: typeof orderLocks.$inferSelect,
  ): Promise<OrderLockResponseDto> {
    // Get user name from firstName and lastName
    const [user] = await this.databaseService.database
      .select({
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(usersTable)
      .where(eq(usersTable.id, lock.lockedByUserId))
      .limit(1);

    return {
      id: lock.id,
      order_id: lock.orderId,
      locked_by_user_id: lock.lockedByUserId,
      locked_by_user_name: user
        ? `${user.firstName} ${user.lastName}`
        : 'Unknown User',
      locked_by_session_id: lock.lockedBySessionId,
      locked_at: lock.lockedAt.toISOString(),
      expires_at: lock.expiresAt.toISOString(),
      last_activity_at: lock.lastActivityAt.toISOString(),
    };
  }
}
