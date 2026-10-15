import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';
import { Role, type AuthUser, type LoginResponse } from '@nutrigon/contracts';
import type { LoginDto } from './dto/login.dto.js';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Partial<Record<keyof AuthService, any>>;

  beforeEach(() => {
    mockAuthService = {
      login: vi.fn(),
      validateUserById: vi.fn(),
    };
    controller = new AuthController(mockAuthService as AuthService);
  });

  const mockUser: AuthUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@nutrigon.com',
    fullName: 'General Admin',
    role: Role.ADMIN_GENERAL,
    branchId: null,
  };

  const mockLoginResponse: LoginResponse = {
    accessToken: 'signed-jwt-token',
    user: mockUser,
  };

  describe('login', () => {
    it('should call authService.login and return LoginResponse', async () => {
      const loginDto: LoginDto = {
        email: 'admin@nutrigon.com',
        password: 'Password123!',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockLoginResponse);
    });
  });

  describe('getMe', () => {
    it('should return the current authenticated user', () => {
      const result = controller.getMe(mockUser);

      expect(result).toEqual(mockUser);
    });
  });
});
