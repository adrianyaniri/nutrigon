import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@nutrigon/contracts';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    return data && user ? user[data] : user;
  },
);
