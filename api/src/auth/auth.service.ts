import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import type { UsersData, UserLogin } from '../users/users.validation';
import type { AppConfig } from '../config/configuration';
import type { TrialSignupDto } from './trial-signup.validation';
import type {
  TransferSessionResponse,
  TransferSessionTokens,
} from './dto/auth-transfer.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp: number;
}

export interface AuthResult {
  user: Omit<UsersData, 'password' | 'refreshToken'> & {
    locationId: string[];
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UsersData, 'password' | 'refreshToken'> | null> {
    this.logger.debug(`Attempting to validate user: ${email}`);

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.debug(`User not found: ${email}`);
      return null;
    }

    if (!user.isActive) {
      this.logger.debug(`User is inactive: ${email}`);
      return null;
    }

    this.logger.debug(`Found user: ${email}, checking password...`);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.debug(`Invalid password for user: ${email}`);
      return null;
    }

    this.logger.debug(`Password validation successful for user: ${email}`);

    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }

  async login(loginDto: UserLogin, auditContext?: any): Promise<AuthResult> {
    this.logger.log('🔐 Login endpoint hit with:', { email: loginDto.email });

    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      this.logger.debug('❌ Login failed for:', loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    // Update refresh token in database
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Get user locations
    const locationIds = await this.usersService.getUserLocationIds(user.id);

    this.logger.log(`✅ User ${user.email} logged in successfully`);

    const appConfig = this.configService.get<AppConfig>('app')!;

    return {
      user: {
        ...user,
        locationId: locationIds,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: appConfig.jwt.expiresIn,
    };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const appConfig = this.configService.get<AppConfig>('app')!;
      const payload = this.jwtService.verify(refreshToken, {
        secret: appConfig.jwt.refreshSecret,
      });

      const user = await this.usersService.findByEmail(payload.email);
      if (!user || !user.isActive || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate refresh token against stored hash
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        // SECURITY: Possible token reuse attack detected
        // Invalidate all sessions for this user
        this.logger.warn(
          `Refresh token reuse detected for user ${user.id}. Invalidating all sessions.`,
        );
        await this.usersService.updateRefreshToken(user.id, null);
        throw new UnauthorizedException(
          'Invalid refresh token - all sessions terminated',
        );
      }

      // Generate NEW tokens (rotation)
      const { password: _, refreshToken: __, ...userForTokens } = user;
      const newTokens = await this.generateTokens(userForTokens);

      // CRITICAL: Immediately invalidate old refresh token and store new one
      // This implements refresh token rotation
      await this.usersService.updateRefreshToken(
        user.id,
        newTokens.refreshToken,
      );

      this.logger.log(
        `Refresh token rotated for user ${user.id}. Old token invalidated.`,
      );

      return newTokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, accessToken?: string): Promise<void> {
    // Clear refresh token from database
    await this.usersService.updateRefreshToken(userId, null);

    // Blacklist the access token if provided
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken) as JwtPayload;
        if (decoded && decoded.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000);

          // Only blacklist if token hasn't expired yet
          if (ttl > 0) {
            await this.redisService.setex(
              `blacklist:token:${accessToken}`,
              ttl,
              userId,
            );
            this.logger.log(
              `Access token blacklisted for user ${userId} (TTL: ${ttl}s)`,
            );
          }
        }
      } catch (error) {
        this.logger.error('Failed to blacklist access token:', error);
        // Don't throw - logout should still succeed
      }
    }

    this.logger.log(`User ${userId} logged out`);
  }

  /**
   * Check if an access token has been blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const isBlacklisted = await this.redisService.exists(
      `blacklist:token:${token}`,
    );
    return isBlacklisted;
  }

  async register(registerDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user
    const userData = {
      ...registerDto,
      password: hashedPassword,
      confirmPassword: hashedPassword, // Add confirmPassword for validation
      role: (registerDto.role as any) || 'viewer',
    };

    const user = await this.usersService.create(userData);

    // Generate tokens
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`New user registered: ${user.email}`);

    // Get user locations
    const locationIds = await this.usersService.getUserLocationIds(user.id);

    const appConfig = this.configService.get<AppConfig>('app')!;

    return {
      user: {
        ...user,
        locationId: locationIds,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: appConfig.jwt.expiresIn,
    };
  }

  private async generateTokens(
    user: Omit<UsersData, 'password' | 'refreshToken'>,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const appConfig = this.configService.get<AppConfig>('app')!;

    // Note: 'exp' and 'iat' will be added automatically by jwtService.signAsync
    const payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        {
          secret: appConfig.jwt.secret,
          expiresIn: appConfig.jwt.expiresIn,
        },
      ),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: appConfig.jwt.refreshSecret,
          expiresIn: appConfig.jwt.refreshExpiresIn,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async validateJwtPayload(
    payload: JwtPayload,
  ): Promise<Omit<UsersData, 'password' | 'refreshToken'> | null> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async getUserLocationIds(userId: string): Promise<string[]> {
    return this.usersService.getUserLocationIds(userId);
  }

  async trialSignup(
    trialSignupDto: TrialSignupDto,
    auditContext: any,
  ): Promise<AuthResult> {
    // Extract names from fullName (with safe handling)
    const fullName = trialSignupDto.fullName || '';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Create user data
    const userData: any = {
      email: trialSignupDto.email,
      password: trialSignupDto.password,
      confirmPassword: trialSignupDto.password,
      firstName,
      lastName,
      businessName: trialSignupDto.businessName,
      role: 'GUEST',
      phoneNumber: trialSignupDto.phone,
      isActive: true,
      isEmailVerified: false,
      subscriptionStatus: 'trial' as const,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    };

    // Create the user account
    const user = await this.usersService.create(userData);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        ...user,
        locationId: [],
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    };
  }

  /**
   * Create a secure auth transfer session for cross-domain token transfer
   * This session is stored in Redis with a short TTL (30 seconds)
   */
  async createAuthTransferSession(
    accessToken: string,
    refreshToken: string,
    userId: string,
  ): Promise<TransferSessionResponse> {
    // Generate a cryptographically secure random session ID
    const sessionId = randomBytes(32).toString('hex');
    const ttl = 30; // 30 seconds TTL

    // Store session data in Redis
    const sessionData = JSON.stringify({
      accessToken,
      refreshToken,
      userId,
      createdAt: Date.now(),
    });

    await this.redisService.setex(
      `auth:transfer:${sessionId}`,
      ttl,
      sessionData,
    );

    this.logger.log(
      `Auth transfer session created for user ${userId}: ${sessionId}`,
    );

    return {
      sessionId,
      expiresIn: ttl,
    };
  }

  /**
   * Exchange a transfer session ID for the stored tokens
   * This can only be done once - the session is deleted after exchange
   */
  async exchangeAuthTransferSession(
    sessionId: string,
  ): Promise<TransferSessionTokens> {
    const sessionKey = `auth:transfer:${sessionId}`;

    // Get session data from Redis
    const sessionData = await this.redisService.get(sessionKey);

    if (!sessionData) {
      this.logger.warn(`Invalid or expired transfer session: ${sessionId}`);
      throw new UnauthorizedException('Invalid or expired transfer session');
    }

    // Delete the session immediately (one-time use)
    await this.redisService.del(sessionKey);

    // Parse and return the tokens
    const { accessToken, refreshToken, userId } = JSON.parse(sessionData);

    this.logger.log(`Auth transfer session exchanged for user ${userId}`);

    return {
      accessToken,
      refreshToken,
      userId,
    };
  }
}
