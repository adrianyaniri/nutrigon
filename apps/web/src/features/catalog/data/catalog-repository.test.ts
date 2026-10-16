import { describe, expect, it, vi } from "vitest";
import { createHttpCatalogRepository } from "./catalog-repository";

describe("createHttpCatalogRepository", () => {
  it("fetches active branches from GET /api/v1/branches", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "b-origone",
          name: "Origone",
          slug: "origone",
          address: "Tte. Manuel Origone 196",
          phone: "11-1111-1111",
          whatsappNumber: "5491111111111",
          isActive: true,
        },
        {
          id: "b-inactive",
          name: "Inactiva",
          slug: "inactiva",
          address: null,
          phone: null,
          whatsappNumber: null,
          isActive: false,
        },
      ],
    });

    const repo = createHttpCatalogRepository("http://localhost:3000", mockFetch as unknown as typeof fetch);
    const branches = await repo.getBranches();

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000/api/v1/branches");
    expect(branches).toEqual([
      {
        id: "b-origone",
        name: "Origone",
        slug: "origone",
        address: "Tte. Manuel Origone 196",
        phone: "11-1111-1111",
        whatsappNumber: "5491111111111",
      },
    ]);
  });

  it("merges branch catalog products and active combos from GET /catalog and GET /combos", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/catalog")) {
        return {
          ok: true,
          json: async () => ({
            branch: {
              id: "b-origone",
              name: "Origone",
              slug: "origone",
              address: "Tte. Manuel Origone 196",
              phone: "11-1111-1111",
              whatsappNumber: "5491111111111",
            },
            categories: [{ id: "cat-1", name: "Frutos Secos", slug: "frutos-secos" }],
            items: [
              {
                id: "prod-1",
                categoryId: "cat-1",
                name: "Almendras Nonpareil",
                description: "Tostadas",
                saleUnit: "WEIGHT",
                imageUrls: ["https://cdn.nutrigon.com/almendras.webp"],
                price: 14500,
                promotionalPrice: 12900,
                isOnSale: true,
              },
            ],
            total: 1,
            page: 1,
            limit: 100,
            totalPages: 1,
          }),
        };
      }

      if (url.includes("/combos")) {
        return {
          ok: true,
          json: async () => [
            {
              id: "combo-1",
              name: "Pack Energético",
              description: "Almendras + Nueces",
              imageUrls: ["https://cdn.nutrigon.com/combo.webp"],
              price: 11500,
              originalPrice: 14500,
              isActive: true,
              items: [
                {
                  id: "ci-1",
                  productId: "prod-1",
                  productName: "Almendras Nonpareil",
                  saleUnit: "WEIGHT",
                  quantity: 1,
                },
              ],
            },
          ],
        };
      }

      return { ok: false, status: 404 };
    });

    const repo = createHttpCatalogRepository("http://localhost:3000", mockFetch as unknown as typeof fetch);
    const catalog = await repo.getBranchCatalog("origone");

    expect(catalog.branch.slug).toBe("origone");
    expect(catalog.categories).toHaveLength(1);
    expect(catalog.products).toHaveLength(2);

    const [comboItem, regularItem] = catalog.products;
    expect(comboItem).toMatchObject({
      id: "combo-1",
      name: "Pack Energético",
      isCombo: true,
      price: 14500,
      promotionalPrice: 11500,
      saleUnit: "UNIT",
    });
    expect(regularItem).toMatchObject({
      id: "prod-1",
      name: "Almendras Nonpareil",
      price: 14500,
      promotionalPrice: 12900,
      saleUnit: "WEIGHT",
      imageUrl: "https://cdn.nutrigon.com/almendras.webp",
    });
  });
});
