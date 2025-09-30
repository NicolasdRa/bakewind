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
import type { UsersData, UserLogin } from '../users/users.validation';
import type { AppConfig } from '../config/configuration';
import type { TrialSignupDto } from './trial-signup.validation';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
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

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const { password: _, refreshToken: __, ...userForTokens } = user;
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(userForTokens);
      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
    this.logger.log(`User ${userId} logged out`);
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

    const payload: Omit<JwtPayload, 'type'> = {
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

  async trialSignup(trialSignupDto: TrialSignupDto, auditContext: any): Promise<AuthResult> {
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

}
