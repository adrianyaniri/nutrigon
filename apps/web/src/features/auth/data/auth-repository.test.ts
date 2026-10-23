import { describe, expect, it, vi } from "vitest";
import { requestCurrentUser, requestLogin } from "./auth-repository";

describe("production authentication", () => {
  it("does not accept a simulated login when the API is unavailable", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Network unavailable"));

    await expect(
      requestLogin(
        { email: "admin@nutrigon.com", password: "incorrect" },
        "https://api.nutrigon.ar",
        fetcher
      )
    ).rejects.toThrow("Network unavailable");
  });

  it("does not restore a simulated session when the API is unavailable", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Network unavailable"));

    await expect(
      requestCurrentUser("invalid-token", "https://api.nutrigon.ar", fetcher)
    ).rejects.toThrow("Network unavailable");
  });

  it("preserves invalid-credentials handling", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    await expect(
      requestLogin(
        { email: "person@example.com", password: "incorrect" },
        "https://api.nutrigon.ar",
        fetcher
      )
    ).rejects.toThrow("Credenciales inválidas");
  });

  it("preserves an unauthorized session response", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    await expect(
      requestCurrentUser("expired-token", "https://api.nutrigon.ar", fetcher)
    ).rejects.toThrow("UNAUTHORIZED");
  });
});
