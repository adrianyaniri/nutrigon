import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import type { LoginDto, LoginResponse, AuthUser } from '@nutrigon/contracts';
import { USERS_REPOSITORY, type IUsersRepository } from './users.repository.interface.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as AuthUser['role'],
      branchId: user.branchId,
    };

    return {
      accessToken,
      user: authUser,
    };
  }

  async validateUserById(id: string): Promise<AuthUser | null> {
    const user = await this.usersRepository.findById(id);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as AuthUser['role'],
      branchId: user.branchId,
    };
  }

  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    const isCurrentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isCurrentValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.usersRepository.updatePassword(userId, newHash);

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  }
}

