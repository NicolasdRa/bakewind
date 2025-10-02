import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeModule } from '../../src/realtime/realtime.module';

/**
 * T018: WebSocket test - dashboard:join event
 * Tests that clients can join user-specific dashboard rooms
 * and receive join acknowledgments
 */
describe('Realtime Gateway - Dashboard Join (T018)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let clientSocket: Socket;
  let validToken: string;
  const testUserId = 'test-user-456';

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

  describe('Successful dashboard room join', () => {
    it('should join user-specific dashboard room', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        // Emit dashboard:join event
        clientSocket.emit('dashboard:join', { userId: testUserId });
      });

      clientSocket.on('dashboard:joined', (data) => {
        expect(data).toMatchObject({
          room: `dashboard:${testUserId}`,
        });
        expect(data.timestamp).toBeDefined();
        expect(typeof data.timestamp).toBe('string');
        done();
      });

      clientSocket.on('error', (error) => {
        done(new Error(`Unexpected error: ${JSON.stringify(error)}`));
      });
    });

    it('should allow client to join own dashboard room', (done) => {
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

      clientSocket.on('dashboard:joined', (data) => {
        expect(data.room).toBe(`dashboard:${testUserId}`);
        done();
      });
    });
  });

  describe('Unauthorized dashboard room join', () => {
    it('should reject join attempt for different user room', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        // Try to join another user's room
        clientSocket.emit('dashboard:join', { userId: 'other-user-123' });
      });

      clientSocket.on('error', (error) => {
        expect(error).toEqual({
          code: 'INVALID_EVENT',
          message: 'Cannot join room for different user',
        });
        done();
      });

      clientSocket.on('dashboard:joined', () => {
        done(new Error('Should not be able to join another user\'s room'));
      });
    });

    it('should reject join attempt without authentication', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      // Connection will fail, so we expect error
      clientSocket.on('error', (error) => {
        expect(error.code).toBe('AUTH_FAILED');
        done();
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect without authentication'));
      });
    });
  });

  describe('Multiple room joins', () => {
    it('should allow same client to join room multiple times', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      let joinCount = 0;

      clientSocket.on('connect', () => {
        // Join the same room twice
        clientSocket.emit('dashboard:join', { userId: testUserId });
      });

      clientSocket.on('dashboard:joined', (data) => {
        joinCount++;
        expect(data.room).toBe(`dashboard:${testUserId}`);

        if (joinCount === 1) {
          // Join again
          clientSocket.emit('dashboard:join', { userId: testUserId });
        } else if (joinCount === 2) {
          // Successfully joined twice
          done();
        }
      });
    });
  });

  describe('Room validation', () => {
    it('should validate userId format in join request', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        // Emit with malformed payload
        clientSocket.emit('dashboard:join', { wrongField: 'value' });
      });

      // Since userId won't match (undefined !== testUserId), should get error
      clientSocket.on('error', (error) => {
        expect(error.code).toBe('INVALID_EVENT');
        done();
      });

      clientSocket.on('dashboard:joined', () => {
        done(new Error('Should not join with invalid payload'));
      });
    });
  });
});
