import { describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { BranchAccessGuard } from './branch-access.guard.js';
import { Role } from '@nutrigon/contracts';

describe('BranchAccessGuard (TDD - Multi-Branch Segregation)', () => {
  let guard: BranchAccessGuard;

  beforeEach(() => {
    guard = new BranchAccessGuard();
  });

  function createMockContext(user: any, params: Record<string, string> = {}): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should always allow ADMIN_GENERAL regardless of branchId parameter (Bypass global)', () => {
    const context = createMockContext(
      { role: Role.ADMIN_GENERAL, branchId: null },
      { branchId: 'any-branch-uuid' },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow BRANCH_ADMIN if route branchId matches user.branchId', () => {
    const branchId = 'origone-branch-uuid';
    const context = createMockContext(
      { role: Role.BRANCH_ADMIN, branchId },
      { branchId },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if BRANCH_ADMIN attempts to access another branch', () => {
    const context = createMockContext(
      { role: Role.BRANCH_ADMIN, branchId: 'origone-branch-uuid' },
      { branchId: 'pedrodiaz-branch-uuid' },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if route has no branchId or user is missing', () => {
    const context = createMockContext(undefined, { branchId: 'some-uuid' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
