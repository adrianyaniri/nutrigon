import { DEFAULT_PRODUCT_IMAGE } from "@/components/atoms/product-image";
import type {
  BranchCatalogPage,
  CatalogBranch,
  CatalogCategory,
  CatalogPageRequest,
  CatalogProduct,
  SaleUnit,
} from "../types";
import { getMockBranchCatalog, getMockBranches } from "./mock-catalog";

export interface CatalogRepository {
  getBranches(): Promise<CatalogBranch[]>;
  getBranchCatalogPage(
    branchSlug: string,
    request: CatalogPageRequest
  ): Promise<BranchCatalogPage>;
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
  weightOptionsGrams?: number[];
  defaultWeightGrams?: number;
  priceReferenceGrams?: number;
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

function mapApiProductToCatalogProduct(item: ApiCatalogProductItem): CatalogProduct {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    saleUnit: item.saleUnit,
    weightOptionsGrams: item.weightOptionsGrams,
    defaultWeightGrams: item.defaultWeightGrams,
    priceReferenceGrams: item.priceReferenceGrams,
    imageUrl: item.imageUrls[0] || DEFAULT_PRODUCT_IMAGE,
    price: item.price,
    promotionalPrice: item.isOnSale ? item.promotionalPrice : null,
    isFeatured: item.isFeatured ?? false,
  };
}

function createMockPage(
  branchSlug: string,
  request: CatalogPageRequest
): BranchCatalogPage {
  const catalog = getMockBranchCatalog(branchSlug);
  if (!catalog) throw new Error(`Branch "${branchSlug}" was not found.`);

  const search = request.search?.trim().toLocaleLowerCase("es");
  const category = request.categorySlug;
  const matchingProducts = catalog.products.filter((product) => {
    if (search && !product.name.toLocaleLowerCase("es").includes(search)) return false;
    if (category) {
      const categoryId = catalog.categories.find((item) => item.slug === category)?.id;
      if (!categoryId || product.categoryId !== categoryId) return false;
    }
    if (request.isOnSale && product.promotionalPrice === null) return false;
    return true;
  });
  const start = (request.page - 1) * request.limit;
  return {
    branch: catalog.branch,
    categories: catalog.categories,
    products: matchingProducts.slice(start, start + request.limit),
    total: matchingProducts.length,
    page: request.page,
    limit: request.limit,
    totalPages: Math.max(1, Math.ceil(matchingProducts.length / request.limit)),
  };
}

export const mockCatalogRepository: CatalogRepository = {
  async getBranches() {
    return getMockBranches();
  },
  async getBranchCatalogPage(branchSlug, request) {
    return createMockPage(branchSlug, request);
  },
};

function createCatalogUrl(
  baseUrl: string,
  branchSlug: string,
  request: CatalogPageRequest
): string {
  const params = new URLSearchParams({
    page: String(request.page),
    limit: String(request.limit),
  });
  if (request.search?.trim()) params.set("search", request.search.trim());
  if (request.categorySlug) params.set("categorySlug", request.categorySlug);
  if (typeof request.isOnSale === "boolean")
    params.set("isOnSale", String(request.isOnSale));
  return `${baseUrl}/api/v1/branches/${encodeURIComponent(branchSlug)}/catalog?${params.toString()}`;
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
        if (!res.ok) throw new Error(`Failed to fetch branches (status ${res.status})`);
        const data = (await res.json()) as ApiBranchItem[];
        return data
          .filter((branch) => branch.isActive !== false)
          .map(({ id, name, slug, address, phone, whatsappNumber }) => ({
            id,
            name,
            slug,
            address,
            phone,
            whatsappNumber,
          }));
      } catch (error: unknown) {
        if (typeof window !== "undefined" && import.meta.env.MODE === "test") {
          return getMockBranches();
        }
        throw error;
      }
    },

    async getBranchCatalogPage(branchSlug, request): Promise<BranchCatalogPage> {
      const response = await fetchFn(
        createCatalogUrl(normalizedBase, branchSlug, request)
      );
      if (!response.ok) {
        throw new Error(
          `Branch "${branchSlug}" catalog failed (status ${response.status}).`
        );
      }
      const payload = (await response.json()) as ApiPublicCatalogResponse;
      return {
        branch: payload.branch,
        categories: payload.categories,
        products: payload.items.map(mapApiProductToCatalogProduct),
        total: payload.total,
        page: payload.page,
        limit: payload.limit,
        totalPages: payload.totalPages,
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
        } catch (error) {
          if (import.meta.env.DEV) return mockCatalogRepository.getBranches();
          throw error;
        }
      },
      async getBranchCatalogPage(branchSlug, request) {
        try {
          return await httpRepository.getBranchCatalogPage(branchSlug, request);
        } catch (error) {
          if (import.meta.env.DEV)
            return mockCatalogRepository.getBranchCatalogPage(branchSlug, request);
          throw error;
        }
      },
    };
