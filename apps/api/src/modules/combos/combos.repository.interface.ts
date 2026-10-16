import type { SaleUnit } from '@nutrigon/contracts';

export const COMBOS_REPOSITORY = Symbol('COMBOS_REPOSITORY');

export interface ComboItemRow {
  productId: string;
  productName: string;
  quantity: string;
  saleUnit: SaleUnit | string;
}

export interface BranchComboRecord {
  id: string;
  branchId: string;
  name: string;
  description: string | null;
  imageUrls: string[];
  price: string;
  isAvailable: boolean;
  isActive: boolean;
  items: ComboItemRow[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBranchComboData {
  branchId: string;
  name: string;
  description: string | null;
  imageUrls: string[];
  price: string;
  isAvailable: boolean;
  items: Array<{
    productId: string;
    quantity: string;
  }>;
}

export interface UpdateBranchComboData {
  name?: string;
  description?: string | null;
  imageUrls?: string[];
  price?: string;
  isAvailable?: boolean;
  items?: Array<{
    productId: string;
    quantity: string;
  }>;
}

export interface ICombosRepository {
  findByBranch(branchId: string): Promise<BranchComboRecord[]>;
  findPublishedByBranch(branchId: string): Promise<BranchComboRecord[]>;
  findByIdAndBranch(comboId: string, branchId: string): Promise<BranchComboRecord | null>;
  create(data: CreateBranchComboData): Promise<BranchComboRecord>;
  update(
    comboId: string,
    branchId: string,
    data: UpdateBranchComboData,
  ): Promise<BranchComboRecord | null>;
  softDelete(comboId: string, branchId: string): Promise<BranchComboRecord | null>;
}
