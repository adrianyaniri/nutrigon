import type { SaleUnit } from "@/types/database";

export type { SaleUnit };

export interface CatalogBranch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  openingHours?: string | null;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ComboItemSummary {
  productId: string;
  productName: string;
  quantity: number;
  saleUnit: SaleUnit;
  unitPrice?: number;
}

/**
 * Product as seen by a visitor of a specific branch.
 * `price` is per unit for `UNIT` products and per 1 kg for `WEIGHT` products.
 */
export interface CatalogProduct {
  weightOptionsGrams?: number[];
  defaultWeightGrams?: number;
  priceReferenceGrams?: number;
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  saleUnit: SaleUnit;
  imageUrl: string | null;
  price: number;
  promotionalPrice: number | null;
  isFeatured?: boolean;
  isCombo?: boolean;
  comboItems?: ComboItemSummary[];
}

export interface BranchCatalog {
  branch: CatalogBranch;
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

export type SortOption = "popular" | "price-asc" | "price-desc" | "name-asc";

export interface CatalogFilters {
  search: string;
  categorySlug: string | null;
  sort: SortOption;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  search: "",
  categorySlug: null,
  sort: "popular",
};

export interface CategoryOption {
  /** `null` represents the "all products" option. */
  value: string | null;
  label: string;
  count: number;
}
