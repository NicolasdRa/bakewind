import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantsService } from '../../tenants/tenants.service';

/**
 * Metadata key for skipping tenant check
 */
export const SKIP_TENANT_CHECK_KEY = 'skipTenantCheck';

/**
 * TenantGuard - Ensures the authenticated user has a valid tenant context.
 *
 * This guard should be used on routes that require tenant-scoped data access.
 * It verifies that the authenticated user has a tenantId, which is required
 * for OWNER and STAFF users but not for ADMIN users who have cross-tenant access.
 *
 * Usage:
 * - Apply globally after JwtAuthGuard for tenant-scoped modules
 * - Use @SkipTenantCheck() decorator to bypass for admin-only routes
 *
 * ADMIN users bypass this check as they have system-wide access.
 * OWNER and STAFF users must have a valid tenantId.
 * CUSTOMER users may have a tenantId if they're associated with a bakery.
 */
/**
 * Header name for ADMIN tenant context
 */
export const ADMIN_TENANT_HEADER = 'x-tenant-id';

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => TenantsService))
    private tenantsService: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if tenant check should be skipped for this route
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTenantCheck) {
      this.logger.debug('Tenant check skipped for this route');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user means not authenticated - let JwtAuthGuard handle this
    if (!user) {
      return true;
    }

    // ADMIN users use header-based tenant context
    if (user.role === 'ADMIN') {
      const headerTenantId = request.headers[ADMIN_TENANT_HEADER];

      if (headerTenantId) {
        // Validate that the tenant exists
        const tenantExists = await this.tenantsService.exists(headerTenantId);
        if (!tenantExists) {
          throw new BadRequestException(
            `Invalid tenant ID: ${headerTenantId}. The specified tenant does not exist.`,
          );
        }

        // Attach the tenant ID to the request for downstream use
        request.adminTenantId = headerTenantId;
        this.logger.debug(
          `ADMIN user ${user.email} - using tenant context from header: ${headerTenantId}`,
        );
      } else {
        this.logger.debug(
          `ADMIN user ${user.email} - no tenant header provided, accessing without tenant context`,
        );
      }

      return true;
    }

    // For OWNER and STAFF users, tenantId is required
    if (!user.tenantId) {
      this.logger.warn(
        `User ${user.email} (role: ${user.role}) attempted tenant-scoped operation without tenant context`,
      );
      throw new ForbiddenException(
        'This operation requires a tenant context. Your account is not associated with a bakery.',
      );
    }

    this.logger.debug(
      `Tenant context verified for user ${user.email}: tenantId=${user.tenantId}`,
    );
    return true;
  }
}
