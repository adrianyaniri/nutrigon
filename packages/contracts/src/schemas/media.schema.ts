import { z } from 'zod';

export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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
    fileSize: z
      .number()
      .int()
      .positive('File size must be greater than 0 bytes')
      .max(MAX_UPLOAD_FILE_SIZE_BYTES, 'File size exceeds the 5 MB maximum limit')
      .optional(),
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
