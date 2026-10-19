import { z } from 'zod';

export const categorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().min(1),
    orderIndex: z.number().int(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type Category = z.infer<typeof categorySchema>;

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(2, 'Category name must be at least 2 characters'),
    slug: z
      .string()
      .trim()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and dashes'),
    orderIndex: z.number().int().default(0).optional(),
  })
  .strict();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
