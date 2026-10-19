import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@nutrigon/contracts';

/**
 * Guard that strictly prevents ADMIN_GENERAL from mutating branch operational data
 * (pricing, offers, combos). General administrators operate in read-only / audit mode for branches.
 */
@Injectable()
export class BranchMutationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication is required');
    }

    if (user.role === Role.ADMIN_GENERAL) {
      throw new ForbiddenException(
        'General administrators are not permitted to modify branch product pricing, offers, or combos',
      );
    }

    return true;
  }
}
