import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UsersData } from '../../users/users.validation';

export const CurrentUser = createParamDecorator(
  (
    data: keyof Omit<UsersData, 'password' | 'refreshToken'> | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
