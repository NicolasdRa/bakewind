import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Decorator to extract the current tenant ID from the authenticated user.
 *
 * Usage:
 * - @CurrentTenant() tenantId: string - Returns tenantId, throws if not available
 * - @CurrentTenant({ required: false }) tenantId: string | undefined - Returns tenantId or undefined
 *
 * This decorator is used in multi-tenant operations where the tenantId is needed
 * to scope database queries to the current bakery.
 *
 * For ADMIN users:
 * - First checks if adminTenantId was set by TenantGuard (from X-Tenant-Id header)
 * - Falls back to user.tenantId if no header was provided
 */
export const CurrentTenant = createParamDecorator(
  (options: { required?: boolean } | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // For ADMIN users, check for header-based tenant context first
    // This is set by TenantGuard when X-Tenant-Id header is present
    let tenantId: string | undefined;

    if (user?.role === 'ADMIN' && request.adminTenantId) {
      // ADMIN with header-based tenant context
      tenantId = request.adminTenantId;
    } else {
      // Standard tenantId from JWT (for OWNER/STAFF)
      tenantId = user?.tenantId;
    }

    const required = options?.required !== false; // Default to required

    if (required && !tenantId) {
      if (user?.role === 'ADMIN') {
        throw new ForbiddenException(
          'This operation requires a tenant context. Please select a tenant using the X-Tenant-Id header.',
        );
      }
      throw new ForbiddenException(
        'This operation requires a tenant context. Please ensure you are logged in as an OWNER or STAFF user.',
      );
    }

    return tenantId;
  },
);

/**
 * Type for the authenticated user with tenant context
 */
export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
}
