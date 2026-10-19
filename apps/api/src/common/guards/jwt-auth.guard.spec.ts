import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const createMockContext = () => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if endpoint is marked as @Public()', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext(true);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should call super.canActivate if endpoint is not marked as @Public()', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const superCanActivateSpy = vi
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
    const context = createMockContext(false);

    const result = guard.canActivate(context);

    expect(superCanActivateSpy).toHaveBeenCalledWith(context);
    expect(result).toBe(true);
  });
});
