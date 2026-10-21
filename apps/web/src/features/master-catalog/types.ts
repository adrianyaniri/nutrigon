import type { SaleUnit } from "@/features/catalog/types";
import type { WeightConfiguration } from "@/features/catalog/lib/portion-pricing";

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

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface MasterProduct extends WeightConfiguration {
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

export interface CreateMasterProductInput extends WeightConfiguration {
  categoryId: string;
  code?: string | null;
  name: string;
  description?: string | null;
  saleUnit: SaleUnit;
  barcode?: string | null;
  imageUrls?: string[];
}

export interface UpdateMasterProductInput extends WeightConfiguration {
  categoryId?: string;
  code?: string | null;
  name?: string;
  description?: string | null;
  saleUnit?: SaleUnit;
  barcode?: string | null;
  imageUrls?: string[];
  isActive?: boolean;
}

export interface MasterCatalogRepository {
  listCategories(): Promise<MasterCategory[]>;
  createCategory(token: string, input: CreateCategoryInput): Promise<MasterCategory>;
  updateCategory(
    token: string,
    categoryId: string,
    input: UpdateCategoryInput
  ): Promise<MasterCategory>;
  deleteCategory(token: string, categoryId: string): Promise<MasterCategory>;
  listProducts(
    token: string,
    query?: MasterProductsQuery
  ): Promise<PaginatedMasterProducts>;
  createProduct(token: string, input: CreateMasterProductInput): Promise<MasterProduct>;
  updateProduct(
    token: string,
    productId: string,
    input: UpdateMasterProductInput
  ): Promise<MasterProduct>;
  deleteProduct(token: string, productId: string): Promise<MasterProduct>;
  uploadProductImage(token: string, file: File): Promise<string>;
}
