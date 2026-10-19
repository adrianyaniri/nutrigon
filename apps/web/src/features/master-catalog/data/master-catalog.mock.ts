import type {
  MasterCategory,
  MasterProduct,
  MasterCatalogRepository,
} from "../types";

export const INITIAL_MOCK_CATEGORIES: MasterCategory[] = [
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

export const INITIAL_MOCK_PRODUCTS: MasterProduct[] = [
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

    async updateCategory(_token, categoryId, input) {
      const idx = categories.findIndex((c) => c.id === categoryId);
      if (idx === -1) {
        throw new Error("Categoría no encontrada.");
      }

      if (input.name !== undefined && input.name.trim().length < 2) {
        throw new Error("El nombre de la categoría debe tener al menos 2 caracteres.");
      }
      if (input.slug !== undefined && !/^[a-z0-9-]+$/.test(input.slug.trim())) {
        throw new Error("El slug solo puede contener letras minúsculas, números y guiones.");
      }
      if (
        input.slug !== undefined &&
        categories.some((c, i) => i !== idx && c.slug === input.slug!.trim())
      ) {
        throw new Error(`Ya existe una categoría con el identificador "${input.slug}".`);
      }

      const current = categories[idx]!;
      const updated: MasterCategory = {
        ...current,
        name: input.name !== undefined ? input.name.trim() : current.name,
        slug: input.slug !== undefined ? input.slug.trim() : current.slug,
        orderIndex: input.orderIndex ?? current.orderIndex,
        isActive: input.isActive !== undefined ? input.isActive : current.isActive,
        updatedAt: new Date().toISOString(),
      };
      categories[idx] = updated;
      return updated;
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
