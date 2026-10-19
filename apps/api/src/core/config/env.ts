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

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/nutrigon'), // ggignore
  JWT_SECRET: z.string().min(16).default('nutrigon_default_development_secret_key_12345'), // ggignore
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,https://nutrigon.pages.dev'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('nutrigon-media'),
  R2_PUBLIC_URL: z.string().default('https://media.nutrigon.com'),
  INITIAL_ADMIN_EMAIL: z.string().email().default('admin@nutrigon.com'), // ggignore
  INITIAL_ADMIN_PASSWORD: z.string().min(8).default('AdminNutrigon2026!'), // ggignore
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown> = process.env): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    throw new Error('Environment validation failed');
  }
  return parsed.data;
}

export const env = validateEnv();
