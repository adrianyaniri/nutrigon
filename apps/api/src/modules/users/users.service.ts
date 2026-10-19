import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import argon2 from 'argon2';
import type { UserItem } from '@nutrigon/contracts';
import { USERS_REPOSITORY, type IUsersRepository } from '../auth/users.repository.interface.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import type { UserEntity } from '../../core/database/schema/users.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  private sanitize(user: UserEntity): UserItem {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserItem['role'],
      branchId: user.branchId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async listByBranch(branchId: string): Promise<UserItem[]> {
    const list = await this.usersRepository.listByBranch(branchId);
    return list.map((u) => this.sanitize(u));
  }

  async createUser(dto: CreateUserDto): Promise<UserItem> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.usersRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const created = await this.usersRepository.create({
      email: normalizedEmail,
      fullName: dto.fullName.trim(),
      passwordHash,
      role: dto.role,
      branchId: dto.branchId ?? null,
      isActive: true,
    });

    return this.sanitize(created);
  }

  async resetPassword(
    userId: string,
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const newHash = await argon2.hash(dto.newPassword);
    await this.usersRepository.updatePassword(userId, newHash);

    return {
      success: true,
      message: 'Contraseña restablecida exitosamente.',
    };
  }
}
