import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from '@nestjs/common';
import { JwtPayload, jwtPayloadSchema } from '../auth.validation';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from cookie first
        (request: any) => {
          const token = request?.cookies?.accessToken || null;
          return token;
        },
        // Fallback to Authorization header (for backward compatibility)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true, // Enable request access
    });
  }

  async validate(
    req: any,
    payload: JwtPayload,
  ): Promise<{
    id: string;
    userId: string;
    email: string;
    role: string;
    tenantId?: string;
  }> {
    this.logger.log(`JWT validation started for user: ${payload.email}`);

    // Validate payload structure
    const validatedPayload = jwtPayloadSchema.parse(payload);

    // Extract token from cookie or Authorization header
    const token =
      req.cookies?.accessToken || ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    this.logger.log(
      `Token extracted: ${!!token}, From cookie: ${!!req.cookies?.accessToken}`,
    );

    // Check if token is blacklisted
    if (token) {
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      this.logger.log(`Token blacklisted: ${isBlacklisted}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    this.logger.log(
      `JWT validation successful for user: ${validatedPayload.email}`,
    );

    return {
      id: validatedPayload.sub, // Add id for consistency
      userId: validatedPayload.sub, // Keep userId for backward compatibility
      email: validatedPayload.email,
      role: validatedPayload.role as string,
      tenantId: (payload as any).tenantId, // Include tenantId for multi-tenancy
    };
  }
}
