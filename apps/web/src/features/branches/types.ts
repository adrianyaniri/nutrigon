export interface BranchAdminItem {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
}

export interface UpdateBranchInput {
  name?: string;
  slug?: string;
  address?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  isActive?: boolean;
}

export interface BranchesRepository {
  getBranches(token?: string, includeInactive?: boolean): Promise<BranchAdminItem[]>;
  createBranch(input: CreateBranchInput, token: string): Promise<BranchAdminItem>;
  updateBranch(id: string, input: UpdateBranchInput, token: string): Promise<BranchAdminItem>;
  deleteBranch(id: string, token: string): Promise<BranchAdminItem>;
}
