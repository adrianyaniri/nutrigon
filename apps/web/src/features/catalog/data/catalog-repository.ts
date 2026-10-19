import { DEFAULT_PRODUCT_IMAGE } from "@/components/atoms/product-image";
import type {
  BranchCatalog,
  CatalogBranch,
  CatalogCategory,
  CatalogProduct,
  SaleUnit,
} from "../types";
import { getMockBranchCatalog, getMockBranches } from "./mock-catalog";

export interface CatalogRepository {
  getBranches(): Promise<CatalogBranch[]>;
  getBranchCatalog(branchSlug: string): Promise<BranchCatalog>;
}

interface ApiBranchItem {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  isActive?: boolean;
}

interface ApiCatalogProductItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  saleUnit: SaleUnit;
  imageUrls: string[];
  price: number;
  promotionalPrice: number | null;
  isOnSale: boolean;
  isFeatured?: boolean;
}

interface ApiPublicCatalogResponse {
  branch: CatalogBranch;
  categories: CatalogCategory[];
  items: ApiCatalogProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiComboItem {
  id?: string;
  productId: string;
  productName: string;
  saleUnit: SaleUnit;
  quantity: number;
}

interface ApiComboResponse {
  id: string;
  name: string;
  description: string | null;
  imageUrls?: string[];
  imageUrl?: string | null;
  price: number;
  originalPrice?: number;
  isActive?: boolean;
  items: ApiComboItem[];
}

export const mockCatalogRepository: CatalogRepository = {
  async getBranches() {
    return getMockBranches();
  },
  async getBranchCatalog(branchSlug) {
    const catalog = getMockBranchCatalog(branchSlug);
    if (!catalog) {
      throw new Error(`Branch "${branchSlug}" was not found.`);
    }
    return catalog;
  },
};

function mapApiProductToCatalogProduct(item: ApiCatalogProductItem): CatalogProduct {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    saleUnit: item.saleUnit,
    imageUrl: item.imageUrls[0] || DEFAULT_PRODUCT_IMAGE,
    price: item.price,
    promotionalPrice: item.isOnSale ? item.promotionalPrice : null,
    isFeatured: item.isFeatured ?? false,
  };
}

function mapApiComboToCatalogProduct(combo: ApiComboResponse): CatalogProduct {
  const imageUrl = combo.imageUrls?.[0] || combo.imageUrl || DEFAULT_PRODUCT_IMAGE;
  const originalPrice = combo.originalPrice;
  const hasDiscount = originalPrice !== undefined && originalPrice > combo.price;

  return {
    id: combo.id,
    categoryId: "__combos__",
    name: combo.name,
    description: combo.description,
    saleUnit: "UNIT",
    imageUrl,
    price: hasDiscount ? originalPrice : combo.price,
    promotionalPrice: hasDiscount ? combo.price : null,
    isCombo: true,
    comboItems: combo.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      saleUnit: item.saleUnit,
    })),
  };
}

export function createHttpCatalogRepository(
  baseUrl = "",
  fetchFn: typeof fetch = fetch
): CatalogRepository {
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  return {
    async getBranches(): Promise<CatalogBranch[]> {
      try {
        const res = await fetchFn(`${normalizedBase}/api/v1/branches`);
        if (!res.ok) {
          throw new Error(`Failed to fetch branches (status ${res.status})`);
        }
        const data = (await res.json()) as ApiBranchItem[];
        return data
          .filter((b) => b.isActive !== false)
          .map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            address: b.address,
            phone: b.phone,
            whatsappNumber: b.whatsappNumber,
          }));
      } catch (err: unknown) {
        if (typeof window !== "undefined" && import.meta.env.MODE === "test") {
          return getMockBranches();
        }
        throw err;
      }
    },

    async getBranchCatalog(branchSlug: string): Promise<BranchCatalog> {
      const encodedSlug = encodeURIComponent(branchSlug);
      const [catalogRes, combosRes] = await Promise.all([
        fetchFn(`${normalizedBase}/api/v1/branches/${encodedSlug}/catalog?page=1&limit=100`),
        fetchFn(`${normalizedBase}/api/v1/branches/${encodedSlug}/catalog/combos`),
      ]);

      if (!catalogRes.ok) {
        throw new Error(`Branch "${branchSlug}" was not found (status ${catalogRes.status}).`);
      }

      const firstPage = (await catalogRes.json()) as ApiPublicCatalogResponse;
      const allItems: ApiCatalogProductItem[] = [...firstPage.items];

      if (firstPage.totalPages > 1) {
        const pagePromises: Promise<ApiPublicCatalogResponse>[] = [];
        for (let page = 2; page <= firstPage.totalPages; page += 1) {
          pagePromises.push(
            fetchFn(
              `${normalizedBase}/api/v1/branches/${encodedSlug}/catalog?page=${page}&limit=100`
            ).then((r) => {
              if (!r.ok) {
                throw new Error(`Failed to load catalog page ${page}`);
              }
              return r.json() as Promise<ApiPublicCatalogResponse>;
            })
          );
        }
        const remainingPages = await Promise.all(pagePromises);
        for (const pageData of remainingPages) {
          allItems.push(...pageData.items);
        }
      }

      let comboProducts: CatalogProduct[] = [];
      if (combosRes.ok) {
        try {
          const rawCombos = (await combosRes.json()) as unknown;
          const comboList: ApiComboResponse[] = Array.isArray(rawCombos)
            ? (rawCombos as ApiComboResponse[])
            : rawCombos &&
              typeof rawCombos === "object" &&
              "combos" in rawCombos &&
              Array.isArray((rawCombos as { combos: unknown[] }).combos)
            ? (rawCombos as { combos: ApiComboResponse[] }).combos
            : [];

          comboProducts = comboList
            .filter((combo) => combo.isActive !== false)
            .map(mapApiComboToCatalogProduct);
        } catch {
          // Ignore JSON parse errors for combos
        }
      }

      const regularProducts = allItems.map(mapApiProductToCatalogProduct);

      return {
        branch: firstPage.branch,
        categories: firstPage.categories,
        products: [...comboProducts, ...regularProducts],
      };
    },
  };
}

const isTestEnv = import.meta.env.MODE === "test" || !import.meta.env.VITE_API_URL;
const httpRepository = createHttpCatalogRepository(import.meta.env.VITE_API_URL ?? "");

export const catalogRepository: CatalogRepository = isTestEnv
  ? mockCatalogRepository
  : {
      async getBranches() {
        try {
          return await httpRepository.getBranches();
        } catch (err) {
          if (import.meta.env.DEV) {
            return mockCatalogRepository.getBranches();
          }
          throw err;
        }
      },
      async getBranchCatalog(branchSlug: string) {
        try {
          return await httpRepository.getBranchCatalog(branchSlug);
        } catch (err) {
          const mockFallback = getMockBranchCatalog(branchSlug);
          if (import.meta.env.DEV && mockFallback) {
            return mockFallback;
          }
          throw err;
        }
      },
    };
