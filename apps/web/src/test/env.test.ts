import { describe, it, expect } from "vitest";
import { envConfig } from "@/app/config/env";

describe("Environment Configuration", () => {
  it("should have parsed default app name and environment", () => {
    expect(envConfig.env.VITE_APP_NAME).toBeDefined();
    expect(envConfig.env.VITE_APP_ENV).toBeDefined();
  });

  it("should report missing or placeholder supabase variables gracefully", () => {
    // In test / clean env without .env.local, it should report missingVars or false without throwing
    expect(typeof envConfig.isSupabaseConfigured).toBe("boolean");
    expect(Array.isArray(envConfig.missingVars)).toBe(true);
  });
});
