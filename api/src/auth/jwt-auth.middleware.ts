import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserSessionsService, JwtPayload } from './user-sessions.service';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { sessionId?: string };
  userAuthenticated?: boolean;
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(JwtAuthMiddleware.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userSessionsService: UserSessionsService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Skip authentication for public routes
      if (this.isPublicRoute(req.path)) {
        return next();
      }

      const token = this.extractTokenFromRequest(req);

      if (!token) {
        this.logger.warn(`No token provided for protected route: ${req.path}`);
        throw new UnauthorizedException('Access token required');
      }

      // Validate token and get user payload
      const payload = await this.userSessionsService.validateAccessToken(token);

      // Attach user data to request
      req.user = payload;
      req.userAuthenticated = true;

      // Log successful authentication
      this.logger.debug(`User ${payload.sub} authenticated for ${req.method} ${req.path}`);

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Authentication failed for ${req.method} ${req.path}:`, errorMessage);

      // Clear any potentially invalid cookies
      this.clearAuthCookies(res);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extract JWT token from request headers or cookies
   */
  private extractTokenFromRequest(req: AuthenticatedRequest): string | null {
    // Try Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try httpOnly cookie as fallback
    const cookieToken = req.cookies?.accessToken;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  /**
   * Check if the route should be public (no authentication required)
   */
  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      // Health check
      '/health',
      '/health/check',

      // Authentication routes
      '/auth/login',
      '/auth/register',
      '/auth/trial-signup',
      '/auth/refresh', // May handle its own auth

      // Public API routes
      '/subscriptions/plans',
      '/features',
      '/api-docs',
      '/swagger',

      // Static assets
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];

    // Check exact matches
    if (publicRoutes.includes(path)) {
      return true;
    }

    // Check patterns
    const publicPatterns = [
      /^\/subscriptions\/plans\/[^\/]+$/, // GET /subscriptions/plans/:planId
      /^\/subscriptions\/plans\/compare/, // GET /subscriptions/plans/compare
      /^\/subscriptions\/plans\/recommend/, // GET /subscriptions/plans/recommend
      /^\/features/, // All features endpoints are public
      /^\/api-docs/, // Swagger documentation
      /^\/swagger/, // Swagger UI
      /^\/public\//, // Public assets
    ];

    return publicPatterns.some(pattern => pattern.test(path));
  }

  /**
   * Clear authentication cookies
   */
  private clearAuthCookies(res: Response): void {
    const cookieOptions = {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      domain: this.configService.get('COOKIE_DOMAIN'),
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }

  /**
   * Check if user has specific role
   */
  static hasRole(requiredRole: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedException('Authentication required');
      }

      if (req.user.role !== requiredRole && req.user.role !== 'admin') {
        throw new UnauthorizedException(`${requiredRole} role required`);
      }

      next();
    };
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(roles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedException('Authentication required');
      }

      const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
      const hasRequiredRole = roles.some(role => userRoles.includes(role)) || userRoles.includes('admin');

      if (!hasRequiredRole) {
        throw new UnauthorizedException(`One of the following roles required: ${roles.join(', ')}`);
      }

      next();
    };
  }

  /**
   * Check if user is accessing their own resources
   */
  static isOwnerOrAdmin(userIdParam = 'userId') {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedException('Authentication required');
      }

      const resourceUserId = req.params[userIdParam];
      const currentUserId = req.user.sub;

      if (currentUserId !== resourceUserId && req.user.role !== 'admin') {
        throw new UnauthorizedException('Access denied - can only access own resources');
      }

      next();
    };
  }

  /**
   * Rate limiting based on user ID
   */
  static createUserRateLimit(maxRequests: number, windowMs: number) {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedException('Authentication required');
      }

      const userId = req.user.sub;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      for (const [key, value] of requestCounts.entries()) {
        if (value.resetTime < windowStart) {
          requestCounts.delete(key);
        }
      }

      // Check current user's rate limit
      const userRequests = requestCounts.get(userId);

      if (!userRequests) {
        requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
        return next();
      }

      if (userRequests.count >= maxRequests) {
        throw new UnauthorizedException('Rate limit exceeded');
      }

      userRequests.count++;
      next();
    };
  }
}