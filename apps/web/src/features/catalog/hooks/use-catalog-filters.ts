import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_FILTERS, type CatalogFilters, type SortOption } from "../types";

const SORT_VALUES: readonly SortOption[] = ["popular", "price-asc", "price-desc", "name-asc"];

function parseSort(value: string | null): SortOption {
  return SORT_VALUES.find((option) => option === value) ?? DEFAULT_FILTERS.sort;
}

/**
 * Catalog filters manage URL query parameters (`?q=&categoria=&orden=`):
 * search, category, and sorting survive reloads, and the branch is part of the route path (`/catalogo/:branchSlug`).
 */
export function useCatalogFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<CatalogFilters>(
    () => ({
      search: params.get("q") ?? DEFAULT_FILTERS.search,
      categorySlug: params.get("categoria"),
      sort: parseSort(params.get("orden")),
    }),
    [params]
  );

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  return {
    filters,
    setSearch: (value: string) => update({ q: value }),
    setCategory: (slug: string | null) => update({ categoria: slug }),
    setSort: (sort: SortOption) => update({ orden: sort === "popular" ? null : sort }),
    clearFilters: () => update({ q: null, categoria: null, orden: null }),
  };
}
