import { describe, expect, it, vi } from "vitest";
import { createHttpCatalogRepository, mockCatalogRepository } from "./catalog-repository";

const page = {
  branch: {
    id: "b-vergara",
    name: "Nutrigon Vergara",
    slug: "vergara",
    address: "Av. Vergara 2395",
    phone: null,
    whatsappNumber: null,
  },
  categories: [
    { id: "cat-1", name: "Semillas", slug: "semillas", count: 60, offersCount: 3 },
  ],
  items: [
    {
      id: "prod-1",
      categoryId: "cat-1",
      name: "Ch�a",
      description: null,
      saleUnit: "WEIGHT" as const,
      imageUrls: [],
      price: 12000,
      promotionalPrice: null,
      isOnSale: false,
    },
  ],
  total: 48,
  page: 2,
  limit: 24,
  totalPages: 2,
};

describe("createHttpCatalogRepository", () => {
  it("returns full branch category counts regardless of page or filters", async () => {
    const first = await mockCatalogRepository.getBranchCatalogPage("centro", {
      page: 1,
      limit: 1,
    });
    const filtered = await mockCatalogRepository.getBranchCatalogPage("centro", {
      page: 2,
      limit: 1,
      categorySlug: "suplementos",
      search: "colágeno",
    });
    expect(first.products).toHaveLength(1);
    expect(filtered.products).toHaveLength(0);
    expect(first.categories[0]).toMatchObject({ count: 4, offersCount: 1 });
    expect(filtered.categories).toEqual(first.categories);
    const sur = await mockCatalogRepository.getBranchCatalogPage("sur", {
      page: 1,
      limit: 1,
    });
    expect(sur.categories[0]).toMatchObject({ count: 3, offersCount: 1 });
  });
  it("fetches active branches from the public endpoint", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { ...page.branch, isActive: true },
        { ...page.branch, id: "inactive", slug: "inactive", isActive: false },
      ],
    });
    const repository = createHttpCatalogRepository(
      "http://localhost:3000",
      fetchFn as typeof fetch
    );

    await expect(repository.getBranches()).resolves.toEqual([page.branch]);
    expect(fetchFn).toHaveBeenCalledWith("http://localhost:3000/api/v1/branches");
  });

  it("requests one filtered catalog page without preloading remaining pages", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => page });
    const repository = createHttpCatalogRepository(
      "http://localhost:3000",
      fetchFn as typeof fetch
    );

    const catalog = await repository.getBranchCatalogPage("vergara", {
      page: 2,
      limit: 24,
      search: "chia",
      categorySlug: "semillas",
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/branches/vergara/catalog?page=2&limit=24&search=chia&categorySlug=semillas"
    );
    expect(catalog).toMatchObject({
      categories: page.categories,
      page: 2,
      limit: 24,
      total: 48,
      totalPages: 2,
      products: [{ id: "prod-1", imageUrl: expect.any(String) }],
    });
  });

  it("sends offer filtering to the API", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => page });
    const repository = createHttpCatalogRepository("", fetchFn as typeof fetch);

    await repository.getBranchCatalogPage("vergara", {
      page: 1,
      limit: 24,
      isOnSale: true,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/v1/branches/vergara/catalog?page=1&limit=24&isOnSale=true"
    );
  });
});
