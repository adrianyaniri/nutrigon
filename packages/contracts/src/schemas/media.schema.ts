import { z } from 'zod';

export const getUploadUrlSchema = z
  .object({
    fileName: z
      .string()
      .trim()
      .min(3)
      .regex(/\.(jpe?g|png|webp)$/i, 'Only JPEG, PNG, and WebP images are allowed'),
    contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
      errorMap: () => ({ message: 'Content type must be image/jpeg, image/png, or image/webp' }),
    }),
    folder: z.enum(['products', 'combos', 'categories']).default('products'),
  })
  .strict();

export type GetUploadUrlDto = z.infer<typeof getUploadUrlSchema>;

export const uploadUrlResponseSchema = z
  .object({
    uploadUrl: z.string().url(),
    publicUrl: z.string().url(),
    key: z.string(),
  })
  .strict();

export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
