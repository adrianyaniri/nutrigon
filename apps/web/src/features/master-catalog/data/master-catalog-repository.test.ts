import { describe, expect, it, vi } from "vitest";
import {
  createHttpMasterCatalogRepository,
  createInMemoryMasterCatalogRepository,
} from "./master-catalog-repository";

describe("createHttpMasterCatalogRepository", () => {
  it("lists master products with filters and Authorization header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "p-1",
            categoryId: "c-1",
            code: "FS-01",
            name: "Almendras Nonpareil",
            description: "Calibre grande",
            saleUnit: "WEIGHT",
            barcode: null,
            imageUrls: [],
            isActive: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    });

    const repo = createHttpMasterCatalogRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const result = await repo.listProducts("jwt-admin-token", {
      search: "almendras",
      isActive: true,
      page: 1,
      limit: 20,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/products?search=almendras&isActive=true&page=1&limit=20",
      {
        headers: { Authorization: "Bearer jwt-admin-token" },
      }
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe("Almendras Nonpareil");
  });

  it("creates a master product via POST /api/v1/products", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "p-2",
        categoryId: "c-1",
        code: "FS-02",
        name: "Castañas de Cajú",
        description: null,
        saleUnit: "WEIGHT",
        barcode: null,
        imageUrls: ["https://cdn.nutrigon.com/products/caju.webp"],
        isActive: true,
      }),
    });

    const repo = createHttpMasterCatalogRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const created = await repo.createProduct("jwt-admin-token", {
      categoryId: "c-1",
      code: "FS-02",
      name: "Castañas de Cajú",
      saleUnit: "WEIGHT",
      imageUrls: ["https://cdn.nutrigon.com/products/caju.webp"],
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/products",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer jwt-admin-token",
        },
        body: JSON.stringify({
          categoryId: "c-1",
          code: "FS-02",
          name: "Castañas de Cajú",
          saleUnit: "WEIGHT",
          imageUrls: ["https://cdn.nutrigon.com/products/caju.webp"],
        }),
      }
    );
    expect(created.id).toBe("p-2");
  });

  it("uploads a product image to Cloudflare R2 with folder 'products'", async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/media/upload-url")) {
        return {
          ok: true,
          json: async () => ({
            uploadUrl: "https://r2.cloudflare.com/upload-product",
            publicUrl: "https://cdn.nutrigon.com/products/caju.webp",
          }),
        };
      }
      if (url.includes("upload-product") && init?.method === "PUT") {
        return { ok: true };
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const repo = createHttpMasterCatalogRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const file = new File(["image-bytes"], "caju.webp", { type: "image/webp" });
    const publicUrl = await repo.uploadProductImage("jwt-admin-token", file);

    expect(publicUrl).toBe("https://cdn.nutrigon.com/products/caju.webp");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/media/upload-url",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fileName: "caju.webp",
          contentType: "image/webp",
          folder: "products",
          fileSize: file.size,
        }),
      })
    );
  });

  it("rejects uploading a product image larger than 5 MB before calling the API", async () => {
    const mockFetch = vi.fn();
    const repo = createHttpMasterCatalogRepository(
      "http://localhost:3000",
      mockFetch as unknown as typeof fetch
    );

    const oversizedFile = new File(
      [new Uint8Array(6 * 1024 * 1024)],
      "pesada.jpg",
      { type: "image/jpeg" }
    );

    await expect(
      repo.uploadProductImage("jwt-admin-token", oversizedFile)
    ).rejects.toThrow(/5\s*MB/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("createInMemoryMasterCatalogRepository", () => {
  it("validates duplicate product codes and creates master products", async () => {
    const repo = createInMemoryMasterCatalogRepository();

    await expect(
      repo.createProduct("token", {
        categoryId: "c-frutos-secos",
        code: "FS-001",
        name: "Duplicado",
        saleUnit: "WEIGHT",
      })
    ).rejects.toThrow(/código interno "FS-001"/i);

    const created = await repo.createProduct("token", {
      categoryId: "c-frutos-secos",
      code: "FS-099",
      name: "Pistachos Californianos",
      saleUnit: "WEIGHT",
    });

    expect(created.name).toBe("Pistachos Californianos");
    expect(created.isActive).toBe(true);
  });

  it("soft-deletes a category and excludes it from listCategories", async () => {
    const repo = createInMemoryMasterCatalogRepository();
    const initial = await repo.listCategories();
    expect(initial.some((c) => c.id === "c-suplementos")).toBe(true);

    const deleted = await repo.deleteCategory("token", "c-suplementos");
    expect(deleted.isActive).toBe(false);

    const after = await repo.listCategories();
    expect(after.some((c) => c.id === "c-suplementos")).toBe(false);
  });
});
