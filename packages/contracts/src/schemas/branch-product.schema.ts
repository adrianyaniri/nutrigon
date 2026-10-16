import { z } from 'zod';
import { BranchProductStatus } from '../enums/branch-product-status.enum.js';
import { SaleUnit } from '../enums/sale-unit.enum.js';
import { branchComboCatalogItemSchema } from './combo.schema.js';

export const branchProductSchema = z
  .object({
    id: z.string().uuid(),
    branchId: z.string().uuid(),
    productId: z.string().uuid(),
    price: z.number().nonnegative(),
    promotionalPrice: z.number().nonnegative().nullable(),
    isOnSale: z.boolean(),
    isAvailable: z.boolean(),
    isFeatured: z.boolean().default(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type BranchProduct = z.infer<typeof branchProductSchema>;

export const upsertBranchProductSchema = z
  .object({
    price: z.number().nonnegative('Price must be greater than or equal to 0'),
    promotionalPrice: z
      .number()
      .nonnegative('Promotional price must be non-negative')
      .nullable()
      .optional(),
    isOnSale: z.boolean().default(false).optional(),
    isAvailable: z.boolean().default(false),
    isFeatured: z.boolean().default(false).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.isAvailable && data.price <= 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Active products must have a valid price greater than 0',
      path: ['price'],
    },
  )
  .refine(
    (data) => {
      if (
        data.isOnSale &&
        (!data.promotionalPrice || data.promotionalPrice >= data.price)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Promotional price must be less than regular price when on sale',
      path: ['promotionalPrice'],
    },
  );

export type UpsertBranchProductDto = z.infer<typeof upsertBranchProductSchema>;

export const updateBranchProductOfferSchema = z
  .object({
    isOnSale: z.boolean(),
    promotionalPrice: z
      .number()
      .positive('Promotional price must be greater than 0')
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.isOnSale && (!data.promotionalPrice || data.promotionalPrice <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'A positive promotional price is required when activating an offer',
      path: ['promotionalPrice'],
    },
  );

export type UpdateBranchProductOfferDto = z.infer<
  typeof updateBranchProductOfferSchema
>;

export const branchProductQuerySchema = z
  .object({
    status: z.nativeEnum(BranchProductStatus).optional(),
    search: z.string().trim().optional(),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    isOnSale: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    isFeatured: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(50).optional(),
  })
  .strict();

export type BranchProductQueryDto = z.infer<typeof branchProductQuerySchema>;

export const branchProductCountsSchema = z
  .object({
    [BranchProductStatus.ACTIVE]: z.number().int().nonnegative(),
    [BranchProductStatus.INACTIVE]: z.number().int().nonnegative(),
    [BranchProductStatus.UNCONFIGURED]: z.number().int().nonnegative(),
    ON_SALE: z.number().int().nonnegative(),
  })
  .strict();

export type BranchProductCounts = z.infer<typeof branchProductCountsSchema>;

export const branchProductAdminItemSchema = z
  .object({
    productId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    categoryId: z.string().uuid(),
    categoryName: z.string(),
    saleUnit: z.nativeEnum(SaleUnit),
    barcode: z.string().nullable().optional(),
    imageUrls: z.array(z.string()),
    status: z.nativeEnum(BranchProductStatus),
    price: z.number().nullable(),
    promotionalPrice: z.number().nullable(),
    isOnSale: z.boolean(),
    isAvailable: z.boolean(),
    isFeatured: z.boolean().default(false),
  })
  .strict();

export type BranchProductAdminItem = z.infer<typeof branchProductAdminItemSchema>;

export const branchCatalogItemSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    categoryId: z.string().uuid(),
    categoryName: z.string(),
    saleUnit: z.nativeEnum(SaleUnit),
    price: z.number(),
    promotionalPrice: z.number().nullable(),
    isOnSale: z.boolean(),
    isFeatured: z.boolean().default(false),
    priceUnitLabel: z.string(),
    imageUrls: z.array(z.string()),
  })
  .strict();

export type BranchCatalogItem = z.infer<typeof branchCatalogItemSchema>;

export const branchCatalogCategorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  })
  .strict();

export type BranchCatalogCategory = z.infer<typeof branchCatalogCategorySchema>;

export const branchCatalogBranchSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    whatsappNumber: z.string().nullable(),
  })
  .strict();

export type BranchCatalogBranch = z.infer<typeof branchCatalogBranchSchema>;

export const branchPublicCatalogResponseSchema = z
  .object({
    branch: branchCatalogBranchSchema,
    categories: z.array(branchCatalogCategorySchema),
    items: z.array(branchCatalogItemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().min(1),
  })
  .strict();

export type BranchPublicCatalogResponse = z.infer<
  typeof branchPublicCatalogResponseSchema
>;

export const branchPublicOffersResponseSchema = z
  .object({
    branch: branchCatalogBranchSchema,
    products: z.array(branchCatalogItemSchema),
    combos: z.array(branchComboCatalogItemSchema),
  })
  .strict();

export type BranchPublicOffersResponse = z.infer<
  typeof branchPublicOffersResponseSchema
>;
