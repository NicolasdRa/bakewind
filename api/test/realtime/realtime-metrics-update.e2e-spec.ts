import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeModule } from '../../src/realtime/realtime.module';
import { RealtimeService } from '../../src/realtime/realtime.service';

/**
 * T019: WebSocket test - metrics:update emission
 * Tests that server pushes metric updates to user dashboard rooms
 * and clients receive delta updates
 */
describe('Realtime Gateway - Metrics Update (T019)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let realtimeService: RealtimeService;
  let clientSocket: Socket;
  let validToken: string;
  const testUserId = 'test-user-789';

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

    // Generate valid JWT token
    validToken = await jwtService.signAsync(
      {
        sub: testUserId,
        email: 'test@example.com',
        role: 'user',
      },
      { secret: 'test-secret' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Metrics broadcasting to user room', () => {
    it('should receive metrics:update event after joining dashboard room', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        // Join dashboard room
        clientSocket.emit('dashboard:join', { userId: testUserId });
      });

      clientSocket.on('dashboard:joined', () => {
        // Simulate server broadcasting metrics
        const deltaMetrics = {
          total_orders: 150,
          pending_orders: 12,
          revenue_today: 3450.50,
        };

        realtimeService.broadcastMetrics(testUserId, deltaMetrics);
      });

      clientSocket.on('metrics:update', (data) => {
        expect(data).toMatchObject({
          metrics: {
            total_orders: 150,
            pending_orders: 12,
            revenue_today: 3450.50,
          },
        });
        expect(data.timestamp).toBeDefined();
        expect(typeof data.timestamp).toBe('string');
        done();
      });
    });

    it('should receive delta updates with only changed metrics', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('dashboard:join', { userId: testUserId });
      });

      clientSocket.on('dashboard:joined', () => {
        // Broadcast delta with only one metric changed
        const deltaMetrics = {
          pending_orders: 15, // Only pending orders changed
        };

        realtimeService.broadcastMetrics(testUserId, deltaMetrics);
      });

      clientSocket.on('metrics:update', (data) => {
        expect(data.metrics).toEqual({
          pending_orders: 15,
        });
        // Should not include other metrics
        expect(data.metrics.total_orders).toBeUndefined();
        expect(data.metrics.revenue_today).toBeUndefined();
        done();
      });
    });

    it('should handle multiple metric types', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('dashboard:join', { userId: testUserId });
      });

      clientSocket.on('dashboard:joined', () => {
        const allMetrics = {
          total_orders: 200,
          pending_orders: 10,
          revenue_today: 5000,
          low_stock_items: 3,
          active_production_batches: 5,
        };

        realtimeService.broadcastMetrics(testUserId, allMetrics);
      });

      clientSocket.on('metrics:update', (data) => {
        expect(data.metrics).toEqual({
          total_orders: 200,
          pending_orders: 10,
          revenue_today: 5000,
          low_stock_items: 3,
          active_production_batches: 5,
        });
        done();
      });
    });
  });

  describe('Metrics isolation between users', () => {
    it('should only receive metrics for own user room', (done) => {
      const port = app.getHttpServer().address().port;

      // Create client for testUserId
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      let receivedMetrics = false;

      clientSocket.on('connect', () => {
        clientSocket.emit('dashboard:join', { userId: testUserId });
      });

      clientSocket.on('dashboard:joined', () => {
        // Broadcast metrics to different user
        realtimeService.broadcastMetrics('other-user-999', {
          total_orders: 100,
        });

        // Wait a bit to ensure no message is received
        setTimeout(() => {
          expect(receivedMetrics).toBe(false);
          done();
        }, 200);
      });

      clientSocket.on('metrics:update', () => {
        receivedMetrics = true;
        done(new Error('Should not receive metrics for different user'));
      });
    });
  });

  describe('Metrics throttling', () => {
    it('should throttle rapid metric updates (max 1 per second)', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      let updateCount = 0;

      clientSocket.on('connect', () => {
        clientSocket.emit('dashboard:join', { userId: testUserId });
      });

      clientSocket.on('dashboard:joined', () => {
        // Rapidly broadcast 5 updates
        for (let i = 0; i < 5; i++) {
          realtimeService.broadcastMetrics(testUserId, {
            total_orders: 100 + i,
          });
        }

        // Wait 1.5 seconds to check throttling
        setTimeout(() => {
          // Should receive only 1 or 2 updates due to throttling
          expect(updateCount).toBeLessThan(5);
          expect(updateCount).toBeGreaterThan(0);
          done();
        }, 1500);
      });

      clientSocket.on('metrics:update', () => {
        updateCount++;
      });
    });
  });

  describe('Metrics updates without joining room', () => {
    it('should not receive metrics if not joined dashboard room', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      let receivedMetrics = false;

      clientSocket.on('connect', () => {
        // Don't join room, just broadcast metrics
        realtimeService.broadcastMetrics(testUserId, {
          total_orders: 100,
        });

        // Wait to ensure no message received
        setTimeout(() => {
          expect(receivedMetrics).toBe(false);
          done();
        }, 200);
      });

      clientSocket.on('metrics:update', () => {
        receivedMetrics = true;
        done(new Error('Should not receive metrics without joining room'));
      });
    });
  });
});
