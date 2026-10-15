import { z } from 'zod';

export const branchSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().min(1),
    address: z.string().nullable(),
    phone: z.string().nullable(),
    whatsappNumber: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type Branch = z.infer<typeof branchSchema>;

export const createBranchSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    slug: z
      .string()
      .trim()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and dashes'),
    address: z.string().trim().min(3).optional().nullable(),
    phone: z.string().trim().min(6).optional().nullable(),
    whatsappNumber: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid WhatsApp number format (e.g. 5491112345678)')
      .optional()
      .nullable(),
  })
  .strict();

export type CreateBranchDto = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict();

export type UpdateBranchDto = z.infer<typeof updateBranchSchema>;
