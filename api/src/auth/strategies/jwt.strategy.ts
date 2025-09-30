import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, jwtPayloadSchema } from '../auth.validation';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): {
    id: string;
    userId: string;
    email: string;
    role: string;
  } {
    // Validate payload structure
    const validatedPayload = jwtPayloadSchema.parse(payload);

    return {
      id: validatedPayload.sub, // Add id for consistency
      userId: validatedPayload.sub, // Keep userId for backward compatibility
      email: validatedPayload.email,
      role: validatedPayload.role as string,
    };
  }
}
