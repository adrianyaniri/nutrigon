import { z } from "zod";
import { SaleUnit } from "../enums/sale-unit.enum.js";

export const DEFAULT_WEIGHT_OPTIONS_GRAMS = [100, 250, 500, 1000];
export const productWeightFields = {
  weightOptionsGrams: z
    .array(z.number().int().positive().max(1000000))
    .min(1)
    .max(50)
    .refine((values) => new Set(values).size === values.length, "Weights must be unique")
    .transform((values) => [...values].sort((a, b) => a - b))
    .optional(),
  defaultWeightGrams: z.number().int().positive().max(1000000).optional(),
  priceReferenceGrams: z.union([z.literal(100), z.literal(1000)]).optional(),
};

export const productWeightConfigSchema = z
  .object(productWeightFields)
  .superRefine((data, ctx) => {
    const options = data.weightOptionsGrams ?? DEFAULT_WEIGHT_OPTIONS_GRAMS;
    if (!options.includes(data.defaultWeightGrams ?? 250)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultWeightGrams"],
        message: "Default weight must be one of the available weights",
      });
    }
  });

export const productSchema = z
  .object({
    id: z.string().uuid(),
    categoryId: z.string().uuid(),
    code: z.string().trim().nullable().optional(),
    name: z.string().min(1),
    description: z.string().nullable(),
    saleUnit: z.nativeEnum(SaleUnit),
    ...productWeightFields,
    barcode: z.string().trim().nullable().optional(),
    imageUrls: z.array(z.string().url()),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type Product = z.infer<typeof productSchema>;

const createProductObjectSchema = z
  .object({
    categoryId: z.string().uuid("Invalid category ID"),
    code: z.string().trim().optional().nullable(),
    name: z.string().trim().min(2, "Product name must be at least 2 characters"),
    description: z.string().trim().optional().nullable(),
    saleUnit: z.nativeEnum(SaleUnit),
    ...productWeightFields,
    barcode: z.string().trim().optional().nullable(),
    imageUrls: z.array(z.string().url("Invalid image URL")).default([]),
  })
  .strict();

export const createProductSchema = createProductObjectSchema.superRefine((data, ctx) => {
  if (data.saleUnit !== SaleUnit.WEIGHT) return;
  const result = productWeightConfigSchema.safeParse(data);
  if (!result.success) result.error.issues.forEach((issue) => ctx.addIssue(issue));
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductObjectSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.weightOptionsGrams &&
      data.defaultWeightGrams !== undefined &&
      !data.weightOptionsGrams.includes(data.defaultWeightGrams)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["defaultWeightGrams"],
        message: "Default weight must be one of the available weights",
      });
    }
  });

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const productQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    categoryId: z.string().uuid().optional(),
    code: z.string().trim().optional(),
    barcode: z.string().trim().optional(),
    isActive: z.preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  })
  .strict();

export type ProductQueryDto = z.infer<typeof productQuerySchema>;
