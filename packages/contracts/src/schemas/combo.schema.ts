import { z } from 'zod';
import { SaleUnit } from '../enums/sale-unit.enum.js';

export const comboItemSchema = z
  .object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().positive('Quantity must be greater than 0'),
  })
  .strict();

export type ComboItem = z.infer<typeof comboItemSchema>;

export const comboSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().nullable(),
    imageUrls: z.array(z.string().url()),
    isActive: z.boolean(),
    items: z.array(comboItemSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type Combo = z.infer<typeof comboSchema>;

export const createComboSchema = z
  .object({
    name: z.string().trim().min(2, 'Combo name must be at least 2 characters'),
    description: z.string().trim().optional().nullable(),
    imageUrls: z.array(z.string().url('Invalid image URL')).default([]),
    items: z.array(comboItemSchema).min(2, 'A combo must contain at least 2 products'),
  })
  .strict();

export type CreateComboDto = z.infer<typeof createComboSchema>;

export const updateComboSchema = createComboSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateComboDto = z.infer<typeof updateComboSchema>;

export const upsertBranchComboSchema = z
  .object({
    price: z.number().positive('Combo price must be greater than 0'),
    isAvailable: z.boolean().default(false),
  })
  .strict();

export type UpsertBranchComboDto = z.infer<typeof upsertBranchComboSchema>;

export const branchComboSchema = z
  .object({
    id: z.string().uuid(),
    branchId: z.string().uuid(),
    comboId: z.string().uuid(),
    price: z.number().positive(),
    isAvailable: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type BranchCombo = z.infer<typeof branchComboSchema>;

export const branchComboCatalogItemSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    priceUnitLabel: z.string(),
    imageUrls: z.array(z.string()),
    items: z.array(
      z
        .object({
          productId: z.string().uuid(),
          productName: z.string(),
          quantity: z.number(),
          saleUnit: z.nativeEnum(SaleUnit),
        })
        .strict(),
    ),
  })
  .strict();

export type BranchComboCatalogItem = z.infer<typeof branchComboCatalogItemSchema>;
