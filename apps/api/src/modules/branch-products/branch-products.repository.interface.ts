import type {
  BranchProductStatus,
  SaleUnit,
  BranchCatalogCategory,
} from '@nutrigon/contracts';
import type { BranchProductEntity } from '../../core/database/schema/branch-products.js';
import type { PaginatedResult } from '../products/products.repository.interface.js';
import type { BranchProductQueryDto } from './dto/branch-product.dto.js';

export const BRANCH_PRODUCTS_REPOSITORY = Symbol('BRANCH_PRODUCTS_REPOSITORY');

export interface BranchProductAdminRow {
  productId: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  saleUnit: SaleUnit | string;
  barcode: string | null;
  imageUrls: string[];
  branchProductId: string | null;
  price: string | null;
  promotionalPrice: string | null;
  isOnSale: boolean | null;
  isAvailable: boolean | null;
}

export interface BranchCatalogRow {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  saleUnit: SaleUnit | string;
  price: string;
  promotionalPrice: string | null;
  isOnSale: boolean;
  imageUrls: string[];
}

export interface UpsertBranchProductData {
  price: string;
  promotionalPrice: string | null;
  isOnSale: boolean;
  isAvailable: boolean;
}

export interface IBranchProductsRepository {
  findAdminList(
    branchId: string,
    query: BranchProductQueryDto,
  ): Promise<PaginatedResult<BranchProductAdminRow>>;
  countByStatus(branchId: string): Promise<Record<BranchProductStatus, number>>;
  upsert(
    branchId: string,
    productId: string,
    data: UpsertBranchProductData,
  ): Promise<BranchProductEntity>;
  findPublished(
    branchId: string,
    query: BranchProductQueryDto,
  ): Promise<PaginatedResult<BranchCatalogRow>>;
  findPublishedCategories(branchId: string): Promise<BranchCatalogCategory[]>;
}
