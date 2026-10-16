import { z } from 'zod';
import { SaleUnit } from '../enums/sale-unit.enum.js';

export const comboItemSchema = z
  .object({
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().positive('Quantity must be greater than 0'),
  })
  .strict();

export type ComboItem = z.infer<typeof comboItemSchema>;

export const comboDetailItemSchema = z
  .object({
    productId: z.string().uuid(),
    productName: z.string(),
    quantity: z.number(),
    saleUnit: z.nativeEnum(SaleUnit),
  })
  .strict();

export type ComboDetailItem = z.infer<typeof comboDetailItemSchema>;

export const createComboSchema = z
  .object({
    name: z.string().trim().min(2, 'Combo name must be at least 2 characters').max(150),
    description: z.string().trim().optional().nullable(),
    imageUrls: z.array(z.string().url('Invalid image URL')).default([]),
    price: z.number().positive('Combo price must be greater than 0'),
    isAvailable: z.boolean().default(true).optional(),
    items: z.array(comboItemSchema).min(2, 'A combo must contain at least 2 products'),
  })
  .strict();

export type CreateComboDto = z.infer<typeof createComboSchema>;

export const updateComboSchema = createComboSchema
  .partial()
  .strict();

export type UpdateComboDto = z.infer<typeof updateComboSchema>;

export const branchComboAdminItemSchema = z
  .object({
    id: z.string().uuid(),
    branchId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    imageUrls: z.array(z.string()),
    price: z.number().positive(),
    isAvailable: z.boolean(),
    isActive: z.boolean(),
    items: z.array(comboDetailItemSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type BranchComboAdminItem = z.infer<typeof branchComboAdminItemSchema>;

export const branchComboCatalogItemSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    priceUnitLabel: z.string(),
    imageUrls: z.array(z.string()),
    items: z.array(comboDetailItemSchema),
  })
  .strict();

export type BranchComboCatalogItem = z.infer<typeof branchComboCatalogItemSchema>;
