import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { BranchMutationGuard } from './branch-mutation.guard.js';
import { Role } from '@nutrigon/contracts';

describe('BranchMutationGuard (TDD - Role Restriction for Branch Mutations)', () => {
  let guard: BranchMutationGuard;

  beforeEach(() => {
    guard = new BranchMutationGuard();
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should throw ForbiddenException if user is ADMIN_GENERAL', () => {
    const context = createMockContext({
      role: Role.ADMIN_GENERAL,
      id: 'admin-gen-id',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      /General administrators are not permitted to modify branch product pricing, offers, or combos/i,
    );
  });

  it('should allow BRANCH_ADMIN to perform mutations', () => {
    const context = createMockContext({
      role: Role.BRANCH_ADMIN,
      id: 'branch-admin-id',
      branchId: 'origone-id',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is missing', () => {
    const context = createMockContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
