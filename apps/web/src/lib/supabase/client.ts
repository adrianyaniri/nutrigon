import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { envConfig } from "@/app/config/env";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (!envConfig.isSupabaseConfigured) {
    return null;
  }

  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = envConfig.env;

  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    return null;
  }

  supabaseInstance = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

export const supabase = getSupabaseClient();
