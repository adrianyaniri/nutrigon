import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { catalogRepository } from "../data/catalog-repository";
import { OFFERS_CATEGORY_SLUG } from "../lib/filter-products";
import type { CatalogFilters } from "../types";

export const CATALOG_PAGE_SIZE = 24;

export const catalogKeys = {
  branches: ["catalog", "branches"] as const,
  branch: (slug: string, filters?: CatalogFilters) =>
    [
      "catalog",
      "branch",
      slug,
      filters?.search ?? "",
      filters?.categorySlug ?? null,
      filters?.sort ?? "popular",
    ] as const,
};

function getCatalogRequest(filters: CatalogFilters, page: number) {
  return {
    page,
    limit: CATALOG_PAGE_SIZE,
    search: filters.search || undefined,
    categorySlug:
      filters.categorySlug && filters.categorySlug !== OFFERS_CATEGORY_SLUG
        ? filters.categorySlug
        : undefined,
    isOnSale: filters.categorySlug === OFFERS_CATEGORY_SLUG ? true : undefined,
  };
}

export function useBranches() {
  return useQuery({
    queryKey: catalogKeys.branches,
    queryFn: () => catalogRepository.getBranches(),
  });
}

export function useBranchCatalogPages(
  branchSlug: string | null,
  filters: CatalogFilters
) {
  return useInfiniteQuery({
    queryKey: catalogKeys.branch(branchSlug ?? "", filters),
    queryFn: ({ pageParam }) =>
      catalogRepository.getBranchCatalogPage(
        branchSlug as string,
        getCatalogRequest(filters, pageParam)
      ),
    initialPageParam: 1,
    enabled: branchSlug !== null,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}
