import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`🔒 JwtAuthGuard checking: ${request.method} ${request.url}`);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log('Public endpoint, skipping auth');
      return true;
    }

    this.logger.log(`Cookies present: ${!!request.cookies}, accessToken: ${!!request.cookies?.accessToken}`);

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (err || !user) {
      this.logger.error(`🔒 JWT Auth failed for ${request.method} ${request.url}`);
      this.logger.error(`Error: ${err?.message || 'No error'}`);
      this.logger.error(`Info: ${info?.message || 'No info'}`);
      this.logger.error(`User: ${user ? 'Found' : 'Not found'}`);
      throw err || new UnauthorizedException('Authentication failed');
    }

    this.logger.log(`🔒 JWT Auth successful for user: ${user.email}`);
    return user;
  }
}
