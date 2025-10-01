import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { eq, and, lt } from 'drizzle-orm';
import { db } from '../database/db';
import { orderLocks, usersTable, orders } from '../database/schemas';
import { RedisConfigService } from '../config/redis.config';
import { AcquireLockDto, OrderLockResponseDto, UnlockedStatusDto } from './dto/acquire-lock.dto';

@Injectable()
export class OrderLocksService {
  private readonly LOCK_TTL_SECONDS = 300; // 5 minutes

  constructor(
    @Inject(RedisConfigService)
    private readonly redisConfig: RedisConfigService,
  ) {}

  async acquireLock(userId: string, dto: AcquireLockDto): Promise<OrderLockResponseDto> {
    const redis = this.redisConfig.getClient();
    const lockKey = `order_lock:${dto.order_id}`;

    // Check if order exists
    const [order] = await db.select().from(orders).where(eq(orders.id, dto.order_id)).limit(1);
    if (!order) {
      throw new NotFoundException('Order not found');
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
      const [existingDbLock] = await db
        .select()
        .from(orderLocks)
        .where(eq(orderLocks.orderId, dto.order_id))
        .limit(1);

      if (existingDbLock) {
        // Update existing lock
        const [updatedLock] = await db
          .update(orderLocks)
          .set({
            lockedByUserId: userId,
            lockedBySessionId: dto.session_id,
            lockedAt: new Date(),
            expiresAt,
            lastActivityAt: new Date(),
          })
          .where(eq(orderLocks.orderId, dto.order_id))
          .returning();

        return this.mapToResponseDto(updatedLock);
      } else {
        // Insert new lock
        const [newLock] = await db
          .insert(orderLocks)
          .values({
            orderId: dto.order_id,
            lockedByUserId: userId,
            lockedBySessionId: dto.session_id,
            lockedAt: new Date(),
            expiresAt,
            lastActivityAt: new Date(),
          })
          .returning();

        return this.mapToResponseDto(newLock);
      }
    } catch (error) {
      // Rollback Redis lock if DB operation fails
      await redis.del(lockKey);
      throw error;
    }
  }

  async releaseLock(userId: string, orderId: string): Promise<void> {
    const redis = this.redisConfig.getClient();
    const lockKey = `order_lock:${orderId}`;

    // Find lock in DB
    const [lock] = await db
      .select()
      .from(orderLocks)
      .where(and(eq(orderLocks.orderId, orderId), eq(orderLocks.lockedByUserId, userId)))
      .limit(1);

    if (!lock) {
      throw new NotFoundException('No lock found or not owned by current user');
    }

    // Delete from DB
    await db.delete(orderLocks).where(eq(orderLocks.id, lock.id));

    // Delete from Redis
    await redis.del(lockKey);
  }

  async renewLock(userId: string, orderId: string): Promise<OrderLockResponseDto> {
    const redis = this.redisConfig.getClient();
    const lockKey = `order_lock:${orderId}`;

    // Find lock owned by user
    const [lock] = await db
      .select()
      .from(orderLocks)
      .where(and(eq(orderLocks.orderId, orderId), eq(orderLocks.lockedByUserId, userId)))
      .limit(1);

    if (!lock) {
      throw new NotFoundException('Lock not found or expired');
    }

    // Extend TTL in Redis
    await redis.expire(lockKey, this.LOCK_TTL_SECONDS);

    // Update DB
    const expiresAt = new Date(Date.now() + this.LOCK_TTL_SECONDS * 1000);
    const [updatedLock] = await db
      .update(orderLocks)
      .set({
        expiresAt,
        lastActivityAt: new Date(),
      })
      .where(eq(orderLocks.id, lock.id))
      .returning();

    return this.mapToResponseDto(updatedLock);
  }

  async getLockStatus(orderId: string): Promise<OrderLockResponseDto | UnlockedStatusDto> {
    // Check if order exists
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get lock from DB
    const [lock] = await db
      .select()
      .from(orderLocks)
      .where(and(eq(orderLocks.orderId, orderId), lt(new Date(), orderLocks.expiresAt)))
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
    const result = await db.delete(orderLocks).where(lt(orderLocks.expiresAt, new Date()));
    return result.rowCount || 0;
  }

  private async mapToResponseDto(lock: typeof orderLocks.$inferSelect): Promise<OrderLockResponseDto> {
    // Get user name
    const [user] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, lock.lockedByUserId))
      .limit(1);

    return {
      id: lock.id,
      order_id: lock.orderId,
      locked_by_user_id: lock.lockedByUserId,
      locked_by_user_name: user?.name || 'Unknown User',
      locked_by_session_id: lock.lockedBySessionId,
      locked_at: lock.lockedAt.toISOString(),
      expires_at: lock.expiresAt.toISOString(),
      last_activity_at: lock.lastActivityAt.toISOString(),
    };
  }
}
