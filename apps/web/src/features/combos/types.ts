import type { SaleUnit } from "@/features/catalog/types";

export interface ComboItemInput {
  productId: string;
  quantity: number;
}

export interface ComboDetailItem {
  productId: string;
  productName: string;
  quantity: number;
  saleUnit: SaleUnit;
}

export interface CreateComboInput {
  name: string;
  description?: string | null;
  imageUrls?: string[];
  price: number;
  isAvailable?: boolean;
  items: ComboItemInput[];
}

export interface UpdateComboInput {
  name?: string;
  description?: string | null;
  imageUrls?: string[];
  price?: number;
  isAvailable?: boolean;
  items?: ComboItemInput[];
}

export interface BranchComboAdminItem {
  id: string;
  branchId: string;
  name: string;
  description: string | null;
  imageUrls: string[];
  price: number;
  isAvailable: boolean;
  isActive: boolean;
  items: ComboDetailItem[];
  createdAt?: string;
  updatedAt?: string;
}
