import type {
  CatalogCategory,
  CatalogFilters,
  CatalogProduct,
  CategoryOption,
} from "../types";

export function isOnSale(product: Pick<CatalogProduct, "price" | "promotionalPrice">): boolean {
  return product.promotionalPrice !== null && product.promotionalPrice < product.price;
}

export function getEffectivePrice(
  product: Pick<CatalogProduct, "price" | "promotionalPrice">
): number {
  return isOnSale(product) ? (product.promotionalPrice as number) : product.price;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const nameCollator = new Intl.Collator("es", { sensitivity: "base" });

export const OFFERS_CATEGORY_SLUG = "ofertas";
export const COMBOS_CATEGORY_SLUG = "combos";

export function filterAndSortProducts(
  products: readonly CatalogProduct[],
  categories: readonly CatalogCategory[],
  filters: CatalogFilters
): CatalogProduct[] {
  const term = normalize(filters.search);

  let categoryId: string | null = null;
  const isOffersFilter = filters.categorySlug === OFFERS_CATEGORY_SLUG;
  const isCombosFilter = filters.categorySlug === COMBOS_CATEGORY_SLUG;

  if (filters.categorySlug !== null && !isOffersFilter && !isCombosFilter) {
    const category = categories.find((c) => c.slug === filters.categorySlug);
    if (!category) return [];
    categoryId = category.id;
  }

  const filtered = products.filter((product) => {
    if (isOffersFilter && (product.isCombo || !isOnSale(product))) return false;
    if (isCombosFilter && !product.isCombo) return false;
    if (categoryId !== null && product.categoryId !== categoryId) return false;
    if (term && !normalize(product.name).includes(term)) return false;
    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      return filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    case "price-desc":
      return filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    case "name-asc":
      return filtered.sort((a, b) => nameCollator.compare(a.name, b.name));
    default:
      return filtered.sort((a, b) => {
        const comboDiff = (b.isCombo ? 1 : 0) - (a.isCombo ? 1 : 0);
        if (comboDiff !== 0) return comboDiff;
        const featuredDiff = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        if (featuredDiff !== 0) return featuredDiff;
        return 0;
      });
  }
}

export function buildCategoryOptions(
  categories: readonly CatalogCategory[],
  products: readonly CatalogProduct[],
  config?: { includeSpecialFilters?: boolean }
): CategoryOption[] {
  const countByCategory = new Map<string, number>();
  let offersCount = 0;
  let combosCount = 0;

  for (const product of products) {
    if (product.isCombo) {
      combosCount += 1;
      continue;
    }
    if (isOnSale(product)) {
      offersCount += 1;
    }
    countByCategory.set(product.categoryId, (countByCategory.get(product.categoryId) ?? 0) + 1);
  }

  const specialOptions: CategoryOption[] = [];
  if (config?.includeSpecialFilters) {
    if (offersCount > 0) {
      specialOptions.push({
        value: OFFERS_CATEGORY_SLUG,
        label: "Ofertas",
        count: offersCount,
      });
    }
    if (combosCount > 0) {
      specialOptions.push({
        value: COMBOS_CATEGORY_SLUG,
        label: "Combos",
        count: combosCount,
      });
    }
  }

  const options: CategoryOption[] = categories
    .filter((category) => (countByCategory.get(category.id) ?? 0) > 0)
    .map((category) => ({
      value: category.slug,
      label: category.name,
      count: countByCategory.get(category.id) ?? 0,
    }));

  return [{ value: null, label: "Todos", count: products.length }, ...specialOptions, ...options];
}

