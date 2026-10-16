import type { SaleUnit } from "@/features/catalog/types";

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

const INITIAL_MOCK_ITEMS: BranchProductAdminItem[] = [
  {
    productId: "p-almendras",
    name: "Almendras Nonpareil",
    description: "Almendras seleccionadas calibre grande.",
    categoryId: "c-frutos-secos",
    categoryName: "Frutos Secos",
    saleUnit: "WEIGHT",
    barcode: null,
    imageUrls: [],
    status: "ACTIVE",
    price: 14500,
    promotionalPrice: null,
    isOnSale: false,
    isAvailable: true,
    isFeatured: true,
  },
  {
    productId: "p-nueces",
    name: "Nueces Mariposa Extra Light",
    description: "Mitades seleccionadas de cosecha nueva.",
    categoryId: "c-frutos-secos",
    categoryName: "Frutos Secos",
    saleUnit: "WEIGHT",
    barcode: null,
    imageUrls: [],
    status: "ACTIVE",
    price: 19000,
    promotionalPrice: 16500,
    isOnSale: true,
    isAvailable: true,
    isFeatured: false,
  },
  {
    productId: "p-galletas-arroz",
    name: "Galletas de Arroz Sin TACC",
    description: "Paquete por 150g libre de gluten.",
    categoryId: "c-sin-tacc",
    categoryName: "Sin TACC",
    saleUnit: "UNIT",
    barcode: "7791234567890",
    imageUrls: [],
    status: "INACTIVE",
    price: 2400,
    promotionalPrice: null,
    isOnSale: false,
    isAvailable: false,
    isFeatured: false,
  },
  {
    productId: "p-pistachos",
    name: "Pistachos Tostados con Sal",
    description: "Pistachos calibre especial.",
    categoryId: "c-frutos-secos",
    categoryName: "Frutos Secos",
    saleUnit: "WEIGHT",
    barcode: null,
    imageUrls: [],
    status: "UNCONFIGURED",
    price: null,
    promotionalPrice: null,
    isOnSale: false,
    isAvailable: false,
    isFeatured: false,
  },
];

export function createInMemoryBranchPricingRepository(
  seed: BranchProductAdminItem[] = INITIAL_MOCK_ITEMS
): BranchPricingRepository {
  const store = new Map<string, BranchProductAdminItem[]>(
    [["default", seed.map((item) => ({ ...item }))]]
  );

  function getBranchItems(branchId: string): BranchProductAdminItem[] {
    if (!store.has(branchId)) {
      store.set(
        branchId,
        seed.map((item) => ({ ...item }))
      );
    }
    return store.get(branchId)!;
  }

  return {
    async listProducts(branchId, _token, query = {}) {
      const items = getBranchItems(branchId);
      const search = query.search?.trim().toLowerCase() ?? "";

      const filtered = items.filter((item) => {
        if (query.status && item.status !== query.status) return false;
        if (query.isOnSale !== undefined && item.isOnSale !== query.isOnSale) return false;
        if (query.categoryId && item.categoryId !== query.categoryId) return false;
        if (search) {
          const matchesName = item.name.toLowerCase().includes(search);
          const matchesBarcode = item.barcode?.toLowerCase().includes(search) ?? false;
          if (!matchesName && !matchesBarcode) return false;
        }
        return true;
      });

      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return {
        items: paged,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      };
    },

    async getCounts(branchId) {
      const items = getBranchItems(branchId);
      return {
        ACTIVE: items.filter((i) => i.status === "ACTIVE").length,
        INACTIVE: items.filter((i) => i.status === "INACTIVE").length,
        UNCONFIGURED: items.filter((i) => i.status === "UNCONFIGURED").length,
        ON_SALE: items.filter((i) => i.isOnSale).length,
      };
    },

    async upsertProduct(branchId, productId, _token, input) {
      if (input.isAvailable && input.price <= 0) {
        throw new Error("El precio debe ser mayor a $0 para activar el producto en la sucursal.");
      }

      const items = getBranchItems(branchId);
      const idx = items.findIndex((i) => i.productId === productId);
      if (idx === -1) {
        throw new Error("Producto no encontrado.");
      }

      const current = items[idx]!;
      const nextIsOnSale =
        input.isOnSale !== undefined
          ? input.isOnSale
          : current.isOnSale &&
            current.promotionalPrice !== null &&
            current.promotionalPrice < input.price;
      const nextPromo =
        input.promotionalPrice !== undefined
          ? input.promotionalPrice
          : nextIsOnSale
            ? current.promotionalPrice
            : null;

      const nextIsFeatured =
        input.isFeatured !== undefined ? input.isFeatured : (current.isFeatured ?? false);

      const updated: BranchProductAdminItem = {
        ...current,
        price: input.price,
        isAvailable: input.isAvailable,
        status: input.isAvailable ? "ACTIVE" : "INACTIVE",
        isOnSale: nextIsOnSale,
        promotionalPrice: nextPromo,
        isFeatured: nextIsFeatured,
      };
      items[idx] = updated;

      return {
        id: `bp-${branchId}-${productId}`,
        branchId,
        productId,
        price: updated.price ?? 0,
        promotionalPrice: updated.promotionalPrice,
        isOnSale: updated.isOnSale,
        isAvailable: updated.isAvailable,
        isFeatured: updated.isFeatured,
      };
    },

    async updateOffer(branchId, productId, _token, input) {
      const items = getBranchItems(branchId);
      const idx = items.findIndex((i) => i.productId === productId);
      if (idx === -1) {
        throw new Error("Producto no encontrado.");
      }

      const current = items[idx]!;
      if (current.price === null || current.price <= 0) {
        throw new Error("Configurá primero el precio base antes de activar una oferta.");
      }

      if (input.isOnSale) {
        if (!input.promotionalPrice || input.promotionalPrice <= 0) {
          throw new Error("Ingresá un precio promocional válido mayor a $0.");
        }
        if (input.promotionalPrice >= current.price) {
          throw new Error("El precio de oferta debe ser menor al precio regular.");
        }
      }

      const updated: BranchProductAdminItem = {
        ...current,
        isOnSale: input.isOnSale,
        promotionalPrice: input.isOnSale ? (input.promotionalPrice ?? null) : null,
      };
      items[idx] = updated;

      return {
        id: `bp-${branchId}-${productId}`,
        branchId,
        productId,
        price: updated.price ?? 0,
        promotionalPrice: updated.promotionalPrice,
        isOnSale: updated.isOnSale,
        isAvailable: updated.isAvailable,
        isFeatured: updated.isFeatured,
      };
    },
  };
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
