import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@nutrigon/contracts';
import { Roles } from './roles.decorator.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { BranchAccessGuard } from '../guards/branch-access.guard.js';
import { BranchMutationGuard } from '../guards/branch-mutation.guard.js';

/**
 * Composed decorator ensuring JWT authentication and Role-Based Access Control (RBAC).
 */
export function AuthRoles(...roles: (Role | keyof typeof Role)[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}

/**
 * Composed decorator for multi-branch operations ensuring:
 * 1. JWT authentication
 * 2. Allowed roles: ADMIN_GENERAL (bypass) or BRANCH_ADMIN
 * 3. Strict scope validation: branchId parameter must match token branchId
 */
export function AuthBranchScoped() {
  return applyDecorators(
    Roles(Role.ADMIN_GENERAL, Role.BRANCH_ADMIN),
    UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard),
  );
}

/**
 * Composed decorator for branch mutations (pricing, offers, combos) ensuring:
 * 1. JWT authentication
 * 2. Allowed role: BRANCH_ADMIN only (ADMIN_GENERAL cannot mutate branch operational data)
 * 3. Scope validation: branchId parameter must match token branchId
 */
export function AuthBranchMutate() {
  return applyDecorators(
    Roles(Role.BRANCH_ADMIN),
    UseGuards(JwtAuthGuard, RolesGuard, BranchAccessGuard, BranchMutationGuard),
  );
}
