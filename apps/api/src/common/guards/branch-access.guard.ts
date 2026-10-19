import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@nutrigon/contracts';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication is required');
    }

    // ADMIN_GENERAL bypasses branch restrictions
    if (user.role === Role.ADMIN_GENERAL) {
      return true;
    }

    const branchId =
      request.params?.branchId ||
      request.params?.id ||
      request.query?.branchId ||
      request.body?.branchId;

    if (!branchId) {
      throw new ForbiddenException('Branch identifier is required for this operation');
    }

    if (user.role !== Role.BRANCH_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    if (!user.branchId || user.branchId !== branchId) {
      throw new ForbiddenException('You do not have permission to access another branch');
    }

    return true;
  }
}
