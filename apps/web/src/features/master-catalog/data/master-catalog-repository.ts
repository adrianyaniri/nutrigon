import type {
  CreateCategoryInput,
  CreateMasterProductInput,
  MasterCategory,
  MasterProduct,
  MasterProductsQuery,
  PaginatedMasterProducts,
  UpdateMasterProductInput,
} from "../types";

export interface MasterCatalogRepository {
  listCategories(): Promise<MasterCategory[]>;
  createCategory(token: string, input: CreateCategoryInput): Promise<MasterCategory>;
  listProducts(
    token: string,
    query?: MasterProductsQuery
  ): Promise<PaginatedMasterProducts>;
  createProduct(
    token: string,
    input: CreateMasterProductInput
  ): Promise<MasterProduct>;
  updateProduct(
    token: string,
    productId: string,
    input: UpdateMasterProductInput
  ): Promise<MasterProduct>;
  deleteProduct(token: string, productId: string): Promise<MasterProduct>;
  uploadProductImage(token: string, file: File): Promise<string>;
}

const INITIAL_MOCK_CATEGORIES: MasterCategory[] = [
  {
    id: "c-frutos-secos",
    name: "Frutos Secos",
    slug: "frutos-secos",
    orderIndex: 1,
    isActive: true,
  },
  {
    id: "c-harinas-granos",
    name: "Harinas & Granos",
    slug: "harinas-granos",
    orderIndex: 2,
    isActive: true,
  },
  {
    id: "c-sin-tacc",
    name: "Sin TACC",
    slug: "sin-tacc",
    orderIndex: 3,
    isActive: true,
  },
  {
    id: "c-suplementos",
    name: "Suplementos",
    slug: "suplementos",
    orderIndex: 4,
    isActive: true,
  },
];

const INITIAL_MOCK_PRODUCTS: MasterProduct[] = [
  {
    id: "p-almendras",
    categoryId: "c-frutos-secos",
    code: "FS-001",
    name: "Almendras Nonpareil",
    description: "Almendras seleccionadas calibre grande.",
    saleUnit: "WEIGHT",
    barcode: null,
    imageUrls: [],
    isActive: true,
  },
  {
    id: "p-nueces",
    categoryId: "c-frutos-secos",
    code: "FS-002",
    name: "Nueces Mariposa Extra Light",
    description: "Mitades seleccionadas de cosecha nueva.",
    saleUnit: "WEIGHT",
    barcode: null,
    imageUrls: [],
    isActive: true,
  },
  {
    id: "p-galletas-arroz",
    categoryId: "c-sin-tacc",
    code: "ST-101",
    name: "Galletas de Arroz Sin TACC",
    description: "Paquete por 150g libre de gluten.",
    saleUnit: "UNIT",
    barcode: "7791234567890",
    imageUrls: [],
    isActive: false,
  },
];

export function createInMemoryMasterCatalogRepository(
  seedProducts: MasterProduct[] = INITIAL_MOCK_PRODUCTS,
  seedCategories: MasterCategory[] = INITIAL_MOCK_CATEGORIES
): MasterCatalogRepository {
  const categories = seedCategories.map((c) => ({ ...c }));
  const products = seedProducts.map((p) => ({ ...p }));

  return {
    async listCategories() {
      return categories.filter((c) => c.isActive);
    },

    async createCategory(_token, input) {
      if (!input.name || input.name.trim().length < 2) {
        throw new Error("El nombre de la categoría debe tener al menos 2 caracteres.");
      }
      if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug.trim())) {
        throw new Error("El slug solo puede contener letras minúsculas, números y guiones.");
      }
      if (categories.some((c) => c.slug === input.slug.trim())) {
        throw new Error(`Ya existe una categoría con el identificador "${input.slug}".`);
      }

      const newCategory: MasterCategory = {
        id: `cat-${Date.now()}`,
        name: input.name.trim(),
        slug: input.slug.trim(),
        orderIndex: input.orderIndex ?? categories.length + 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      categories.push(newCategory);
      return newCategory;
    },

    async listProducts(_token, query = {}) {
      let filtered = [...products];

      if (query.isActive !== undefined) {
        filtered = filtered.filter((p) => p.isActive === query.isActive);
      }

      if (query.categoryId) {
        filtered = filtered.filter((p) => p.categoryId === query.categoryId);
      }

      if (query.search?.trim()) {
        const term = query.search.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            (p.code && p.code.toLowerCase().includes(term)) ||
            (p.barcode && p.barcode.toLowerCase().includes(term))
        );
      }

      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
      };
    },

    async createProduct(_token, input) {
      if (!input.name || input.name.trim().length < 2) {
        throw new Error("El nombre del producto debe tener al menos 2 caracteres.");
      }
      if (!input.categoryId) {
        throw new Error("Seleccioná una categoría válida para el producto.");
      }
      if (input.code?.trim()) {
        const codeNormalized = input.code.trim().toUpperCase();
        if (products.some((p) => p.code?.toUpperCase() === codeNormalized)) {
          throw new Error(`Ya existe un producto con el código interno "${codeNormalized}".`);
        }
      }

      const newProduct: MasterProduct = {
        id: `prod-${Date.now()}`,
        categoryId: input.categoryId,
        code: input.code?.trim() || null,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        saleUnit: input.saleUnit,
        barcode: input.barcode?.trim() || null,
        imageUrls: input.imageUrls ?? [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      products.unshift(newProduct);
      return newProduct;
    },

    async updateProduct(_token, productId, input) {
      const idx = products.findIndex((p) => p.id === productId);
      if (idx === -1) {
        throw new Error("Producto maestro no encontrado.");
      }

      const current = products[idx]!;
      const updated: MasterProduct = {
        ...current,
        categoryId: input.categoryId ?? current.categoryId,
        code: input.code !== undefined ? input.code?.trim() || null : current.code,
        name: input.name !== undefined ? input.name.trim() : current.name,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : current.description,
        saleUnit: input.saleUnit ?? current.saleUnit,
        barcode:
          input.barcode !== undefined ? input.barcode?.trim() || null : current.barcode,
        imageUrls: input.imageUrls ?? current.imageUrls,
        isActive: input.isActive !== undefined ? input.isActive : current.isActive,
        updatedAt: new Date().toISOString(),
      };
      products[idx] = updated;
      return updated;
    },

    async deleteProduct(_token, productId) {
      const idx = products.findIndex((p) => p.id === productId);
      if (idx === -1) {
        throw new Error("Producto maestro no encontrado.");
      }
      const updated: MasterProduct = {
        ...products[idx]!,
        isActive: false,
        updatedAt: new Date().toISOString(),
      };
      products[idx] = updated;
      return updated;
    },

    async uploadProductImage(_token, file) {
      return `https://mock-cdn.nutrigon.com/products/${encodeURIComponent(file.name)}`;
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
      const urlRes = await fetchFn(`${normalizedBase}/api/v1/media/upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "image/jpeg",
          folder: "products",
        }),
      });

      if (!urlRes.ok) {
        throw await parseApiError(urlRes, "No se pudo obtener la URL de subida a Cloudflare R2.");
      }

      const { uploadUrl, publicUrl } = (await urlRes.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      const uploadRes = await fetchFn(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "image/jpeg",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("No se pudo transferir la imagen a Cloudflare R2.");
      }

      return publicUrl;
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
