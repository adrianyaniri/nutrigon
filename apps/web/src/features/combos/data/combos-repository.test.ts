import { describe, expect, it, vi } from "vitest";
import {
  createHttpCombosRepository,
  createInMemoryCombosRepository,
} from "./combos-repository";

describe("createHttpCombosRepository", () => {
  it("fetches combos for a branch with Authorization header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "combo-1",
          branchId: "branch-uuid",
          name: "Combo Saludable",
          description: "Mix",
          imageUrls: [],
          price: 9900,
          isAvailable: true,
          isActive: true,
          items: [],
        },
      ],
    });

    const repo = createHttpCombosRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const result = await repo.listForBranch("branch-uuid", "jwt-token-123");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/branches/branch-uuid/combos",
      {
        headers: { Authorization: "Bearer jwt-token-123" },
      }
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Combo Saludable");
  });

  it("posts a new combo to POST /api/v1/branches/:branchId/combos", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "combo-2",
        branchId: "branch-uuid",
        name: "Combo Frutos Secos",
        price: 15000,
        isAvailable: true,
        isActive: true,
        items: [],
      }),
    });

    const repo = createHttpCombosRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const newCombo = await repo.createForBranch("branch-uuid", "jwt-token-123", {
      name: "Combo Frutos Secos",
      price: 15000,
      items: [
        { productId: "p-1", quantity: 1 },
        { productId: "p-2", quantity: 1 },
      ],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/branches/branch-uuid/combos",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer jwt-token-123",
        },
        body: JSON.stringify({
          name: "Combo Frutos Secos",
          price: 15000,
          items: [
            { productId: "p-1", quantity: 1 },
            { productId: "p-2", quantity: 1 },
          ],
        }),
      }
    );
    expect(newCombo.id).toBe("combo-2");
  });

  it("uploads an image directly to Cloudflare R2 via presigned URL", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/media/upload-url")) {
        return {
          ok: true,
          json: async () => ({
            uploadUrl: "https://r2.cloudflare.com/upload-target",
            publicUrl: "https://cdn.nutrigon.com/combos/combo-pic.webp",
          }),
        };
      }
      if (url.includes("upload-target") && init?.method === "PUT") {
        return { ok: true };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const repo = createHttpCombosRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const mockFile = new File(["dummy content"], "combo-pic.webp", {
      type: "image/webp",
    });

    const publicUrl = await repo.uploadComboImage("jwt-token-123", mockFile);

    expect(publicUrl).toBe("https://cdn.nutrigon.com/combos/combo-pic.webp");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/media/upload-url",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token-123",
        }),
      })
    );
  });
});

describe("createInMemoryCombosRepository", () => {
  it("enforces at least 2 items when creating a combo", async () => {
    const repo = createInMemoryCombosRepository([]);

    await expect(
      repo.createForBranch("b-origone", "token", {
        name: "Combo Inválido",
        price: 5000,
        items: [{ productId: "p-1", quantity: 1 }],
      })
    ).rejects.toThrow(/al menos 2 productos/i);
  });
});
