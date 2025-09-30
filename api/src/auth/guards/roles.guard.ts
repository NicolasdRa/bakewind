import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Define role hierarchy
    const roleHierarchy = {
      VIEWER: 0,
      CASHIER: 1,
      BAKER: 2,
      HEAD_BAKER: 3,
      PASTRY_CHEF: 3,
      HEAD_PASTRY_CHEF: 4,
      MANAGER: 5,
      ADMIN: 6,
      GUEST: 0,
      CUSTOMER: 0,
    };

    const userRoleLevel =
      roleHierarchy[user.role as keyof typeof roleHierarchy] ?? 0;
    const requiredRoleLevel = Math.min(
      ...requiredRoles.map(
        (role) => roleHierarchy[role as keyof typeof roleHierarchy] ?? 0,
      ),
    );

    return userRoleLevel >= requiredRoleLevel;
  }
}
