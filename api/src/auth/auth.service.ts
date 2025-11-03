import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { TrialAccountsService } from '../trials/trial-accounts.service';
import { StripeService } from '../stripe/stripe.service';
import { RedisService } from '../redis/redis.service';
import type {
  UsersData,
  UserLogin,
  UserRegistration,
} from '../users/users.validation';
import type { AppConfig } from '../config/configuration';
import type { SubscriptionStatus } from '../common/constants/subscription-status.constants';

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

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface RegisterDto extends Omit<UserRegistration, 'confirmPassword'> {
  businessName?: string;
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private trialAccountsService: TrialAccountsService,
    private stripeService: StripeService,
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, refreshToken: _token, ...result } = user;
    return result;
  }

  async login(
    loginDto: UserLogin,
    auditContext?: AuditContext,
  ): Promise<AuthResult> {
    this.logger.log('🔐 Login endpoint hit with:', {
      email: loginDto.email,
      ipAddress: auditContext?.ipAddress,
    });

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

    this.logger.log(`✅ User ${user.email} logged in successfully`, {
      userId: user.id,
      ipAddress: auditContext?.ipAddress,
      correlationId: auditContext?.correlationId,
    });

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
    auditContext?: AuditContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const appConfig = this.configService.get<AppConfig>('app')!;

      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: appConfig.jwt.refreshSecret,
      });

      const user = await this.usersService.findByEmail(payload.email);
      if (!user || !user.isActive || !user.refreshToken) {
        this.logger.warn('Invalid refresh token attempt', {
          email: payload.email,
          correlationId: auditContext?.correlationId,
        });
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
          {
            userId: user.id,
            email: user.email,
            correlationId: auditContext?.correlationId,
          },
        );
        await this.usersService.updateRefreshToken(user.id, null);
        throw new UnauthorizedException(
          'Invalid refresh token - all sessions terminated',
        );
      }

      // Generate NEW tokens (rotation)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _pwd, refreshToken: _token, ...userForTokens } = user;
      const newTokens = await this.generateTokens(userForTokens);

      // CRITICAL: Immediately invalidate old refresh token and store new one
      // This implements refresh token rotation
      await this.usersService.updateRefreshToken(
        user.id,
        newTokens.refreshToken,
      );

      this.logger.log(
        `Refresh token rotated for user ${user.id}. Old token invalidated.`,
        {
          userId: user.id,
          email: user.email,
          correlationId: auditContext?.correlationId,
        },
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

  async logout(
    userId: string,
    accessToken?: string,
    auditContext?: AuditContext,
  ): Promise<void> {
    this.logger.log(`🔐 Logout service called for user: ${userId}`, {
      userId,
      correlationId: auditContext?.correlationId,
    });

    // Clear refresh token from database
    await this.usersService.updateRefreshToken(userId, null);

    // Blacklist the access token if provided
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode<JwtPayload>(accessToken);
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
              {
                userId,
                ttl,
                correlationId: auditContext?.correlationId,
              },
            );
          }
        }
      } catch (error) {
        this.logger.error('Failed to blacklist access token:', error);
        // Don't throw - logout should still succeed
      }
    }

    this.logger.log(`User ${userId} logged out`, {
      userId,
      correlationId: auditContext?.correlationId,
    });
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

  async register(
    registerDto: RegisterDto,
    auditContext?: AuditContext,
    metadata?: {
      businessSize?: '1' | '2-3' | '4-10' | '10+';
      fullName?: string;
      businessName?: string;
    },
  ): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    this.logger.log('🔐 User registration attempt:', {
      email: registerDto.email,
      role: registerDto.role || 'VIEWER',
      ipAddress: auditContext?.ipAddress,
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Create user
    const userData = {
      ...registerDto,
      password: hashedPassword,
      confirmPassword: hashedPassword, // Add confirmPassword for validation
      role: registerDto.role || 'VIEWER',
      isActive: true,
    };

    const user = await this.usersService.create(userData);

    // Apply role-based post-registration hooks (Stripe, trial tracking, etc.)
    await this.applyPostRegistrationHooks(user, metadata);

    // Generate tokens
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    // Get user locations
    const locationIds = await this.usersService.getUserLocationIds(user.id);

    this.logger.log(`✅ User registered: ${user.email}`, {
      userId: user.id,
      role: user.role,
      ipAddress: auditContext?.ipAddress,
      correlationId: auditContext?.correlationId,
    });

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

  /**
   * Apply role-based post-registration hooks
   * Extensible for future roles (ENTERPRISE, PARTNER, etc.)
   */
  private async applyPostRegistrationHooks(
    user: Omit<UsersData, 'password' | 'refreshToken'>,
    metadata?: {
      businessSize?: '1' | '2-3' | '4-10' | '10+';
      fullName?: string;
      businessName?: string;
    },
  ): Promise<void> {
    // Trial user-specific setup
    if (user.role === 'TRIAL_USER') {
      await this.handleTrialRegistration(user, metadata);
    }

    // Future: Add more role-based hooks here
    // if (user.role === 'ENTERPRISE') { await this.handleEnterpriseRegistration(...) }
  }

  /**
   * Handle trial-specific registration tasks
   * - Creates Stripe customer for future billing
   * - Creates trial tracking record for analytics
   */
  private async handleTrialRegistration(
    user: Omit<UsersData, 'password' | 'refreshToken'>,
    metadata?: {
      businessSize?: '1' | '2-3' | '4-10' | '10+';
      fullName?: string;
      businessName?: string;
    },
  ): Promise<void> {
    // Create Stripe customer for future billing
    if (metadata?.fullName && metadata?.businessName) {
      await this.stripeService.createCustomer(
        user.email,
        metadata.fullName,
        metadata.businessName,
      );
    }

    // Create trial tracking record (for analytics/marketing)
    if (metadata?.businessSize) {
      await this.trialAccountsService.create({
        userId: user.id,
        signupSource: 'landing_page',
        businessSize: metadata.businessSize,
      });
    }
  }
}
