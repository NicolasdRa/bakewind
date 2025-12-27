import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { eq, and, lt, gte, or } from 'drizzle-orm';
import * as crypto from 'crypto';
import { DatabaseService } from '../database/database.service';
import { userSessionsTable } from '../database/schemas/user-sessions.schema';
import { usersTable } from '../database/schemas/users.schema';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  role: string;
  subscriptionStatus: string;
  tenantId?: string; // Tenant ID for OWNER/STAFF users
  iat?: number;
  exp?: number;
  iss?: string;
}

export interface CreateSessionData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  dashboardRedirectUrl?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class UserSessionsService {
  private readonly logger = new Logger(UserSessionsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a new session and generate tokens
   */
  async createSession(
    sessionData: CreateSessionData,
    userData: any,
  ): Promise<TokenPair & { sessionId: string }> {
    try {
      // Generate tokens
      const tokens = await this.generateTokenPair(userData);

      // Hash tokens for storage
      const accessTokenHash = this.hashToken(tokens.accessToken);
      const refreshTokenHash = this.hashToken(tokens.refreshToken);

      // Calculate expiration
      const expiresAt = new Date();
      const refreshExpiresIn = this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      );
      const daysToAdd = parseInt(refreshExpiresIn.replace('d', ''), 10);
      expiresAt.setDate(expiresAt.getDate() + daysToAdd);

      // Create session record
      const [session] = await this.databaseService.database
        .insert(userSessionsTable)
        .values({
          userId: sessionData.userId,
          accessTokenHash,
          refreshTokenHash,
          expiresAt,
          ipAddress: sessionData.ipAddress,
          userAgent: sessionData.userAgent,
          dashboardRedirectUrl: sessionData.dashboardRedirectUrl,
          isRevoked: false,
        })
        .returning();

      if (!session) {
        throw new Error('Failed to create session');
      }

      this.logger.log(
        `Created session ${session.id} for user ${sessionData.userId}`,
      );

      return {
        sessionId: session.id,
        ...tokens,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create session for user ${sessionData.userId}:`,
        error,
      );
      throw new BadRequestException('Failed to create session');
    }
  }

  /**
   * Generate JWT token pair
   */
  async generateTokenPair(userData: any): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      businessName: userData.businessName,
      role: userData.role,
      subscriptionStatus: userData.subscriptionStatus,
      tenantId: userData.tenantId, // Include tenantId for OWNER/STAFF users
      iss: 'bakewind-api',
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '15m',
    );
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT secrets not configured');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn,
      }),
      this.jwtService.signAsync(
        { sub: userData.id, type: 'refresh' },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Validate and decode access token
   */
  async validateAccessToken(token: string): Promise<JwtPayload> {
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new UnauthorizedException('JWT secret not configured');
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtSecret,
      });

      // Additional validation
      if (!payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Check if session exists and is not revoked
      const session = await this.findActiveSessionByAccessToken(token);
      if (!session) {
        throw new UnauthorizedException('Session not found or revoked');
      }

      return payload;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Validate and refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');
      if (!refreshSecret) {
        throw new UnauthorizedException('JWT refresh secret not configured');
      }
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });

      // Find session by refresh token
      const session = await this.findActiveSessionByRefreshToken(refreshToken);
      if (!session) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Get user data
      const [user] = await this.databaseService.database
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, payload.sub))
        .limit(1);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new token pair
      const tokens = await this.generateTokenPair(user);

      // Update session with new tokens
      await this.updateSessionTokens(session.id, tokens);

      this.logger.log(`Refreshed tokens for session ${session.id}`);

      return tokens;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Revoke a session (logout)
   */
  async revokeSession(sessionId: string) {
    try {
      const [revokedSession] = await this.databaseService.database
        .update(userSessionsTable)
        .set({
          isRevoked: true,
          lastActivityAt: new Date(),
        })
        .where(
          and(
            eq(userSessionsTable.id, sessionId),
            eq(userSessionsTable.isRevoked, false),
          ),
        )
        .returning({ id: userSessionsTable.id });

      if (!revokedSession) {
        throw new BadRequestException('Session not found or already revoked');
      }

      this.logger.log(`Revoked session ${sessionId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to revoke session ${sessionId}:`, error);
      throw new BadRequestException('Failed to revoke session');
    }
  }

  /**
   * Revoke all sessions for a user (logout all devices)
   */
  async revokeAllUserSessions(userId: string) {
    try {
      await this.databaseService.database
        .update(userSessionsTable)
        .set({
          isRevoked: true,
          lastActivityAt: new Date(),
        })
        .where(
          and(
            eq(userSessionsTable.userId, userId),
            eq(userSessionsTable.isRevoked, false),
          ),
        );

      this.logger.log(`Revoked all sessions for user ${userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to revoke sessions for user ${userId}:`, error);
      throw new BadRequestException('Failed to revoke user sessions');
    }
  }

  /**
   * Find active session by access token
   */
  private async findActiveSessionByAccessToken(token: string) {
    try {
      const tokenHash = this.hashToken(token);
      const now = new Date();

      const [session] = await this.databaseService.database
        .select()
        .from(userSessionsTable)
        .where(
          and(
            eq(userSessionsTable.accessTokenHash, tokenHash),
            eq(userSessionsTable.isRevoked, false),
            gte(userSessionsTable.expiresAt, now),
          ),
        )
        .limit(1);

      if (session) {
        // Update last activity
        await this.updateLastActivity(session.id);
      }

      return session;
    } catch (error) {
      this.logger.error('Failed to find session by access token:', error);
      return null;
    }
  }

  /**
   * Find active session by refresh token
   */
  private async findActiveSessionByRefreshToken(token: string) {
    try {
      const tokenHash = this.hashToken(token);
      const now = new Date();

      const [session] = await this.databaseService.database
        .select()
        .from(userSessionsTable)
        .where(
          and(
            eq(userSessionsTable.refreshTokenHash, tokenHash),
            eq(userSessionsTable.isRevoked, false),
            gte(userSessionsTable.expiresAt, now),
          ),
        )
        .limit(1);

      return session;
    } catch (error) {
      this.logger.error('Failed to find session by refresh token:', error);
      return null;
    }
  }

  /**
   * Find session by ID and access token
   */
  async findSessionByIdAndToken(sessionId: string, accessToken: string) {
    try {
      const tokenHash = this.hashToken(accessToken);
      const now = new Date();

      const [session] = await this.databaseService.database
        .select()
        .from(userSessionsTable)
        .where(
          and(
            eq(userSessionsTable.id, sessionId),
            eq(userSessionsTable.accessTokenHash, tokenHash),
            eq(userSessionsTable.isRevoked, false),
            gte(userSessionsTable.expiresAt, now),
          ),
        )
        .limit(1);

      return session;
    } catch (error) {
      this.logger.error(`Failed to find session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update session tokens after refresh
   */
  private async updateSessionTokens(sessionId: string, tokens: TokenPair) {
    try {
      await this.databaseService.database
        .update(userSessionsTable)
        .set({
          accessTokenHash: this.hashToken(tokens.accessToken),
          refreshTokenHash: this.hashToken(tokens.refreshToken),
          lastActivityAt: new Date(),
        })
        .where(eq(userSessionsTable.id, sessionId));
    } catch (error) {
      this.logger.error(`Failed to update session ${sessionId} tokens:`, error);
      throw new BadRequestException('Failed to update session');
    }
  }

  /**
   * Update session last activity timestamp
   */
  private async updateLastActivity(sessionId: string) {
    try {
      await this.databaseService.database
        .update(userSessionsTable)
        .set({
          lastActivityAt: new Date(),
        })
        .where(eq(userSessionsTable.id, sessionId));
    } catch (error) {
      this.logger.error(
        `Failed to update last activity for session ${sessionId}:`,
        error,
      );
      // Don't throw - this is not critical
    }
  }

  /**
   * Clean up expired or revoked sessions
   */
  async cleanupExpiredSessions() {
    try {
      const now = new Date();
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() - 30); // Clean up sessions older than 30 days

      await this.databaseService.database
        .delete(userSessionsTable)
        .where(
          or(
            lt(userSessionsTable.expiresAt, now),
            and(
              eq(userSessionsTable.isRevoked, true),
              lt(userSessionsTable.lastActivityAt, cleanupDate),
            ),
          ),
        );

      this.logger.log('Cleaned up expired sessions');
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: string) {
    try {
      const now = new Date();

      const sessions = await this.databaseService.database
        .select({
          id: userSessionsTable.id,
          ipAddress: userSessionsTable.ipAddress,
          userAgent: userSessionsTable.userAgent,
          createdAt: userSessionsTable.createdAt,
          lastActivityAt: userSessionsTable.lastActivityAt,
          expiresAt: userSessionsTable.expiresAt,
        })
        .from(userSessionsTable)
        .where(
          and(
            eq(userSessionsTable.userId, userId),
            eq(userSessionsTable.isRevoked, false),
            gte(userSessionsTable.expiresAt, now),
          ),
        );

      return sessions;
    } catch (error) {
      this.logger.error(
        `Failed to get active sessions for user ${userId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Hash token for secure storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics() {
    try {
      const now = new Date();

      const [active, revoked, expired] = await Promise.all([
        this.databaseService.database
          .select({ count: userSessionsTable.id })
          .from(userSessionsTable)
          .where(
            and(
              eq(userSessionsTable.isRevoked, false),
              gte(userSessionsTable.expiresAt, now),
            ),
          ),
        this.databaseService.database
          .select({ count: userSessionsTable.id })
          .from(userSessionsTable)
          .where(eq(userSessionsTable.isRevoked, true)),
        this.databaseService.database
          .select({ count: userSessionsTable.id })
          .from(userSessionsTable)
          .where(lt(userSessionsTable.expiresAt, now)),
      ]);

      return {
        active: active.length,
        revoked: revoked.length,
        expired: expired.length,
      };
    } catch (error) {
      this.logger.error('Failed to get session statistics:', error);
      return { active: 0, revoked: 0, expired: 0 };
    }
  }
}
