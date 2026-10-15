import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from '@nutrigon/contracts';

describe('RolesGuard (TDD)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any, handlerRoles?: Role[]): ExecutionContext {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(handlerRoles);

    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required on route', () => {
    const context = createMockContext({ role: Role.BRANCH_ADMIN }, undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    const context = createMockContext({ role: Role.ADMIN_GENERAL }, [Role.ADMIN_GENERAL]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should always allow ADMIN_GENERAL even if route specifies BRANCH_ADMIN (Superadmin bypass)', () => {
    const context = createMockContext({ role: Role.ADMIN_GENERAL }, [Role.BRANCH_ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user does not have required role', () => {
    const context = createMockContext({ role: Role.BRANCH_ADMIN }, [Role.ADMIN_GENERAL]);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if request has no user', () => {
    const context = createMockContext(undefined, [Role.ADMIN_GENERAL]);
    expect(guard.canActivate(context)).toBe(false);
  });
});
