import type { UserEntity, NewUserEntity } from '../../core/database/schema/users.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface IUsersRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  listByBranch(branchId: string): Promise<UserEntity[]>;
  create(user: NewUserEntity): Promise<UserEntity>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

