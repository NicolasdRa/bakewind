import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OrderLocksService } from '../../src/order-locks/order-locks.service';
import { DatabaseService } from '../../src/database/database.service';
import { RedisConfigService } from '../../src/config/redis.config';
import { RealtimeService } from '../../src/realtime/realtime.service';
import { AcquireLockDto } from '../../src/order-locks/dto/acquire-lock.dto';

/**
 * T041: Unit tests for OrderLocksService
 * Tests: Lock acquisition, conflict detection, TTL expiration, renewal
 */
describe('OrderLocksService (T041)', () => {
  let service: OrderLocksService;
  let mockDatabase: jest.Mocked<DatabaseService>;
  let mockRedisConfig: jest.Mocked<RedisConfigService>;
  let mockRealtimeService: jest.Mocked<RealtimeService>;
  let mockRedisClient: any;

  const mockUserId = 'user-abc123';
  const mockOrderId = 'order-xyz789';
  const mockSessionId = 'session-def456';
  const mockLockId = 'lock-ghi789';

  beforeEach(async () => {
    // Mock Redis client
    mockRedisClient = {
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    };

    mockDatabase = {
      database: {} as any,
    } as jest.Mocked<DatabaseService>;

    mockRedisConfig = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    } as any;

    mockRealtimeService = {
      broadcastOrderLocked: jest.fn(),
      broadcastOrderUnlocked: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderLocksService,
        {
          provide: DatabaseService,
          useValue: mockDatabase,
        },
        {
          provide: RedisConfigService,
          useValue: mockRedisConfig,
        },
        {
          provide: RealtimeService,
          useValue: mockRealtimeService,
        },
      ],
    }).compile();

    service = module.get<OrderLocksService>(OrderLocksService);
  });

  describe('acquireLock', () => {
    it('should successfully acquire lock on unlocked order', async () => {
      const mockOrder = { id: mockOrderId, customerId: 'customer-123' };
      const mockUser = { firstName: 'John', lastName: 'Doe' };
      const mockLock = {
        id: mockLockId,
        orderId: mockOrderId,
        lockedByUserId: mockUserId,
        lockedBySessionId: mockSessionId,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        lastActivityAt: new Date(),
      };

      // Mock DB queries
      const orderQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder]),
      };

      const lockCheckQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No existing lock
      };

      const lockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockLock]),
      };

      const userQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      };

      // Chain the mocks correctly
      let callCount = 0;
      mockDatabase.database = {
        select: () => {
          callCount++;
          if (callCount === 1) return orderQuery;
          if (callCount === 2) return lockCheckQuery;
          return userQuery;
        },
        insert: () => lockInsertQuery,
      } as any;

      mockRedisClient.set.mockResolvedValue('OK'); // Redis lock acquired

      const dto: AcquireLockDto = {
        order_id: mockOrderId,
        session_id: mockSessionId,
      };

      const result = await service.acquireLock(mockUserId, dto);

      expect(result).toMatchObject({
        order_id: mockOrderId,
        locked_by_user_id: mockUserId,
        locked_by_user_name: 'John Doe',
      });
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `order_lock:${mockOrderId}`,
        expect.any(String),
        'EX',
        300,
        'NX',
      );
      expect(mockRealtimeService.broadcastOrderLocked).toHaveBeenCalled();
    });

    it('should throw ConflictException when order is already locked', async () => {
      const mockOrder = { id: mockOrderId };
      const existingLock = {
        id: 'existing-lock-id',
        orderId: mockOrderId,
        lockedByUserId: 'other-user-123',
        lockedBySessionId: 'other-session',
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        lastActivityAt: new Date(),
      };
      const mockUser = { firstName: 'Jane', lastName: 'Smith' };

      const orderQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder]),
      };

      const lockQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([existingLock]),
      };

      const userQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      };

      let callCount = 0;
      mockDatabase.database = {
        select: () => {
          callCount++;
          if (callCount === 1) return orderQuery;
          if (callCount === 2) return lockQuery;
          return userQuery;
        },
      } as any;

      mockRedisClient.set.mockResolvedValue(null); // Redis lock failed

      const dto: AcquireLockDto = {
        order_id: mockOrderId,
        session_id: mockSessionId,
      };

      await expect(service.acquireLock(mockUserId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      const orderQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No order found
      };

      mockDatabase.database = {
        select: () => orderQuery,
      } as any;

      const dto: AcquireLockDto = {
        order_id: mockOrderId,
        session_id: mockSessionId,
      };

      await expect(service.acquireLock(mockUserId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.acquireLock(mockUserId, dto)).rejects.toThrow(
        'Order not found',
      );
    });

    it('should rollback Redis lock on DB error', async () => {
      const mockOrder = { id: mockOrderId };

      const orderQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder]),
      };

      const lockCheckQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      const lockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(new Error('DB connection error')),
      };

      let callCount = 0;
      mockDatabase.database = {
        select: () => {
          callCount++;
          return callCount === 1 ? orderQuery : lockCheckQuery;
        },
        insert: () => lockInsertQuery,
      } as any;

      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.del.mockResolvedValue(1);

      const dto: AcquireLockDto = {
        order_id: mockOrderId,
        session_id: mockSessionId,
      };

      await expect(service.acquireLock(mockUserId, dto)).rejects.toThrow(
        'DB connection error',
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `order_lock:${mockOrderId}`,
      );
    });
  });

  describe('releaseLock', () => {
    it('should successfully release lock owned by user', async () => {
      const mockLock = {
        id: mockLockId,
        orderId: mockOrderId,
        lockedByUserId: mockUserId,
        lockedBySessionId: mockSessionId,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        lastActivityAt: new Date(),
      };

      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockLock]),
      };

      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue({ rowCount: 1 }),
      };

      mockDatabase.database = {
        select: () => selectQuery,
        delete: () => deleteQuery,
      } as any;

      mockRedisClient.del.mockResolvedValue(1);

      await service.releaseLock(mockUserId, mockOrderId);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        `order_lock:${mockOrderId}`,
      );
      expect(mockRealtimeService.broadcastOrderUnlocked).toHaveBeenCalledWith(
        mockOrderId,
      );
    });

    it('should throw NotFoundException when lock not owned by user', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No lock found for user
      };

      mockDatabase.database = {
        select: () => selectQuery,
      } as any;

      await expect(
        service.releaseLock(mockUserId, mockOrderId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.releaseLock(mockUserId, mockOrderId),
      ).rejects.toThrow('No lock found or not owned by current user');
    });
  });

  describe('renewLock', () => {
    it('should successfully renew lock with extended TTL', async () => {
      const mockLock = {
        id: mockLockId,
        orderId: mockOrderId,
        lockedByUserId: mockUserId,
        lockedBySessionId: mockSessionId,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 150000), // 2.5 minutes left
        lastActivityAt: new Date(),
      };

      const updatedLock = {
        ...mockLock,
        expiresAt: new Date(Date.now() + 300000), // Extended to 5 minutes
        lastActivityAt: new Date(),
      };

      const mockUser = { firstName: 'John', lastName: 'Doe' };

      const selectLockQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockLock]),
      };

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([updatedLock]),
      };

      const userQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      };

      let callCount = 0;
      mockDatabase.database = {
        select: () => {
          callCount++;
          return callCount === 1 ? selectLockQuery : userQuery;
        },
        update: () => updateQuery,
      } as any;

      mockRedisClient.expire.mockResolvedValue(1);

      const result = await service.renewLock(mockUserId, mockOrderId);

      expect(result.order_id).toBe(mockOrderId);
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        `order_lock:${mockOrderId}`,
        300,
      );
    });

    it('should throw NotFoundException when lock expired or not found', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No lock found
      };

      mockDatabase.database = {
        select: () => selectQuery,
      } as any;

      await expect(
        service.renewLock(mockUserId, mockOrderId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.renewLock(mockUserId, mockOrderId),
      ).rejects.toThrow('Lock not found or expired');
    });
  });

  describe('getLockStatus', () => {
    it('should return lock status when order is locked', async () => {
      const mockOrder = { id: mockOrderId };
      const mockLock = {
        id: mockLockId,
        orderId: mockOrderId,
        lockedByUserId: mockUserId,
        lockedBySessionId: mockSessionId,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        lastActivityAt: new Date(),
      };
      const mockUser = { firstName: 'John', lastName: 'Doe' };

      let callCount = 0;
      const selectQuery = () => ({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(
          callCount++ === 0 ? [mockOrder] : callCount === 2 ? [mockLock] : [mockUser],
        ),
      });

      mockDatabase.database = {
        select: selectQuery,
      } as any;

      const result = await service.getLockStatus(mockOrderId);

      expect(result).toMatchObject({
        order_id: mockOrderId,
        locked_by_user_id: mockUserId,
        locked_by_user_name: 'John Doe',
      });
    });

    it('should return unlocked status when no lock exists', async () => {
      const mockOrder = { id: mockOrderId };

      let callCount = 0;
      const selectQuery = () => ({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(
          callCount++ === 0 ? [mockOrder] : [],
        ),
      });

      mockDatabase.database = {
        select: selectQuery,
      } as any;

      const result = await service.getLockStatus(mockOrderId);

      expect(result).toEqual({
        order_id: mockOrderId,
        locked: false,
      });
    });

    it('should throw NotFoundException when order does not exist', async () => {
      const selectQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]), // No order found
      };

      mockDatabase.database = {
        select: () => selectQuery,
      } as any;

      await expect(service.getLockStatus(mockOrderId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getLockStatus(mockOrderId)).rejects.toThrow(
        'Order not found',
      );
    });
  });

  describe('cleanupExpired', () => {
    it('should delete expired locks and return count', async () => {
      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue({ rowCount: 5 }),
      };

      mockDatabase.database = {
        delete: () => deleteQuery,
      } as any;

      const count = await service.cleanupExpired();

      expect(count).toBe(5);
    });

    it('should return 0 when no expired locks found', async () => {
      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue({ rowCount: 0 }),
      };

      mockDatabase.database = {
        delete: () => deleteQuery,
      } as any;

      const count = await service.cleanupExpired();

      expect(count).toBe(0);
    });

    it('should handle null rowCount', async () => {
      const deleteQuery = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue({ rowCount: null }),
      };

      mockDatabase.database = {
        delete: () => deleteQuery,
      } as any;

      const count = await service.cleanupExpired();

      expect(count).toBe(0);
    });
  });

  describe('Lock TTL behavior', () => {
    it('should set TTL to 5 minutes (300 seconds)', async () => {
      const mockOrder = { id: mockOrderId };
      const mockUser = { firstName: 'John', lastName: 'Doe' };
      const mockLock = {
        id: mockLockId,
        orderId: mockOrderId,
        lockedByUserId: mockUserId,
        lockedBySessionId: mockSessionId,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 300000),
        lastActivityAt: new Date(),
      };

      const orderQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder]),
      };

      const lockCheckQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      const lockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockLock]),
      };

      const userQuery = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockUser]),
      };

      let callCount = 0;
      mockDatabase.database = {
        select: () => {
          callCount++;
          if (callCount === 1) return orderQuery;
          if (callCount === 2) return lockCheckQuery;
          return userQuery;
        },
        insert: () => lockInsertQuery,
      } as any;

      mockRedisClient.set.mockResolvedValue('OK');

      const dto: AcquireLockDto = {
        order_id: mockOrderId,
        session_id: mockSessionId,
      };

      await service.acquireLock(mockUserId, dto);

      // Verify Redis TTL is 300 seconds
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        300,
        'NX',
      );
    });
  });
});
