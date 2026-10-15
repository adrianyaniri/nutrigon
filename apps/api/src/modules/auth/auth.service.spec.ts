import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import type { IUsersRepository } from './users.repository.interface.js';
import type { UserEntity } from '../../core/database/schema/users.js';

class InMemoryUsersRepository implements IUsersRepository {
  public users: UserEntity[] = [];

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }
}

describe('AuthService (Unit Tests with InMemory Fake Repository)', () => {
  let authService: AuthService;
  let usersRepo: InMemoryUsersRepository;
  let jwtServiceMock: JwtService;

  beforeEach(async () => {
    usersRepo = new InMemoryUsersRepository();
    jwtServiceMock = {
      signAsync: vi.fn().mockResolvedValue('mocked_jwt_token_12345'),
      verifyAsync: vi.fn(),
    } as unknown as JwtService;

    authService = new AuthService(usersRepo, jwtServiceMock);
  });

  it('should authenticate valid ADMIN_GENERAL user and return JWT with sanitized user', async () => {
    const passwordHash = await argon2.hash('Secret123!');
    const mockUser: UserEntity = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@nutrigon.com',
      passwordHash,
      fullName: 'Admin General',
      role: 'ADMIN_GENERAL',
      branchId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersRepo.users.push(mockUser);

    const result = await authService.login({
      email: 'admin@nutrigon.com',
      password: 'Secret123!',
    });

    expect(result).toBeDefined();
    expect(result.accessToken).toBe('mocked_jwt_token_12345');
    expect(result.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      fullName: mockUser.fullName,
      role: 'ADMIN_GENERAL',
      branchId: null,
    });
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
      sub: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      branchId: mockUser.branchId,
    });
  });

  it('should authenticate valid BRANCH_ADMIN with branchId assigned', async () => {
    const passwordHash = await argon2.hash('BranchSecret123!');
    const mockUser: UserEntity = {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'admin.origone@nutrigon.com',
      passwordHash,
      fullName: 'Admin Origone',
      role: 'BRANCH_ADMIN',
      branchId: '33333333-3333-3333-3333-333333333333',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersRepo.users.push(mockUser);

    const result = await authService.login({
      email: 'admin.origone@nutrigon.com',
      password: 'BranchSecret123!',
    });

    expect(result.user.role).toBe('BRANCH_ADMIN');
    expect(result.user.branchId).toBe('33333333-3333-3333-3333-333333333333');
  });

  it('should throw UnauthorizedException when email does not exist', async () => {
    await expect(
      authService.login({
        email: 'nonexistent@nutrigon.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is wrong', async () => {
    const passwordHash = await argon2.hash('CorrectPassword123!');
    usersRepo.users.push({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@nutrigon.com',
      passwordHash,
      fullName: 'Admin General',
      role: 'ADMIN_GENERAL',
      branchId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authService.login({
        email: 'admin@nutrigon.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is inactive (soft deleted)', async () => {
    const passwordHash = await argon2.hash('Secret123!');
    usersRepo.users.push({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'disabled@nutrigon.com',
      passwordHash,
      fullName: 'Disabled Admin',
      role: 'ADMIN_GENERAL',
      branchId: null,
      isActive: false, // Inactive
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authService.login({
        email: 'disabled@nutrigon.com',
        password: 'Secret123!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should validate and sanitize user by id', async () => {
    const mockUser: UserEntity = {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@nutrigon.com',
      passwordHash: 'some_hash',
      fullName: 'Admin General',
      role: 'ADMIN_GENERAL',
      branchId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    usersRepo.users.push(mockUser);

    const user = await authService.validateUserById(mockUser.id);
    expect(user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      fullName: mockUser.fullName,
      role: 'ADMIN_GENERAL',
      branchId: null,
    });
  });

  it('should return null when validateUserById finds inactive or nonexistent user', async () => {
    const user = await authService.validateUserById('nonexistent-id');
    expect(user).toBeNull();
  });
});
