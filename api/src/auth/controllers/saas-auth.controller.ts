import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Response,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SaasUsersService } from '../../saas-users/saas-users.service';
import { TrialAccountsService } from '../../trials/trial-accounts.service';
import { UserSessionsService } from '../../user-sessions/user-sessions.service';
import { StripeService } from '../../stripe/stripe.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import {
  CreateTrialSignupDto,
  LoginDto,
  RefreshTokenDto,
} from '../dto/auth.dto';

@ApiTags('SaaS Authentication')
@Controller('saas-auth')
export class SaasAuthController {
  constructor(
    private readonly saasUsersService: SaasUsersService,
    private readonly trialAccountsService: TrialAccountsService,
    private readonly userSessionsService: UserSessionsService,
    private readonly stripeService: StripeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('trial-signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create trial account for prospects' })
  @ApiResponse({
    status: 201,
    description: 'Trial account created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async createTrialAccount(
    @Body() createTrialDto: CreateTrialSignupDto,
    @Request() req: any,
    @Response() res: ExpressResponse,
  ) {
    const {
      businessName,
      fullName,
      email,
      phone,
      password,
      locations,
      agreeToTerms,
    } = createTrialDto;

    if (!agreeToTerms) {
      throw new BadRequestException('You must agree to the terms of service');
    }

    try {
      // Create Stripe customer
      const stripeCustomer = await this.stripeService.createCustomer(
        email,
        fullName,
        businessName,
      );

      // Parse full name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create SaaS user
      const createUserDto: any = {
        email,
        password,
        companyName: businessName,
        role: 'owner',
        stripeCustomerId: stripeCustomer.id,
      };
      if (phone) {
        createUserDto.companyPhone = phone;
      }
      const user = await this.saasUsersService.create(createUserDto);

      // Create trial account
      const trial = await this.trialAccountsService.create({
        userId: user.id,
        signupSource: 'landing_page',
        businessSize: locations,
      });

      // Generate tokens
      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);
      const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
      const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN');
      if (!refreshSecret || !refreshExpiresIn) {
        throw new UnauthorizedException('JWT refresh configuration missing');
      }
      const refreshToken = this.jwtService.sign(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      });

      // Create session
      const expiresAt = new Date();
      expiresAt.setMilliseconds(
        expiresAt.getMilliseconds() +
          this.parseTimeToMs(this.configService.get('JWT_EXPIRES_IN', '15m')),
      );

      const session = await this.userSessionsService.create({
        userId: user.id,
        accessTokenHash:
          this.userSessionsService.generateTokenHash(accessToken),
        refreshTokenHash:
          this.userSessionsService.generateTokenHash(refreshToken),
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        dashboardRedirectUrl: '/admin/overview',
      });

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: this.configService.get('NODE_ENV') === 'production',
        sameSite: 'strict',
        maxAge: this.parseTimeToMs(
          this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        ),
      });

      const userProfile = {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        businessName: user.companyName,
        role: 'trial_user',
        subscriptionStatus: 'trial',
        trialEndsAt: this.trialAccountsService
          .calculateTrialEndDate(trial)
          .toISOString(),
        isEmailVerified: user.emailVerified,
        createdAt: user.createdAt,
      };

      return res.status(201).json({
        user: userProfile,
        accessToken,
        refreshToken,
        dashboardUrl: '/admin/overview',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate existing subscribers' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
    @Response() res: ExpressResponse,
  ) {
    const { email, password } = loginDto;

    const isValid = await this.saasUsersService.verifyPassword(email, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.saasUsersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.saasUsersService.updateLastLogin(user.id);

    // Generate tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN');
    if (!refreshSecret || !refreshExpiresIn) {
      throw new UnauthorizedException('JWT refresh configuration missing');
    }
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    // Create session
    const expiresAt = new Date();
    expiresAt.setMilliseconds(
      expiresAt.getMilliseconds() +
        this.parseTimeToMs(this.configService.get('JWT_EXPIRES_IN', '15m')),
    );

    const session = await this.userSessionsService.create({
      userId: user.id,
      accessTokenHash: this.userSessionsService.generateTokenHash(accessToken),
      refreshTokenHash:
        this.userSessionsService.generateTokenHash(refreshToken),
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      dashboardRedirectUrl: '/admin/overview',
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: this.parseTimeToMs(
        this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      ),
    });

    // Get trial info if exists
    const trial = await this.trialAccountsService.getTrialByUserId(user.id);

    const userProfile = {
      id: user.id,
      email: user.email,
      firstName: user.companyName.split(' ')[0], // Simplified - would need proper name parsing
      lastName: user.companyName.split(' ').slice(1).join(' '),
      businessName: user.companyName,
      role: trial ? 'trial_user' : 'subscriber',
      subscriptionStatus: trial && !trial.convertedAt ? 'trial' : 'active',
      trialEndsAt: trial
        ? this.trialAccountsService.calculateTrialEndDate(trial).toISOString()
        : null,
      isEmailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      user: userProfile,
      accessToken,
      refreshToken,
      dashboardUrl: '/admin/overview',
    });
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Request() req: any, @Response() res: ExpressResponse) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    try {
      // Verify refresh token
      const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
      if (!refreshSecret) {
        throw new UnauthorizedException('JWT refresh secret not configured');
      }
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      // Find session by refresh token hash
      const refreshTokenHash =
        this.userSessionsService.generateTokenHash(refreshToken);
      const session =
        await this.userSessionsService.findByRefreshTokenHash(refreshTokenHash);

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      const newAccessToken = this.jwtService.sign(newPayload);

      // Update session
      await this.userSessionsService.update(session.id, {
        accessTokenHash:
          this.userSessionsService.generateTokenHash(newAccessToken),
        lastActivityAt: new Date(),
      });

      return res.status(200).json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user and revoke session' })
  @ApiResponse({ status: 204, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async logout(@Request() req: any, @Response() res: ExpressResponse) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      const accessTokenHash =
        this.userSessionsService.generateTokenHash(accessToken);

      // Revoke the session
      await this.userSessionsService.revokeSessionByAccessToken(
        accessTokenHash,
      );
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return res.status(204).send();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getCurrentUser(@Request() req: any) {
    const userId = req.user.sub;
    const user = await this.saasUsersService.findById(userId);

    // Get trial info if exists
    const trial = await this.trialAccountsService.getTrialByUserId(user.id);

    const userProfile = {
      id: user.id,
      email: user.email,
      firstName: user.companyName.split(' ')[0], // Simplified
      lastName: user.companyName.split(' ').slice(1).join(' '),
      businessName: user.companyName,
      role: trial ? 'trial_user' : 'subscriber',
      subscriptionStatus: trial && !trial.convertedAt ? 'trial' : 'active',
      trialEndsAt: trial
        ? this.trialAccountsService.calculateTrialEndDate(trial).toISOString()
        : null,
      isEmailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    return userProfile;
  }

  private parseTimeToMs(timeString: string): number {
    const regex = /^(\d+)([smhd])$/;
    const match = timeString.match(regex);

    if (!match || !match[1]) {
      throw new Error(`Invalid time format: ${timeString}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }
}
