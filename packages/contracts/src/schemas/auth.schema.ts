import { z } from 'zod';
import { Role } from '../enums/role.enum.js';

export const loginSchema = z
  .object({
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .strict();

export type LoginDto = z.infer<typeof loginSchema>;

export const authUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string().min(1),
    role: z.nativeEnum(Role),
    branchId: z.string().uuid().nullable(),
  })
  .strict();

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResponseSchema = z
  .object({
    accessToken: z.string(),
    user: authUserSchema,
  })
  .strict();

export type LoginResponse = z.infer<typeof loginResponseSchema>;
