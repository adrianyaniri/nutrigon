import type {
  UserItem,
  CreateUserDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "@nutrigon/contracts";

export type { UserItem, CreateUserDto, ResetPasswordDto, ChangePasswordDto };

export interface UsersRepository {
  listByBranch(branchId: string, token: string): Promise<UserItem[]>;
  createUser(input: CreateUserDto, token: string): Promise<UserItem>;
  resetPassword(
    userId: string,
    newPassword: string,
    token: string
  ): Promise<{ success: boolean; message: string }>;
  changePassword(
    data: ChangePasswordDto,
    token: string
  ): Promise<{ success: boolean; message: string }>;
}
