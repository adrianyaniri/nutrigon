import type { SaleUnit } from "@/features/catalog/types";

export interface MasterCategory {
  id: string;
  name: string;
  slug: string;
  orderIndex: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  orderIndex?: number;
}

export interface MasterProduct {
  id: string;
  categoryId: string;
  code: string | null;
  name: string;
  description: string | null;
  saleUnit: SaleUnit;
  barcode: string | null;
  imageUrls: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedMasterProducts {
  items: MasterProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MasterProductsQuery {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMasterProductInput {
  categoryId: string;
  code?: string | null;
  name: string;
  description?: string | null;
  saleUnit: SaleUnit;
  barcode?: string | null;
  imageUrls?: string[];
}

export interface UpdateMasterProductInput {
  categoryId?: string;
  code?: string | null;
  name?: string;
  description?: string | null;
  saleUnit?: SaleUnit;
  barcode?: string | null;
  imageUrls?: string[];
  isActive?: boolean;
}
