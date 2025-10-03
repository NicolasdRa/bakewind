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
import { FastifyReply } from 'fastify';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
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
  CreateTransferSessionDto,
  ExchangeTransferSessionDto,
  TransferSessionResponse,
  TransferSessionTokens,
  TransferSessionResponseDto,
  TransferSessionTokensDto,
  CreateCookieSessionDto,
  CreateCookieSessionResponseDto,
} from './dto/auth-transfer.dto';
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
   * Get cookie options for tokens
   * Must be consistent across all endpoints
   */
  private getCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';

    // Development: Using reverse proxy on localhost:8080
    // Production: Using subdomain with shared parent domain
    return {
      httpOnly: true,
      secure: false, // false for HTTP in development, true for HTTPS in production
      sameSite: 'lax' as const,
      path: '/', // Cookies accessible from all paths
      // Domain not set - cookies will be scoped to the serving domain (localhost:8080 in dev)
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
    @Request() req: any,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    console.log('🚀 Auth Controller login method called with:', loginDto);
    const auditContext = req.auditContext;

    // Try SaaS login first, fall back to regular login
    let result: any;
    try {
      result = await this.authService.saasLogin(
        loginDto.email,
        loginDto.password,
        auditContext,
      );
    } catch (error) {
      // If SaaS login fails, try regular user login
      result = await this.authService.login(loginDto, auditContext);
    }

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
  @ApiOperation({ summary: 'Sign up for a 14-day free trial with Stripe integration' })
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
    @Request() req: any,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const auditContext = req.auditContext || {};
    const result = await this.authService.trialSignup(
      trialSignupDto,
      auditContext,
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
    description: 'Create a new user account with email and password. Password must be at least 8 characters and contain uppercase, lowercase, and number.',
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
  ) {
    return this.authService.register(registerDto);
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
    @Request() req: any,
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
    @Request() req: any,
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
  async getProfile(@Request() req: any) {
    const userId = req.user.id;
    const locationIds = await this.authService.getUserLocationIds(userId);
    return {
      ...req.user,
      locationId: locationIds,
    };
  }

  @Public()
  @Post('create-transfer-session')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  @ApiOperation({
    summary:
      'Create a secure auth transfer session for cross-domain authentication',
    description:
      'Creates a one-time, short-lived (30s) session for securely transferring tokens between domains. ' +
      'This is used when redirecting from the customer website to the admin dashboard.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transfer session created successfully',
    type: TransferSessionResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async createTransferSession(
    @Body() dto: CreateTransferSessionDto,
  ): Promise<TransferSessionResponse> {
    return this.authService.createAuthTransferSession(
      dto.accessToken,
      dto.refreshToken,
      dto.userId,
    );
  }

  @Public()
  @Post('create-cookie-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create cookie session from tokens',
    description:
      'Internal endpoint used by admin dashboard to set httpOnly cookies ' +
      'after receiving tokens from transfer session exchange.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cookies set successfully',
    type: CreateCookieSessionResponseDto,
  })
  async createCookieSession(
    @Body() body: CreateCookieSessionDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { accessToken, refreshToken } = body;

    // Set httpOnly cookies
    const cookieOptions = this.getCookieOptions();

    res.setCookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.setCookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { message: 'Session created successfully' };
  }

  @Public()
  @Post('exchange-transfer-session')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  @ApiOperation({
    summary: 'Exchange a transfer session ID for authentication tokens',
    description:
      'Exchanges a one-time session ID for the stored access and refresh tokens. ' +
      'The session is deleted after exchange and cannot be reused.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens retrieved successfully',
    type: TransferSessionTokensDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired session ID',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests',
  })
  async exchangeTransferSession(
    @Body() dto: ExchangeTransferSessionDto,
  ): Promise<TransferSessionTokens> {
    return this.authService.exchangeAuthTransferSession(dto.sessionId);
  }
}
