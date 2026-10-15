import { z } from 'zod';
import { SaleUnit } from '../enums/sale-unit.enum.js';

export const csvBranchRowSchema = z
  .object({
    name: z.string().trim().min(2, 'Branch name must be at least 2 characters'),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    address: z.string().trim().optional().default(''),
    phone: z.string().trim().optional().default(''),
    whatsappNumber: z.string().trim().optional().default(''),
    isActive: z.coerce.boolean().default(true).optional(),
  })
  .strict();

export type CsvBranchRow = z.infer<typeof csvBranchRowSchema>;

export const csvCategoryRowSchema = z
  .object({
    name: z.string().trim().min(2, 'Category name must be at least 2 characters'),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .optional(),
    orderIndex: z.coerce.number().int().default(0).optional(),
    isActive: z.coerce.boolean().default(true).optional(),
  })
  .strict();

export type CsvCategoryRow = z.infer<typeof csvCategoryRowSchema>;

export const csvProductRowSchema = z
  .object({
    code: z.string().trim().optional().nullable(),
    name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
    categorySlug: z.string().trim().min(2, 'Category slug is required'),
    description: z.string().trim().optional().default(''),
    saleUnit: z.nativeEnum(SaleUnit),
    barcode: z.string().trim().optional().nullable(),
    imageUrls: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val ? val.split(';').map((s) => s.trim()).filter(Boolean) : [])),
    isActive: z.coerce.boolean().default(true).optional(),
  })
  .strict();

export type CsvProductRow = z.infer<typeof csvProductRowSchema>;

export const csvImportResultSchema = z
  .object({
    totalRows: z.number().int().nonnegative(),
    importedCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
    errors: z.array(
      z
        .object({
          rowNumber: z.number().int().positive(),
          error: z.string(),
          rawData: z.record(z.unknown()),
        })
        .strict(),
    ),
  })
  .strict();

export type CsvImportResult = z.infer<typeof csvImportResultSchema>;
