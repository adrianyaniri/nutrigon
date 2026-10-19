import { uploadOptimizedMediaToR2 } from "@/lib/image/optimize-image";
import type {
  MasterCategory,
  MasterProduct,
  PaginatedMasterProducts,
  MasterCatalogRepository,
} from "../types";
import { createInMemoryMasterCatalogRepository } from "./master-catalog.mock";

export type { MasterCatalogRepository } from "../types";
export { createInMemoryMasterCatalogRepository } from "./master-catalog.mock";

async function parseApiError(res: Response, fallbackMessage: string): Promise<Error> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message) && body.message.length > 0) {
      return new Error(body.message[0]);
    }
    if (typeof body.message === "string" && body.message.trim()) {
      return new Error(body.message);
    }
  } catch {
    // Ignore JSON parse failure
  }
  return new Error(fallbackMessage);
}

export function createHttpMasterCatalogRepository(
  baseUrl = "",
  fetchFn: typeof fetch = fetch
): MasterCatalogRepository {
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  return {
    async listCategories() {
      const res = await fetchFn(`${normalizedBase}/api/v1/categories`);
      if (!res.ok) {
        throw await parseApiError(res, "No se pudieron obtener las categorías.");
      }
      return (await res.json()) as MasterCategory[];
    },

    async createCategory(token, input) {
      const res = await fetchFn(`${normalizedBase}/api/v1/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw await parseApiError(res, "No se pudo crear la categoría.");
      }
      return (await res.json()) as MasterCategory;
    },

    async updateCategory(token, categoryId, input) {
      const res = await fetchFn(
        `${normalizedBase}/api/v1/categories/${encodeURIComponent(categoryId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(input),
        }
      );
      if (!res.ok) {
        throw await parseApiError(res, "No se pudo actualizar la categoría.");
      }
      return (await res.json()) as MasterCategory;
    },

    async listProducts(token, query = {}) {
      const params = new URLSearchParams();
      if (query.search?.trim()) params.set("search", query.search.trim());
      if (query.categoryId) params.set("categoryId", query.categoryId);
      if (query.isActive !== undefined) params.set("isActive", String(query.isActive));
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));

      const qs = params.toString();
      const url = `${normalizedBase}/api/v1/products${qs ? `?${qs}` : ""}`;

      const res = await fetchFn(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw await parseApiError(res, "No se pudo obtener el catálogo maestro de productos.");
      }
      return (await res.json()) as PaginatedMasterProducts;
    },

    async createProduct(token, input) {
      const res = await fetchFn(`${normalizedBase}/api/v1/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw await parseApiError(res, "No se pudo crear el producto en el catálogo maestro.");
      }
      return (await res.json()) as MasterProduct;
    },

    async updateProduct(token, productId, input) {
      const res = await fetchFn(
        `${normalizedBase}/api/v1/products/${encodeURIComponent(productId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(input),
        }
      );
      if (!res.ok) {
        throw await parseApiError(res, "No se pudo actualizar el producto maestro.");
      }
      return (await res.json()) as MasterProduct;
    },

    async deleteProduct(token, productId) {
      const res = await fetchFn(
        `${normalizedBase}/api/v1/products/${encodeURIComponent(productId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw await parseApiError(res, "No se pudo desactivar el producto maestro.");
      }
      return (await res.json()) as MasterProduct;
    },

    async uploadProductImage(token, file) {
      return uploadOptimizedMediaToR2({
        baseUrl: normalizedBase,
        fetchFn,
        token,
        file,
        folder: "products",
      });
    },
  };
}

const isTestEnv = import.meta.env.MODE === "test" && !import.meta.env.VITE_API_URL;
const httpMasterRepo = createHttpMasterCatalogRepository(import.meta.env.VITE_API_URL ?? "");
const mockMasterRepo = createInMemoryMasterCatalogRepository();

export const masterCatalogRepository: MasterCatalogRepository = isTestEnv
  ? mockMasterRepo
  : {
      async listCategories() {
        try {
          return await httpMasterRepo.listCategories();
        } catch (err) {
          if (import.meta.env.DEV) {
            return mockMasterRepo.listCategories();
          }
          throw err;
        }
      },
      async createCategory(token, input) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockMasterRepo.createCategory(token, input);
        }
        return httpMasterRepo.createCategory(token, input);
      },
      async updateCategory(token, categoryId, input) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockMasterRepo.updateCategory(token, categoryId, input);
        }
        return httpMasterRepo.updateCategory(token, categoryId, input);
      },
      async listProducts(token, query) {
        try {
          return await httpMasterRepo.listProducts(token, query);
        } catch (err) {
          if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
            return mockMasterRepo.listProducts(token, query);
          }
          throw err;
        }
      },
      async createProduct(token, input) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockMasterRepo.createProduct(token, input);
        }
        return httpMasterRepo.createProduct(token, input);
      },
      async updateProduct(token, productId, input) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockMasterRepo.updateProduct(token, productId, input);
        }
        return httpMasterRepo.updateProduct(token, productId, input);
      },
      async deleteProduct(token, productId) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockMasterRepo.deleteProduct(token, productId);
        }
        return httpMasterRepo.deleteProduct(token, productId);
      },
      async uploadProductImage(token, file) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockMasterRepo.uploadProductImage(token, file);
        }
        return httpMasterRepo.uploadProductImage(token, file);
      },
    };
