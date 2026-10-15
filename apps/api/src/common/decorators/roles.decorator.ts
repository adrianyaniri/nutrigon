import { SetMetadata } from '@nestjs/common';
import type { Role } from '@nutrigon/contracts';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (Role | keyof typeof Role)[]) => SetMetadata(ROLES_KEY, roles);
