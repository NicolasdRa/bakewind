import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from '@nestjs/common';
import { JwtPayload, jwtPayloadSchema } from '../auth.validation';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from cookie first
        (request: any) => {
          return request?.cookies?.accessToken || null;
        },
        // Fallback to Authorization header (for backward compatibility)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true, // Enable request access
    });
  }

  async validate(req: any, payload: JwtPayload): Promise<{
    id: string;
    userId: string;
    email: string;
    role: string;
  }> {
    // Validate payload structure
    const validatedPayload = jwtPayloadSchema.parse(payload);

    // Extract token from cookie or Authorization header
    const token =
      req.cookies?.accessToken ||
      ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // Check if token is blacklisted
    if (token) {
      const isBlacklisted = await this.authService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return {
      id: validatedPayload.sub, // Add id for consistency
      userId: validatedPayload.sub, // Keep userId for backward compatibility
      email: validatedPayload.email,
      role: validatedPayload.role as string,
    };
  }
}
