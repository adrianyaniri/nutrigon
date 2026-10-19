import { describe, expect, it, vi } from "vitest";
import {
  createHttpBranchPricingRepository,
  createInMemoryBranchPricingRepository,
} from "./branch-pricing-repository";

describe("createHttpBranchPricingRepository", () => {
  it("requests paginated branch products with Authorization header and query filters", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    });

    const repo = createHttpBranchPricingRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    await repo.listProducts("branch-uuid-1", "jwt-token-123", {
      status: "ACTIVE",
      isOnSale: true,
      search: "almendras",
      page: 2,
      limit: 20,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/branches/branch-uuid-1/products?status=ACTIVE&isOnSale=true&search=almendras&page=2&limit=20",
      {
        headers: { Authorization: "Bearer jwt-token-123" },
      }
    );
  });

  it("sends PUT request to upsert branch product price and availability", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "bp-1",
        branchId: "branch-1",
        productId: "prod-1",
        price: 15000,
        promotionalPrice: null,
        isOnSale: false,
        isAvailable: true,
      }),
    });

    const repo = createHttpBranchPricingRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const res = await repo.upsertProduct("branch-1", "prod-1", "jwt-123", {
      price: 15000,
      isAvailable: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/branches/branch-1/products/prod-1",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer jwt-123",
        },
        body: JSON.stringify({ price: 15000, isAvailable: true }),
      }
    );
    expect(res.price).toBe(15000);
  });

  it("sends PATCH request to activate or deactivate a branch product offer", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "bp-1",
        branchId: "branch-1",
        productId: "prod-1",
        price: 15000,
        promotionalPrice: 12500,
        isOnSale: true,
        isAvailable: true,
      }),
    });

    const repo = createHttpBranchPricingRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const res = await repo.updateOffer("branch-1", "prod-1", "jwt-123", {
      isOnSale: true,
      promotionalPrice: 12500,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/branches/branch-1/products/prod-1/offer",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer jwt-123",
        },
        body: JSON.stringify({ isOnSale: true, promotionalPrice: 12500 }),
      }
    );
    expect(res.isOnSale).toBe(true);
    expect(res.promotionalPrice).toBe(12500);
  });
});

describe("createInMemoryBranchPricingRepository", () => {
  it("validates promotionalPrice < price when activating an offer", async () => {
    const repo = createInMemoryBranchPricingRepository();

    await expect(
      repo.updateOffer("b-origone", "p-almendras", "mock-token", {
        isOnSale: true,
        promotionalPrice: 20000,
      })
    ).rejects.toThrow(/menor al precio regular/i);

    const updated = await repo.updateOffer("b-origone", "p-almendras", "mock-token", {
      isOnSale: true,
      promotionalPrice: 12000,
    });
    expect(updated.isOnSale).toBe(true);
    expect(updated.promotionalPrice).toBe(12000);
  });
});
