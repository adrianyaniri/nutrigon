import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_FILTERS, type CatalogFilters, type SortOption } from "../types";

const SORT_VALUES: readonly SortOption[] = ["popular", "price-asc", "price-desc", "name-asc"];

function parseSort(value: string | null): SortOption {
  return SORT_VALUES.find((option) => option === value) ?? DEFAULT_FILTERS.sort;
}

/**
 * Catalog filters live in the URL (`?sucursal=&q=&categoria=&orden=`):
 * state survives reloads and PWA relaunches and any view can be shared.
 */
export function useCatalogFilters(defaultBranchSlug: string | null) {
  const [params, setParams] = useSearchParams();

  const branchSlug = params.get("sucursal") ?? defaultBranchSlug;

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
    branchSlug,
    filters,
    // A category from one branch may not exist in another: reset it on switch.
    setBranch: (slug: string) => update({ sucursal: slug, categoria: null }),
    setSearch: (value: string) => update({ q: value }),
    setCategory: (slug: string | null) => update({ categoria: slug }),
    setSort: (sort: SortOption) => update({ orden: sort === "popular" ? null : sort }),
    clearFilters: () => update({ q: null, categoria: null, orden: null }),
  };
}
