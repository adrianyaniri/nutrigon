import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

// Load .env automatically if present using native Node 20+ process.loadEnvFile
function loadEnvFile(): void {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/api/.env'),
    path.resolve(import.meta.dirname, '../../../../.env'),
    path.resolve(import.meta.dirname, '../../.env'),
  ];
  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) {
      try {
        process.loadEnvFile(candidate);
        break;
      } catch {
        // Continue searching if file cannot be read
      }
    }
  }
}

loadEnvFile();

export const DEFAULT_DEVELOPMENT_JWT_SECRET =
  'nutrigon_default_development_secret_key_12345';

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).optional(),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,https://nutrigon.pages.dev'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('nutrigon-media'),
  R2_PUBLIC_URL: z.string().default('https://media.nutrigon.com'),
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(12).optional(),
});

export const envSchema = baseEnvSchema.superRefine((config, context) => {
  if (config.NODE_ENV === 'development') return;

  if (!config.DATABASE_URL) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATABASE_URL'],
      message: 'DATABASE_URL must be explicitly configured outside development',
    });
  }

  if (!config.JWT_SECRET || config.JWT_SECRET === DEFAULT_DEVELOPMENT_JWT_SECRET) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'JWT_SECRET must be explicitly configured in production',
    });
    return;
  }

  if (config.NODE_ENV === 'production' && config.JWT_SECRET.length < 64) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'JWT_SECRET must contain at least 64 characters in production',
    });
  }
}).transform((config) => ({
  ...config,
  DATABASE_URL: config.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/nutrigon',
  JWT_SECRET: config.JWT_SECRET ?? DEFAULT_DEVELOPMENT_JWT_SECRET,
}));

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown> = process.env): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    console.error('Invalid environment variables');
    throw new Error('Environment validation failed');
  }
  return parsed.data;
}

export const env = validateEnv();
