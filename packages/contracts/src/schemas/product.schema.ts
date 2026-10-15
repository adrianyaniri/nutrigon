import { z } from 'zod';
import { SaleUnit } from '../enums/sale-unit.enum.js';

export const productSchema = z
  .object({
    id: z.string().uuid(),
    categoryId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().nullable(),
    saleUnit: z.nativeEnum(SaleUnit),
    imageUrls: z.array(z.string().url()),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type Product = z.infer<typeof productSchema>;

export const createProductSchema = z
  .object({
    categoryId: z.string().uuid('Invalid category ID'),
    name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
    description: z.string().trim().optional().nullable(),
    saleUnit: z.nativeEnum(SaleUnit),
    imageUrls: z.array(z.string().url('Invalid image URL')).default([]),
  })
  .strict();

export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const productQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    categoryId: z.string().uuid().optional(),
    isActive: z.preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  })
  .strict();

export type ProductQueryDto = z.infer<typeof productQuerySchema>;
