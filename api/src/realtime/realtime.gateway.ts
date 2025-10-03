import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  role?: string;
}

interface DashboardJoinPayload {
  userId: string;
}

interface HeartbeatPayload {
  timestamp: string;
  active_order_locks?: string[];
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_ORIGIN || 'http://localhost:3001',
      'http://localhost:3000', // Customer app
      'http://localhost:5173', // Vite dev server
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Extract JWT token from handshake auth
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connection rejected: No token`);
        client.emit('error', {
          code: 'AUTH_FAILED',
          message: 'Authentication token required',
        });
        client.disconnect();
        return;
      }

      // Verify JWT token
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        });

        // Attach user info to socket
        client.userId = payload.sub;
        client.email = payload.email;
        client.role = payload.role;

        this.logger.log(
          `Client ${client.id} connected (user: ${client.userId})`,
        );

        // Emit connection status
        client.emit('connection:status', {
          status: 'connected',
          message: 'Successfully connected to real-time server',
        });
      } catch (error) {
        this.logger.warn(
          `Client ${client.id} connection rejected: Invalid token`,
        );
        client.emit('error', {
          code: 'AUTH_FAILED',
          message: 'Invalid or expired authentication token',
        });
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Error during client ${client.id} connection:`, error);
      client.emit('error', {
        code: 'SERVER_ERROR',
        message: 'Internal server error during connection',
      });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(
      `Client ${client.id} disconnected (user: ${client.userId || 'unknown'})`,
    );
  }

  @SubscribeMessage('dashboard:join')
  handleDashboardJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: DashboardJoinPayload,
  ): void {
    if (!client.userId) {
      client.emit('error', {
        code: 'AUTH_FAILED',
        message: 'User not authenticated',
      });
      return;
    }

    // Validate that user can only join their own room
    if (payload.userId !== client.userId) {
      this.logger.warn(
        `Client ${client.id} attempted to join room for different user`,
      );
      client.emit('error', {
        code: 'INVALID_EVENT',
        message: 'Cannot join room for different user',
      });
      return;
    }

    const roomName = `dashboard:${payload.userId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room: ${roomName}`);

    // Acknowledge join
    client.emit('dashboard:joined', {
      room: roomName,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: HeartbeatPayload,
  ): void {
    if (!client.userId) {
      return;
    }

    // Log heartbeat (could be used for connection health monitoring)
    this.logger.debug(
      `Heartbeat from client ${client.id} (user: ${client.userId})`,
    );

    // Acknowledge heartbeat
    client.emit('heartbeat:ack', {
      timestamp: new Date().toISOString(),
    });

    // If client has active order locks, this could trigger lock renewal
    // This would be handled by the OrderLocksService integration
    if (payload.active_order_locks && payload.active_order_locks.length > 0) {
      this.logger.debug(
        `Client ${client.id} has ${payload.active_order_locks.length} active locks`,
      );
    }
  }

  /**
   * Emit event to specific user's dashboard room
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    const roomName = `dashboard:${userId}`;
    this.server.to(roomName).emit(event, data);
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll(event: string, data: unknown): void {
    this.server.emit(event, data);
  }

  /**
   * Get number of connected clients in a room
   */
  async getRoomSize(roomName: string): Promise<number> {
    const sockets = await this.server.in(roomName).fetchSockets();
    return sockets.length;
  }
}
