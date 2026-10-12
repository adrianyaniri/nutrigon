import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL").optional(),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "VITE_SUPABASE_ANON_KEY cannot be empty")
    .optional(),
  VITE_APP_NAME: z.string().default("Nutrigon Dietética"),
  VITE_APP_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
});

export type AppEnv = z.infer<typeof envSchema>;

function parseEnv(): {
  env: AppEnv;
  isSupabaseConfigured: boolean;
  missingVars: string[];
} {
  const rawEnv = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
  };

  const parsed = envSchema.safeParse(rawEnv);

  const missingVars: string[] = [];
  const url = rawEnv.VITE_SUPABASE_URL;
  const key = rawEnv.VITE_SUPABASE_ANON_KEY;

  const isPlaceholderUrl = !url || url.includes("your-project-id.supabase.co");
  const isPlaceholderKey = !key || key.includes("example-anon-key-placeholder");

  if (isPlaceholderUrl) {
    missingVars.push("VITE_SUPABASE_URL");
  }
  if (isPlaceholderKey) {
    missingVars.push("VITE_SUPABASE_ANON_KEY");
  }

  const isSupabaseConfigured = missingVars.length === 0;

  if (!parsed.success) {
    console.warn("Environment validation warning:", parsed.error.format());
    return {
      env: {
        VITE_APP_NAME: "Nutrigon Dietética",
        VITE_APP_ENV: "development",
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_ANON_KEY: key,
      },
      isSupabaseConfigured: false,
      missingVars,
    };
  }

  return {
    env: parsed.data,
    isSupabaseConfigured,
    missingVars,
  };
}

export const envConfig = parseEnv();
