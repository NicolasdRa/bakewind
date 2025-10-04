import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import type { AuditContext } from './auth.service';

interface RequestWithUser extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { userRegistrationSchema } from '../users/users.validation';
import { Public } from './decorators/public.decorator';
import { TrialSignupDto } from './trial-signup.validation';
import {
  RegisterUserDto,
  RegisterResponseDto,
  ErrorResponseDto,
  RefreshResponseDto,
  LogoutResponseDto,
  UserProfileDto,
  AuthSuccessResponseDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Extract audit context from request
   */
  private getAuditContext(req: RequestWithUser): AuditContext {
    const context: AuditContext = {};

    if (req.ip) context.ipAddress = req.ip;
    if (req.headers['user-agent'])
      context.userAgent = req.headers['user-agent'];
    if (req.headers['x-correlation-id']) {
      context.correlationId = req.headers['x-correlation-id'] as string;
    }

    return context;
  }

  /**
   * Get cookie options for tokens
   * Must be consistent across all endpoints
   */
  private getCookieOptions() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return {
      httpOnly: true,
      secure: !isDevelopment, // true in production (HTTPS), false in dev (HTTP)
      sameSite: 'lax' as const, // Lax allows cookies on same-site navigation
      path: '/', // Cookies accessible from all paths
      // Domain not set - cookies scoped to serving domain
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Unified login endpoint that supports both regular users and SaaS trial/subscriber users. ' +
      'Automatically detects user type and returns appropriate profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successful login',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts',
  })
  async login(
    @Body() loginDto: LoginUserDto,
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const auditContext = this.getAuditContext(req);
    const result = await this.authService.login(loginDto, auditContext);

    // Set httpOnly cookies for tokens
    const cookieOptions = this.getCookieOptions();

    res.setCookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.setCookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data with dashboard URL
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      dashboardUrl: '/admin/overview',
      expiresIn: result.expiresIn,
    };
  }

  @Public()
  @Post('trial-signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 trial signups per minute
  @ApiOperation({
    summary: 'Sign up for a 14-day free trial with Stripe integration',
  })
  @ApiResponse({
    status: 201,
    description: 'Trial account created successfully with Stripe customer',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many trial signup attempts',
  })
  async trialSignup(
    @Body() trialSignupDto: TrialSignupDto,
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const {
      businessName,
      fullName,
      email,
      phone,
      password,
      locations,
      agreeToTerms,
    } = trialSignupDto;

    if (!agreeToTerms) {
      throw new UnauthorizedException('You must agree to the terms of service');
    }

    // Parse full name into firstName and lastName
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || email.split('@')[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const auditContext = this.getAuditContext(req);

    // Map to standard register DTO and call register with metadata
    const result = await this.authService.register(
      {
        email,
        password,
        firstName,
        lastName,
        businessName,
        ...(phone && { phoneNumber: phone }),
        role: 'TRIAL_USER',
        subscriptionStatus: 'trial' as const,
        trialEndsAt,
      },
      auditContext,
      {
        businessSize: locations,
        fullName,
        businessName,
      },
    );

    // Set httpOnly cookies for tokens
    const cookieOptions = this.getCookieOptions();

    res.setCookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.setCookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data with tokens and dashboard URL
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      dashboardUrl: '/admin/overview',
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registrations per minute
  @ApiOperation({
    summary: 'Register a new user account',
    description:
      'Create a new user account with email and password. Password must be at least 8 characters and contain uppercase, lowercase, and number.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many registration attempts',
  })
  async register(
    @Body(new ZodValidationPipe(userRegistrationSchema))
    registerDto: RegisterUserDto,
    @Request() req: RequestWithUser,
  ) {
    const auditContext = this.getAuditContext(req);
    return this.authService.register(registerDto, auditContext);
  }

  @Post('refresh')
  @Public() // Allow refresh without JWT guard since we're using cookies
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
    description:
      'Refreshes the access token using the refresh token from httpOnly cookie. ' +
      'Implements token rotation - old refresh token is invalidated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
    type: ErrorResponseDto,
  })
  async refresh(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    // Extract refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Refresh tokens (with rotation)
    const tokens = await this.authService.refreshTokens(refreshToken);

    // Set new httpOnly cookies
    const cookieOptions = this.getCookieOptions();

    res.setCookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.setCookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { message: 'Tokens refreshed successfully' };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout and invalidate tokens',
    description:
      'Invalidates the refresh token and blacklists the current access token. ' +
      'The access token will be rejected for all future requests.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async logout(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    // Extract access token from cookie or Authorization header
    const accessToken =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace('Bearer ', '');

    // Logout and blacklist token
    await this.authService.logout(req.user.id, accessToken);

    // Clear httpOnly cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return { message: 'Successfully logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: ErrorResponseDto,
  })
  async getProfile(@Request() req: RequestWithUser) {
    const userId: string = req.user.id;
    const locationIds = await this.authService.getUserLocationIds(userId);
    return {
      ...req.user,
      locationId: locationIds,
    };
  }
}
