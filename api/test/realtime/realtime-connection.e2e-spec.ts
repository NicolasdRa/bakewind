import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { RealtimeGateway } from '../../src/realtime/realtime.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeModule } from '../../src/realtime/realtime.module';

/**
 * T017: WebSocket test - connection with JWT auth
 * Tests that clients can connect with valid JWT token
 * and are rejected with invalid or missing token
 */
describe('Realtime Gateway - Connection (T017)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let clientSocket: Socket;
  let validToken: string;
  const testUserId = 'test-user-123';

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
    await app.listen(0); // Random available port

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

  describe('Valid JWT authentication', () => {
    it('should accept connection with valid JWT token in auth object', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('error', (error) => {
        done(new Error(`Connection error: ${JSON.stringify(error)}`));
      });
    });

    it('should receive connection:status event on successful connection', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: validToken,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connection:status', (data) => {
        expect(data).toEqual({
          status: 'connected',
          message: 'Successfully connected to real-time server',
        });
        done();
      });
    });
  });

  describe('Invalid JWT authentication', () => {
    it('should reject connection with missing token', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('error', (error) => {
        expect(error).toEqual({
          code: 'AUTH_FAILED',
          message: 'Authentication token required',
        });
        // Connection should be closed
        setTimeout(() => {
          expect(clientSocket.connected).toBe(false);
          done();
        }, 100);
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect without token'));
      });
    });

    it('should reject connection with invalid token', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        auth: {
          token: 'invalid-token-12345',
        },
        transports: ['websocket'],
      });

      clientSocket.on('error', (error) => {
        expect(error).toEqual({
          code: 'AUTH_FAILED',
          message: 'Invalid or expired authentication token',
        });
        setTimeout(() => {
          expect(clientSocket.connected).toBe(false);
          done();
        }, 100);
      });

      clientSocket.on('connect', () => {
        done(new Error('Should not connect with invalid token'));
      });
    });

    it('should reject connection with expired token', async () => {
      const expiredToken = await jwtService.signAsync(
        {
          sub: testUserId,
          email: 'test@example.com',
          role: 'user',
        },
        { secret: 'test-secret', expiresIn: '-1h' }, // Expired 1 hour ago
      );

      return new Promise<void>((resolve, reject) => {
        const port = app.getHttpServer().address().port;
        clientSocket = io(`http://localhost:${port}`, {
          auth: {
            token: expiredToken,
          },
          transports: ['websocket'],
        });

        clientSocket.on('error', (error) => {
          expect(error).toEqual({
            code: 'AUTH_FAILED',
            message: 'Invalid or expired authentication token',
          });
          setTimeout(() => {
            expect(clientSocket.connected).toBe(false);
            resolve();
          }, 100);
        });

        clientSocket.on('connect', () => {
          reject(new Error('Should not connect with expired token'));
        });
      });
    });
  });

  describe('Alternative authentication methods', () => {
    it('should accept connection with token in Authorization header', (done) => {
      const port = app.getHttpServer().address().port;
      clientSocket = io(`http://localhost:${port}`, {
        extraHeaders: {
          authorization: `Bearer ${validToken}`,
        },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('error', (error) => {
        done(new Error(`Connection error: ${JSON.stringify(error)}`));
      });
    });
  });
});
