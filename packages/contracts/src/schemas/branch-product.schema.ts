import { z } from 'zod';
import { BranchProductStatus } from '../enums/branch-product-status.enum.js';
import { SaleUnit } from '../enums/sale-unit.enum.js';

export const branchProductSchema = z
  .object({
    id: z.string().uuid(),
    branchId: z.string().uuid(),
    productId: z.string().uuid(),
    price: z.number().nonnegative(),
    promotionalPrice: z.number().nonnegative().nullable(),
    isOnSale: z.boolean(),
    isAvailable: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type BranchProduct = z.infer<typeof branchProductSchema>;

export const upsertBranchProductSchema = z
  .object({
    price: z.number().nonnegative('Price must be greater than or equal to 0'),
    promotionalPrice: z.number().nonnegative('Promotional price must be non-negative').nullable().optional(),
    isOnSale: z.boolean().default(false).optional(),
    isAvailable: z.boolean().default(false),
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
      if (data.isOnSale && (!data.promotionalPrice || data.promotionalPrice >= data.price)) {
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

export const branchProductQuerySchema = z
  .object({
    status: z.nativeEnum(BranchProductStatus).optional(),
    search: z.string().trim().optional(),
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(50).optional(),
  })
  .strict();

export type BranchProductQueryDto = z.infer<typeof branchProductQuerySchema>;

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

export type BranchPublicCatalogResponse = z.infer<typeof branchPublicCatalogResponseSchema>;

