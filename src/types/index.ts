export type BranchId = "sucursal-1" | "sucursal-2" | "sucursal-3";

export interface BranchInfo {
  id: BranchId;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export type UserRole = "admin" | "branch_staff" | "viewer";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branchId?: BranchId;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
