import { z } from 'zod';
import { Role } from '../enums/role.enum.js';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  })
  .strict();

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const createUserSchema = z
  .object({
    email: z.string().trim().email('Email inválido'),
    fullName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    password: z.string().min(6, 'La contraseña inicial debe tener al menos 6 caracteres'),
    role: z.nativeEnum(Role).default(Role.BRANCH_ADMIN),
    branchId: z.string().uuid('ID de sucursal inválido').nullable().optional(),
  })
  .strict();

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  })
  .strict();

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const userItemSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string(),
    role: z.nativeEnum(Role),
    branchId: z.string().uuid().nullable(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type UserItem = z.infer<typeof userItemSchema>;
