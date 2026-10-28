import type {
  SaleUnit,
  BranchCatalogCategory,
  BranchProductCounts,
} from '@nutrigon/contracts';
import type { BranchProductEntity } from '../../core/database/schema/branch-products.js';
import type { PaginatedResult } from '../products/products.repository.interface.js';
import type { BranchProductQueryDto } from './dto/branch-product.dto.js';

export const BRANCH_PRODUCTS_REPOSITORY = Symbol('BRANCH_PRODUCTS_REPOSITORY');

export interface BranchWeightOfferRow {
  weightGrams: number;
  promotionalPrice: string;
}

export interface BranchProductAdminRow {
  weightOptionsGrams?: number[];
  defaultWeightGrams?: number;
  priceReferenceGrams?: number;
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
  weightOffers?: BranchWeightOfferRow[];
  isOnSale: boolean | null;
  isAvailable: boolean | null;
  isFeatured: boolean | null;
}

export interface BranchCatalogRow {
  weightOptionsGrams?: number[];
  defaultWeightGrams?: number;
  priceReferenceGrams?: number;
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  saleUnit: SaleUnit | string;
  price: string;
  promotionalPrice: string | null;
  weightOffers?: BranchWeightOfferRow[];
  isOnSale: boolean;
  isFeatured: boolean;
  imageUrls: string[];
}

export interface UpsertBranchProductData {
  price: string;
  promotionalPrice: string | null;
  isOnSale: boolean;
  isAvailable: boolean;
  isFeatured?: boolean;
}

export interface UpdateBranchOfferData {
  promotionalPrice: string | null;
  isOnSale: boolean;
}

export interface IBranchProductsRepository {
  findAdminList(
    branchId: string,
    query: BranchProductQueryDto,
  ): Promise<PaginatedResult<BranchProductAdminRow>>;
  countByStatus(branchId: string): Promise<BranchProductCounts>;
  findByBranchAndProduct(
    branchId: string,
    productId: string,
  ): Promise<BranchProductEntity | null>;
  upsert(
    branchId: string,
    productId: string,
    data: UpsertBranchProductData,
  ): Promise<BranchProductEntity>;
  updateOffer(
    branchProductId: string,
    data: UpdateBranchOfferData,
    weightOffers: BranchWeightOfferRow[],
  ): Promise<BranchProductEntity>;
  findPublished(
    branchId: string,
    query: BranchProductQueryDto,
  ): Promise<PaginatedResult<BranchCatalogRow>>;
  findPublishedCategories(branchId: string): Promise<BranchCatalogCategory[]>;
}
