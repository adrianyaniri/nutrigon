import { describe, it, expect, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import argon2 from 'argon2';
import { Role } from '@nutrigon/contracts';
import { UsersService } from './users.service.js';
import type { IUsersRepository } from '../auth/users.repository.interface.js';
import type { UserEntity } from '../../core/database/schema/users.js';

class InMemoryUsersRepository implements IUsersRepository {
  public users: UserEntity[] = [];

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async listByBranch(branchId: string): Promise<UserEntity[]> {
    return this.users.filter((u) => u.branchId === branchId);
  }

  async create(user: any): Promise<UserEntity> {
    const created: UserEntity = {
      id: user.id || 'new-uuid',
      email: user.email,
      fullName: user.fullName,
      passwordHash: user.passwordHash,
      role: user.role,
      branchId: user.branchId ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(created);
    return created;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.passwordHash = passwordHash;
      user.updatedAt = new Date();
    }
  }
}

describe('UsersService (Unit Tests)', () => {
  let service: UsersService;
  let repo: InMemoryUsersRepository;

  beforeEach(() => {
    repo = new InMemoryUsersRepository();
    service = new UsersService(repo);
  });

  describe('listByBranch', () => {
    it('should return sanitized users for the given branch', async () => {
      repo.users.push(
        {
          id: 'u-1',
          email: 'origone1@nutrigon.com',
          fullName: 'Encargado 1',
          passwordHash: 'hash1',
          role: 'BRANCH_ADMIN',
          branchId: 'b-origone',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'u-2',
          email: 'pedro@nutrigon.com',
          fullName: 'Encargado 2',
          passwordHash: 'hash2',
          role: 'BRANCH_ADMIN',
          branchId: 'b-pedro',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );

      const list = await service.listByBranch('b-origone');
      expect(list).toHaveLength(1);
      expect(list[0]!.email).toBe('origone1@nutrigon.com');
      // Must not expose passwordHash
      expect((list[0] as any).passwordHash).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should create user, hash password, and return sanitized user', async () => {
      const res = await service.createUser({
        email: 'nuevo.encargado@nutrigon.com',
        fullName: 'Nuevo Encargado',
        password: 'Password123!',
        role: Role.BRANCH_ADMIN,
        branchId: 'b-origone',
      });

      expect(res.id).toBeDefined();
      expect(res.email).toBe('nuevo.encargado@nutrigon.com');
      expect((res as any).passwordHash).toBeUndefined();

      const inDb = await repo.findByEmail('nuevo.encargado@nutrigon.com');
      expect(inDb).toBeDefined();
      expect(await argon2.verify(inDb!.passwordHash, 'Password123!')).toBe(true);
    });

    it('should throw ConflictException if email is already registered', async () => {
      repo.users.push({
        id: 'u-existing',
        email: 'existente@nutrigon.com',
        fullName: 'Existente',
        passwordHash: 'hash',
        role: 'BRANCH_ADMIN',
        branchId: 'b-origone',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.createUser({
          email: 'existente@nutrigon.com',
          fullName: 'Duplicado',
          password: 'Password123!',
          role: Role.BRANCH_ADMIN,
          branchId: 'b-origone',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('resetPassword', () => {
    it('should reset user password directly without needing old password', async () => {
      const oldHash = await argon2.hash('OldClave123!');
      repo.users.push({
        id: 'u-target',
        email: 'target@nutrigon.com',
        fullName: 'Target User',
        passwordHash: oldHash,
        role: 'BRANCH_ADMIN',
        branchId: 'b-origone',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.resetPassword('u-target', {
        newPassword: 'BrandNewPassword123!',
      });

      expect(res.success).toBe(true);

      const inDb = await repo.findById('u-target');
      expect(await argon2.verify(inDb!.passwordHash, 'BrandNewPassword123!')).toBe(true);
    });

    it('should throw NotFoundException if user is not found', async () => {
      await expect(
        service.resetPassword('u-not-found', { newPassword: 'NewPassword123!' })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
