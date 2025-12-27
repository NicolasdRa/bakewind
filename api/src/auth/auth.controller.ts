import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ConfigService } from '@nestjs/config';
import type { AuditContext } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

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
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

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

    if (isDevelopment) {
      // Development: Maximum CSRF protection with strict cookies
      // Works with fetch/AJAX requests (credentials: 'include')
      return {
        httpOnly: true,
        secure: false,
        sameSite: 'strict' as const, // Upgraded from 'lax' for better CSRF protection
        path: '/',
        domain: 'localhost',
      };
    }

    // Production: Secure cookies with maximum CSRF protection
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const, // Upgraded from 'lax' for better CSRF protection
      path: '/',
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
    // Creates OWNER user, tenant creation happens in post-registration hook
    const result = await this.authService.register(
      {
        email,
        password,
        firstName,
        lastName,
        ...(phone && { phoneNumber: phone }),
        role: 'OWNER',
        // Note: businessName, subscriptionStatus, trialEndsAt are now on tenants table
        // Tenant will be created in handleOwnerRegistration with trial status
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

    // Send welcome email for trial signup (async, don't block response)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    this.emailService.sendWelcomeEmail({
      email,
      firstName,
      businessName,
      dashboardUrl: `${frontendUrl}/dashboard/overview`,
      isTrialSignup: true,
      trialDays: 14,
    }).catch((err) => {
      this.logger.error('Failed to send welcome email for trial signup:', err);
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
    const result = await this.authService.register(registerDto, auditContext);

    // Send welcome email for registration (async, don't block response)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    this.emailService.sendWelcomeEmail({
      email: registerDto.email,
      firstName: registerDto.firstName,
      dashboardUrl: `${frontendUrl}/dashboard/overview`,
      isTrialSignup: false,
    }).catch((err) => {
      this.logger.error('Failed to send welcome email for registration:', err);
    });

    return result;
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

    // Get audit context for correlation tracking
    const auditContext = this.getAuditContext(req);

    // Refresh tokens (with rotation)
    const tokens = await this.authService.refreshTokens(
      refreshToken,
      auditContext,
    );

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
    this.logger.log('🔴 LOGOUT ENDPOINT HIT!');
    this.logger.log(
      `Logout endpoint reached for user: ${req.user?.id || 'unknown'}`,
    );
    this.logger.log(`Request user object:`, req.user);

    // Extract access token from cookie or Authorization header
    const accessToken =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace('Bearer ', '');

    this.logger.log(
      `Access token present: ${!!accessToken}, Cookies: ${!!req.cookies?.accessToken}`,
    );

    // Get audit context for correlation tracking
    const auditContext = this.getAuditContext(req);

    // Logout and blacklist token
    await this.authService.logout(req.user.id, accessToken, auditContext);

    // Clear httpOnly cookies by setting them to expire immediately
    const cookieOptions = this.getCookieOptions();
    res.setCookie('accessToken', '', { ...cookieOptions, maxAge: 0 });
    res.setCookie('refreshToken', '', { ...cookieOptions, maxAge: 0 });

    this.logger.log('Logout complete, cookies cleared');

    return { message: 'Successfully logged out' };
  }

  @Get('me')
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
    const profile = await this.authService.getUserProfile(userId);

    if (!profile) {
      throw new UnauthorizedException('User not found');
    }

    return profile;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset email to the user if the email exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'If the email exists, a reset link has been sent',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many password reset attempts',
  })
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    // Generate reset token (returns null if user doesn't exist)
    const result = await this.usersService.setPasswordResetToken(email);

    if (result) {
      // Build reset URL
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
      const resetUrl = `${frontendUrl}/reset-password?token=${result.token}`;

      // Send email
      await this.emailService.sendPasswordReset(
        result.user.email,
        result.user.firstName,
        resetUrl,
      );

      this.logger.log(`Password reset email sent to: ${email}`);
    } else {
      // Don't reveal whether user exists - just log it
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
    }

    // Always return success to prevent email enumeration
    return {
      message: 'If an account with that email exists, we have sent password reset instructions.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Resets the user password using the token from the reset email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password has been reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many password reset attempts',
  })
  async resetPassword(@Body() body: { token: string; password: string }) {
    const { token, password } = body;

    if (!token || !password) {
      throw new BadRequestException('Token and password are required');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Attempt to reset password
    const success = await this.usersService.resetPasswordWithToken(token, password);

    if (!success) {
      throw new BadRequestException('Invalid or expired reset token. Please request a new password reset.');
    }

    this.logger.log('Password reset completed successfully');

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }
}
