import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeModule } from '../../src/realtime/realtime.module';
import { RealtimeService } from '../../src/realtime/realtime.service';

/**
 * T020: WebSocket test - order:locked notification
 * Tests that all clients are notified when an order is locked
 * with OrderLock payload details
 */
describe('Realtime Gateway - Order Locked (T020)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let realtimeService: RealtimeService;
  let client1Socket: Socket;
  let client2Socket: Socket;
  let validToken1: string;
  let validToken2: string;
  const testUserId1 = 'user-001';
  const testUserId2 = 'user-002';
  const testOrderId = 'order-12345';

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

  describe('Order lock notification broadcast', () => {
    it('should broadcast order:locked event to all connected clients', (done) => {
      const port = app.getHttpServer().address().port;

      // Connect first client
      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      // Connect second client
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
        // After both connected, broadcast lock
        if (client2Socket.connected) {
          const lockInfo = {
            order_id: testOrderId,
            locked_by_user_id: testUserId1,
            locked_by_user_name: 'User One',
            locked_at: new Date().toISOString(),
          };

          realtimeService.broadcastOrderLocked(lockInfo);
        }
      });

      client2Socket.on('connect', () => {
        // After both connected, broadcast lock
        if (client1Socket.connected) {
          const lockInfo = {
            order_id: testOrderId,
            locked_by_user_id: testUserId1,
            locked_by_user_name: 'User One',
            locked_at: new Date().toISOString(),
          };

          realtimeService.broadcastOrderLocked(lockInfo);
        }
      });

      client1Socket.on('order:locked', (data) => {
        expect(data).toMatchObject({
          order_id: testOrderId,
          locked_by_user_id: testUserId1,
          locked_by_user_name: 'User One',
        });
        expect(data.locked_at).toBeDefined();
        client1Received = true;
        checkBothReceived();
      });

      client2Socket.on('order:locked', (data) => {
        expect(data).toMatchObject({
          order_id: testOrderId,
          locked_by_user_id: testUserId1,
          locked_by_user_name: 'User One',
        });
        expect(data.locked_at).toBeDefined();
        client2Received = true;
        checkBothReceived();
      });
    });

    it('should include complete OrderLock payload', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      client1Socket.on('connect', () => {
        const lockInfo = {
          order_id: testOrderId,
          locked_by_user_id: testUserId2,
          locked_by_user_name: 'Jane Doe',
          locked_at: '2025-09-30T10:00:00Z',
        };

        realtimeService.broadcastOrderLocked(lockInfo);
      });

      client1Socket.on('order:locked', (data) => {
        expect(data).toEqual({
          order_id: testOrderId,
          locked_by_user_id: testUserId2,
          locked_by_user_name: 'Jane Doe',
          locked_at: '2025-09-30T10:00:00Z',
        });
        done();
      });
    });
  });

  describe('Order lock notification to user who locked', () => {
    it('should also notify the user who acquired the lock', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      client1Socket.on('connect', () => {
        const lockInfo = {
          order_id: testOrderId,
          locked_by_user_id: testUserId1, // Same user
          locked_by_user_name: 'User One',
          locked_at: new Date().toISOString(),
        };

        realtimeService.broadcastOrderLocked(lockInfo);
      });

      client1Socket.on('order:locked', (data) => {
        expect(data.locked_by_user_id).toBe(testUserId1);
        expect(data.locked_by_user_name).toBe('User One');
        done();
      });
    });
  });

  describe('Multiple order locks', () => {
    it('should handle multiple order lock notifications', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      const receivedOrders: string[] = [];
      const expectedOrders = ['order-001', 'order-002', 'order-003'];

      client1Socket.on('connect', () => {
        // Broadcast locks for multiple orders
        expectedOrders.forEach((orderId) => {
          realtimeService.broadcastOrderLocked({
            order_id: orderId,
            locked_by_user_id: testUserId1,
            locked_by_user_name: 'User One',
            locked_at: new Date().toISOString(),
          });
        });
      });

      client1Socket.on('order:locked', (data) => {
        receivedOrders.push(data.order_id);

        if (receivedOrders.length === expectedOrders.length) {
          expect(receivedOrders).toEqual(expectedOrders);
          done();
        }
      });
    });
  });

  describe('Lock notification timing', () => {
    it('should receive notification immediately after lock acquisition', (done) => {
      const port = app.getHttpServer().address().port;

      client1Socket = io(`http://localhost:${port}`, {
        auth: { token: validToken1 },
        transports: ['websocket'],
      });

      client1Socket.on('connect', () => {
        const startTime = Date.now();

        realtimeService.broadcastOrderLocked({
          order_id: testOrderId,
          locked_by_user_id: testUserId1,
          locked_by_user_name: 'User One',
          locked_at: new Date().toISOString(),
        });

        client1Socket.on('order:locked', () => {
          const latency = Date.now() - startTime;
          // Should be very fast (< 100ms)
          expect(latency).toBeLessThan(100);
          done();
        });
      });
    });
  });

  describe('Lock notification without connection', () => {
    it('should not error when broadcasting to no connected clients', () => {
      // Don't connect any clients
      // Should not throw error
      expect(() => {
        realtimeService.broadcastOrderLocked({
          order_id: testOrderId,
          locked_by_user_id: testUserId1,
          locked_by_user_name: 'User One',
          locked_at: new Date().toISOString(),
        });
      }).not.toThrow();
    });
  });
});
