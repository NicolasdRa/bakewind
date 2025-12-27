import { SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_CHECK_KEY } from '../guards/tenant.guard';

/**
 * Decorator to skip tenant check for specific routes.
 *
 * Use this on routes that:
 * - Are admin-only and need cross-tenant access
 * - Are public endpoints that don't require tenant context
 * - Need to operate on data outside the current user's tenant
 *
 * Example:
 * @SkipTenantCheck()
 * @Get('all-tenants')
 * async getAllTenants() { ... }
 */
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK_KEY, true);
