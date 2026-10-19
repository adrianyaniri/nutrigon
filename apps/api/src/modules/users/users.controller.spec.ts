import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role, type UserItem } from '@nutrigon/contracts';
import { UsersController } from './users.controller.js';
import type { UsersService } from './users.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: Partial<Record<keyof UsersService, any>>;

  beforeEach(() => {
    mockUsersService = {
      listByBranch: vi.fn(),
      createUser: vi.fn(),
      resetPassword: vi.fn(),
    };
    controller = new UsersController(mockUsersService as UsersService);
  });

  const mockUserItem: UserItem = {
    id: 'u-1',
    email: 'origone@nutrigon.com',
    fullName: 'Encargado Origone',
    role: Role.BRANCH_ADMIN,
    branchId: 'b-origone',
    isActive: true,
    createdAt: '2026-10-15T20:00:00.000Z',
    updatedAt: '2026-10-15T20:00:00.000Z',
  };

  describe('listByBranch', () => {
    it('should call usersService.listByBranch with branchId query param', async () => {
      mockUsersService.listByBranch.mockResolvedValue([mockUserItem]);

      const result = await controller.listByBranch('b-origone');

      expect(mockUsersService.listByBranch).toHaveBeenCalledWith('b-origone');
      expect(result).toEqual([mockUserItem]);
    });
  });

  describe('createUser', () => {
    it('should call usersService.createUser with DTO', async () => {
      const dto: CreateUserDto = {
        email: 'nuevo@nutrigon.com',
        fullName: 'Nuevo',
        password: 'Password123!',
        role: Role.BRANCH_ADMIN,
        branchId: 'b-origone',
      };
      mockUsersService.createUser.mockResolvedValue(mockUserItem);

      const result = await controller.createUser(dto);

      expect(mockUsersService.createUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUserItem);
    });
  });

  describe('resetPassword', () => {
    it('should call usersService.resetPassword with id and DTO', async () => {
      const dto: ResetPasswordDto = {
        newPassword: 'NewPassword123!',
      };
      mockUsersService.resetPassword.mockResolvedValue({
        success: true,
        message: 'Contraseña restablecida exitosamente.',
      });

      const result = await controller.resetPassword('u-1', dto);

      expect(mockUsersService.resetPassword).toHaveBeenCalledWith('u-1', dto);
      expect(result).toEqual({
        success: true,
        message: 'Contraseña restablecida exitosamente.',
      });
    });
  });
});
