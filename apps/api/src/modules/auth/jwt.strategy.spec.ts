import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, type JwtPayload } from './jwt.strategy.js';
import { Role, type AuthUser } from '@nutrigon/contracts';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const mockAuthService = {
    validateUserById: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new JwtStrategy(mockAuthService as any);
  });

  const validPayload: JwtPayload = {
    sub: '11111111-1111-1111-1111-111111111111',
    email: 'admin@nutrigon.com',
    role: Role.ADMIN_GENERAL,
    branchId: null,
  };

  const mockAuthUser: AuthUser = {
    id: validPayload.sub,
    email: validPayload.email,
    fullName: 'General Admin',
    role: Role.ADMIN_GENERAL,
    branchId: null,
  };

  it('should return user when payload is valid and user exists', async () => {
    mockAuthService.validateUserById.mockResolvedValue(mockAuthUser);

    const result = await strategy.validate(validPayload);

    expect(result).toEqual(mockAuthUser);
    expect(mockAuthService.validateUserById).toHaveBeenCalledWith(validPayload.sub);
  });

  it('should throw UnauthorizedException when user does not exist or is inactive', async () => {
    mockAuthService.validateUserById.mockResolvedValue(null);

    await expect(strategy.validate(validPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
