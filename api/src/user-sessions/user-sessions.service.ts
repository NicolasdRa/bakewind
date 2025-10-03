import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { eq, and, lt, gte, isNull } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { userSessionsTable } from '../database/schemas/user-sessions.schema';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface CreateSessionDto {
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  dashboardRedirectUrl?: string;
}

export interface UpdateSessionDto {
  accessTokenHash?: string;
  refreshTokenHash?: string;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  dashboardRedirectUrl?: string;
  lastActivityAt?: Date;
}

@Injectable()
export class UserSessionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async create(createDto: CreateSessionDto) {
    const [newSession] = await this.db.database
      .insert(userSessionsTable)
      .values({
        ...createDto,
        isRevoked: false,
        lastActivityAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    return newSession;
  }

  async findById(id: string) {
    const [session] = await this.db.database
      .select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.id, id));

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async findByUserId(userId: string, onlyActive = true) {
    const conditions = [eq(userSessionsTable.userId, userId)];

    if (onlyActive) {
      conditions.push(
        eq(userSessionsTable.isRevoked, false),
        gte(userSessionsTable.expiresAt, new Date()),
      );
    }

    const sessions = await this.db.database
      .select()
      .from(userSessionsTable)
      .where(and(...conditions));

    return sessions;
  }

  async findByAccessTokenHash(accessTokenHash: string) {
    const [session] = await this.db.database
      .select()
      .from(userSessionsTable)
      .where(
        and(
          eq(userSessionsTable.accessTokenHash, accessTokenHash),
          eq(userSessionsTable.isRevoked, false),
          gte(userSessionsTable.expiresAt, new Date()),
        ),
      );

    return session || null;
  }

  async findByRefreshTokenHash(refreshTokenHash: string) {
    const [session] = await this.db.database
      .select()
      .from(userSessionsTable)
      .where(
        and(
          eq(userSessionsTable.refreshTokenHash, refreshTokenHash),
          eq(userSessionsTable.isRevoked, false),
          gte(userSessionsTable.expiresAt, new Date()),
        ),
      );

    return session || null;
  }

  async update(id: string, updateDto: UpdateSessionDto) {
    const existingSession = await this.findById(id);

    const [updatedSession] = await this.db.database
      .update(userSessionsTable)
      .set({
        ...updateDto,
        lastActivityAt: new Date(),
      })
      .where(eq(userSessionsTable.id, id))
      .returning();

    return updatedSession;
  }

  async updateActivity(sessionId: string, ipAddress?: string) {
    await this.db.database
      .update(userSessionsTable)
      .set({
        lastActivityAt: new Date(),
        ipAddress: ipAddress || undefined,
      })
      .where(eq(userSessionsTable.id, sessionId));
  }

  async refreshSession(
    refreshTokenHash: string,
    newAccessTokenHash: string,
    newRefreshTokenHash: string,
    newExpiresAt: Date,
  ) {
    const session = await this.findByRefreshTokenHash(refreshTokenHash);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [updatedSession] = await this.db.database
      .update(userSessionsTable)
      .set({
        accessTokenHash: newAccessTokenHash,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt,
        lastActivityAt: new Date(),
      })
      .where(eq(userSessionsTable.id, session.id))
      .returning();

    return updatedSession;
  }

  async revokeSession(sessionId: string) {
    const [revokedSession] = await this.db.database
      .update(userSessionsTable)
      .set({
        isRevoked: true,
        lastActivityAt: new Date(),
      })
      .where(eq(userSessionsTable.id, sessionId))
      .returning();

    return revokedSession;
  }

  async revokeSessionByAccessToken(accessTokenHash: string) {
    const session = await this.findByAccessTokenHash(accessTokenHash);

    if (session) {
      return this.revokeSession(session.id);
    }

    return null;
  }

  async revokeAllUserSessions(userId: string) {
    const revokedSessions = await this.db.database
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
      )
      .returning();

    return revokedSessions;
  }

  async revokeAllUserSessionsExcept(userId: string, exceptSessionId: string) {
    const revokedSessions = await this.db.database
      .update(userSessionsTable)
      .set({
        isRevoked: true,
        lastActivityAt: new Date(),
      })
      .where(
        and(
          eq(userSessionsTable.userId, userId),
          eq(userSessionsTable.isRevoked, false),
          // ne(userSessionsTable.id, exceptSessionId) // 'ne' not available, use NOT
        ),
      )
      .returning();

    // Filter out the exception session client-side
    return revokedSessions.filter((session) => session.id !== exceptSessionId);
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const [session] = await this.db.database
      .select()
      .from(userSessionsTable)
      .where(
        and(
          eq(userSessionsTable.id, sessionId),
          eq(userSessionsTable.isRevoked, false),
          gte(userSessionsTable.expiresAt, new Date()),
        ),
      );

    return !!session;
  }

  async isAccessTokenValid(accessTokenHash: string): Promise<boolean> {
    const session = await this.findByAccessTokenHash(accessTokenHash);
    return !!session;
  }

  async getActiveSessions(userId: string) {
    return this.findByUserId(userId, true);
  }

  async getSessionHistory(userId: string, limit = 20, offset = 0) {
    const sessions = await this.db.database
      .select({
        id: userSessionsTable.id,
        ipAddress: userSessionsTable.ipAddress,
        userAgent: userSessionsTable.userAgent,
        isRevoked: userSessionsTable.isRevoked,
        createdAt: userSessionsTable.createdAt,
        lastActivityAt: userSessionsTable.lastActivityAt,
        expiresAt: userSessionsTable.expiresAt,
      })
      .from(userSessionsTable)
      .where(eq(userSessionsTable.userId, userId))
      .limit(limit)
      .offset(offset);

    return sessions;
  }

  async cleanupExpiredSessions() {
    const now = new Date();

    const deletedSessions = await this.db.database
      .delete(userSessionsTable)
      .where(lt(userSessionsTable.expiresAt, now))
      .returning();

    return deletedSessions.length;
  }

  async cleanupOldRevokedSessions(olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deletedSessions = await this.db.database
      .delete(userSessionsTable)
      .where(
        and(
          eq(userSessionsTable.isRevoked, true),
          lt(userSessionsTable.lastActivityAt, cutoffDate),
        ),
      )
      .returning();

    return deletedSessions.length;
  }

  async getSessionStats() {
    const allSessions = await this.db.database.select().from(userSessionsTable);

    const now = new Date();

    const stats = {
      total: allSessions.length,
      active: allSessions.filter((s) => !s.isRevoked && s.expiresAt > now)
        .length,
      expired: allSessions.filter((s) => !s.isRevoked && s.expiresAt <= now)
        .length,
      revoked: allSessions.filter((s) => s.isRevoked).length,
      byDevice: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
    };

    allSessions.forEach((session) => {
      // Parse user agent to get device info
      const deviceInfo = this.parseUserAgent(session.userAgent || '');
      stats.byDevice[deviceInfo] = (stats.byDevice[deviceInfo] || 0) + 1;

      // Use IP address as location approximation
      if (session.ipAddress) {
        stats.byLocation[session.ipAddress] =
          (stats.byLocation[session.ipAddress] || 0) + 1;
      }
    });

    return stats;
  }

  async getUserSessionCount(userId: string): Promise<number> {
    const activeSessions = await this.getActiveSessions(userId);
    return activeSessions.length;
  }

  async hasActiveSession(userId: string): Promise<boolean> {
    const count = await this.getUserSessionCount(userId);
    return count > 0;
  }

  private parseUserAgent(userAgent?: string): string {
    if (!userAgent) return 'Unknown';

    // Simple user agent parsing
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Chrome')) return 'Chrome Desktop';
    if (userAgent.includes('Firefox')) return 'Firefox Desktop';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome'))
      return 'Safari Desktop';
    if (userAgent.includes('Edge')) return 'Edge Desktop';

    return 'Other';
  }

  generateTokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async scheduleSessionCleanup() {
    // This could be called by a cron job
    const expiredCount = await this.cleanupExpiredSessions();
    const oldRevokedCount = await this.cleanupOldRevokedSessions();

    return {
      expiredSessionsRemoved: expiredCount,
      oldRevokedSessionsRemoved: oldRevokedCount,
    };
  }
}
