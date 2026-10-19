import type { SaleUnit } from "@/features/catalog/types";
import { createInMemoryBranchPricingRepository } from "./branch-pricing.mock";

export { createInMemoryBranchPricingRepository } from "./branch-pricing.mock";

export type BranchProductStatus = "ACTIVE" | "INACTIVE" | "UNCONFIGURED";

export interface BranchProductAdminItem {
  productId: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  saleUnit: SaleUnit;
  barcode?: string | null;
  imageUrls: string[];
  status: BranchProductStatus;
  price: number | null;
  promotionalPrice: number | null;
  isOnSale: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface PaginatedBranchProducts {
  items: BranchProductAdminItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BranchProductCounts {
  ACTIVE: number;
  INACTIVE: number;
  UNCONFIGURED: number;
  ON_SALE: number;
}

export interface BranchPricingQuery {
  status?: BranchProductStatus;
  isOnSale?: boolean;
  isFeatured?: boolean;
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface UpsertBranchProductInput {
  price: number;
  isAvailable: boolean;
  isOnSale?: boolean;
  promotionalPrice?: number | null;
  isFeatured?: boolean;
}

export interface UpdateBranchOfferInput {
  isOnSale: boolean;
  promotionalPrice?: number | null;
}

export interface BranchProductRecord {
  id: string;
  branchId: string;
  productId: string;
  price: number;
  promotionalPrice: number | null;
  isOnSale: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface BranchPricingRepository {
  listProducts(
    branchId: string,
    token: string,
    query?: BranchPricingQuery
  ): Promise<PaginatedBranchProducts>;
  getCounts(branchId: string, token: string): Promise<BranchProductCounts>;
  upsertProduct(
    branchId: string,
    productId: string,
    token: string,
    input: UpsertBranchProductInput
  ): Promise<BranchProductRecord>;
  updateOffer(
    branchId: string,
    productId: string,
    token: string,
    input: UpdateBranchOfferInput
  ): Promise<BranchProductRecord>;
}

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
    // Ignore JSON parse error
  }
  return new Error(fallbackMessage);
}

export function createHttpBranchPricingRepository(
  baseUrl = "",
  fetchFn: typeof fetch = fetch
): BranchPricingRepository {
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  return {
    async listProducts(branchId, token, query = {}) {
      const params = new URLSearchParams();
      if (query.status) params.set("status", query.status);
      if (query.isOnSale !== undefined) params.set("isOnSale", String(query.isOnSale));
      if (query.search?.trim()) params.set("search", query.search.trim());
      if (query.categoryId) params.set("categoryId", query.categoryId);
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));

      const qs = params.toString();
      const url = `${normalizedBase}/api/v1/branches/${encodeURIComponent(branchId)}/products${
        qs ? `?${qs}` : ""
      }`;

      const res = await fetchFn(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw await parseApiError(res, "No se pudo cargar el listado de productos de la sucursal.");
      }

      return (await res.json()) as PaginatedBranchProducts;
    },

    async getCounts(branchId, token) {
      const url = `${normalizedBase}/api/v1/branches/${encodeURIComponent(branchId)}/products/counts`;
      const res = await fetchFn(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw await parseApiError(res, "No se pudieron obtener los contadores de la sucursal.");
      }

      return (await res.json()) as BranchProductCounts;
    },

    async upsertProduct(branchId, productId, token, input) {
      const url = `${normalizedBase}/api/v1/branches/${encodeURIComponent(
        branchId
      )}/products/${encodeURIComponent(productId)}`;

      const res = await fetchFn(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw await parseApiError(res, "No se pudo guardar el precio del producto.");
      }

      return (await res.json()) as BranchProductRecord;
    },

    async updateOffer(branchId, productId, token, input) {
      const url = `${normalizedBase}/api/v1/branches/${encodeURIComponent(
        branchId
      )}/products/${encodeURIComponent(productId)}/offer`;

      const res = await fetchFn(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw await parseApiError(res, "No se pudo actualizar la oferta del producto.");
      }

      return (await res.json()) as BranchProductRecord;
    },
  };
}

const isTestEnv = import.meta.env.MODE === "test" && !import.meta.env.VITE_API_URL;
const httpPricingRepo = createHttpBranchPricingRepository(import.meta.env.VITE_API_URL ?? "");
const mockPricingRepo = createInMemoryBranchPricingRepository();

export const branchPricingRepository: BranchPricingRepository = isTestEnv
  ? mockPricingRepo
  : {
      async listProducts(branchId, token, query) {
        try {
          return await httpPricingRepo.listProducts(branchId, token, query);
        } catch (err) {
          if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
            return mockPricingRepo.listProducts(branchId, token, query);
          }
          throw err;
        }
      },
      async getCounts(branchId, token) {
        try {
          return await httpPricingRepo.getCounts(branchId, token);
        } catch (err) {
          if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
            return mockPricingRepo.getCounts(branchId, token);
          }
          throw err;
        }
      },
      async upsertProduct(branchId, productId, token, input) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockPricingRepo.upsertProduct(branchId, productId, token, input);
        }
        return httpPricingRepo.upsertProduct(branchId, productId, token, input);
      },
      async updateOffer(branchId, productId, token, input) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockPricingRepo.updateOffer(branchId, productId, token, input);
        }
        return httpPricingRepo.updateOffer(branchId, productId, token, input);
      },
    };
