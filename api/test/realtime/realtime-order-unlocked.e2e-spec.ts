import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeModule } from '../../src/realtime/realtime.module';
import { RealtimeService } from '../../src/realtime/realtime.service';

/**
 * T021: WebSocket test - order:unlocked notification
 * Tests that all clients are notified when an order is unlocked
 * with order_id in payload
 */
describe('Realtime Gateway - Order Unlocked (T021)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let realtimeService: RealtimeService;
  let client1Socket: Socket;
  let client2Socket: Socket;
  let validToken1: string;
  let validToken2: string;
  const testUserId1 = 'user-101';
  const testUserId2 = 'user-102';
  const testOrderId = 'order-67890';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RealtimeModule],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              return undefined;
            }),
            getOrThrow: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              throw new Error(`Config ${key} not found`);
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    realtimeService = moduleFixture.get<RealtimeService>(RealtimeService);

    await app.init();
    await app.listen(0);

    // Generate valid JWT tokens for two users
    validToken1 = await jwtService.signAsync(
      {
        sub: testUserId1,
        email: 'user1@example.com',
        role: 'user',
      },
      { secret: 'test-secret' },
    );

    validToken2 = await jwtService.signAsync(
      {
        sub: testUserId2,
        email: 'user2@example.com',
        role: 'user',
      },
      { secret: 'test-secret' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    if (client1Socket && client1Socket.connected) {
      client1Socket.disconnect();
    }
    if (client2Socket && client2Socket.connected) {
      client2Socket.disconnect();
    }
  });

  describe('Order unlock notification broadcast', () => {
    it('should broadcast order:unlocked event to all connected clients', (done) => {
      const port = app.getHttpServer().address().port;

      // Connect two clients
      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      client2Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken2 },
        transports: ['websocket'],
      });

      let client1Received = false;
      let client2Received = false;

      const checkBothReceived = () => {
        if (client1Received && client2Received) {
          done();
        }
      };

      client1Socket.on('connect', () => {
        if (client2Socket.connected) {
          realtimeService.broadcastOrderUnlocked(testOrderId);
        }
      });

      client2Socket.on('connect', () => {
        if (client1Socket.connected) {
          realtimeService.broadcastOrderUnlocked(testOrderId);
        }
      });

      client1Socket.on('order:unlocked', (data) => {
        expect(data).toEqual({
          order_id: testOrderId,
        });
        client1Received = true;
        checkBothReceived();
      });

      client2Socket.on('order:unlocked', (data) => {
        expect(data).toEqual({
          order_id: testOrderId,
        });
        client2Received = true;
        checkBothReceived();
      });
    });

    it('should include only order_id in payload', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      client1Socket.on('connect', () => {
        realtimeService.broadcastOrderUnlocked(testOrderId);
      });

      client1Socket.on('order:unlocked', (data) => {
        expect(data).toEqual({
          order_id: testOrderId,
        });
        // Should not include locked_by or other fields
        expect(data.locked_by_user_id).toBeUndefined();
        expect(data.locked_by_user_name).toBeUndefined();
        expect(data.locked_at).toBeUndefined();
        done();
      });
    });
  });

  describe('Lock/unlock sequence', () => {
    it('should handle lock followed by unlock sequence', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      const events: string[] = [];

      client1Socket.on('connect', () => {
        // First lock the order
        realtimeService.broadcastOrderLocked({
          order_id: testOrderId,
          locked_by_user_id: testUserId1,
          locked_by_user_name: 'User One',
          locked_at: new Date().toISOString(),
        });

        // Then unlock after a short delay
        setTimeout(() => {
          realtimeService.broadcastOrderUnlocked(testOrderId);
        }, 100);
      });

      client1Socket.on('order:locked', (data) => {
        events.push('locked');
        expect(data.order_id).toBe(testOrderId);
      });

      client1Socket.on('order:unlocked', (data) => {
        events.push('unlocked');
        expect(data.order_id).toBe(testOrderId);

        // Verify sequence
        expect(events).toEqual(['locked', 'unlocked']);
        done();
      });
    });
  });

  describe('Multiple order unlocks', () => {
    it('should handle multiple order unlock notifications', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      const unlockedOrders: string[] = [];
      const expectedOrders = ['order-201', 'order-202', 'order-203'];

      client1Socket.on('connect', () => {
        // Broadcast unlocks for multiple orders
        expectedOrders.forEach((orderId) => {
          realtimeService.broadcastOrderUnlocked(orderId);
        });
      });

      client1Socket.on('order:unlocked', (data) => {
        unlockedOrders.push(data.order_id);

        if (unlockedOrders.length === expectedOrders.length) {
          expect(unlockedOrders).toEqual(expectedOrders);
          done();
        }
      });
    });
  });

  describe('Unlock notification to different users', () => {
    it('should notify all users regardless of who locked the order', (done) => {
      const port = app.getHttpServer().address().port;

      // User 2's client (didn't lock the order)
      client2Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken2 },
        transports: ['websocket'],
      });

      client2Socket.on('connect', () => {
        // Unlock order that was locked by user 1
        realtimeService.broadcastOrderUnlocked(testOrderId);
      });

      client2Socket.on('order:unlocked', (data) => {
        expect(data.order_id).toBe(testOrderId);
        // User 2 should still receive the notification
        done();
      });
    });
  });

  describe('Unlock notification timing', () => {
    it('should receive unlock notification immediately', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      client1Socket.on('connect', () => {
        const startTime = Date.now();

        realtimeService.broadcastOrderUnlocked(testOrderId);

        client1Socket.on('order:unlocked', () => {
          const latency = Date.now() - startTime;
          // Should be very fast (< 100ms)
          expect(latency).toBeLessThan(100);
          done();
        });
      });
    });
  });

  describe('Unlock notification reliability', () => {
    it('should not error when broadcasting to no connected clients', () => {
      // Don't connect any clients
      // Should not throw error
      expect(() => {
        realtimeService.broadcastOrderUnlocked(testOrderId);
      }).not.toThrow();
    });

    it('should handle unlock for non-existent order gracefully', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      client1Socket.on('connect', () => {
        // Unlock order that was never locked
        realtimeService.broadcastOrderUnlocked('non-existent-order-999');
      });

      client1Socket.on('order:unlocked', (data) => {
        expect(data.order_id).toBe('non-existent-order-999');
        // Should still receive notification
        done();
      });
    });
  });

  describe('Rapid lock/unlock cycles', () => {
    it('should handle rapid lock/unlock cycles correctly', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      const events: Array<{ type: string; orderId: string }> = [];
      const expectedEvents = 6; // 3 lock + 3 unlock

      client1Socket.on('connect', () => {
        // Rapid lock/unlock cycles for same order
        for (let i = 0; i < 3; i++) {
          realtimeService.broadcastOrderLocked({
            order_id: testOrderId,
            locked_by_user_id: testUserId1,
            locked_by_user_name: 'User One',
            locked_at: new Date().toISOString(),
          });

          realtimeService.broadcastOrderUnlocked(testOrderId);
        }
      });

      client1Socket.on('order:locked', (data) => {
        events.push({ type: 'locked', orderId: data.order_id });
        if (events.length === expectedEvents) {
          // Verify alternating pattern
          expect(events.filter(e => e.type === 'locked').length).toBe(3);
          expect(events.filter(e => e.type === 'unlocked').length).toBe(3);
          done();
        }
      });

      client1Socket.on('order:unlocked', (data) => {
        events.push({ type: 'unlocked', orderId: data.order_id });
        if (events.length === expectedEvents) {
          expect(events.filter(e => e.type === 'locked').length).toBe(3);
          expect(events.filter(e => e.type === 'unlocked').length).toBe(3);
          done();
        }
      });
    });
  });
});
