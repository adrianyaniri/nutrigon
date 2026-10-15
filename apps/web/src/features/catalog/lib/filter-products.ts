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

export function filterAndSortProducts(
  products: readonly CatalogProduct[],
  categories: readonly CatalogCategory[],
  filters: CatalogFilters
): CatalogProduct[] {
  const term = normalize(filters.search);

  let categoryId: string | null = null;
  if (filters.categorySlug !== null) {
    const category = categories.find((c) => c.slug === filters.categorySlug);
    if (!category) return [];
    categoryId = category.id;
  }

  const filtered = products.filter((product) => {
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
      return filtered;
  }
}

export function buildCategoryOptions(
  categories: readonly CatalogCategory[],
  products: readonly CatalogProduct[]
): CategoryOption[] {
  const countByCategory = new Map<string, number>();
  for (const product of products) {
    countByCategory.set(product.categoryId, (countByCategory.get(product.categoryId) ?? 0) + 1);
  }

  const options: CategoryOption[] = categories
    .filter((category) => (countByCategory.get(category.id) ?? 0) > 0)
    .map((category) => ({
      value: category.slug,
      label: category.name,
      count: countByCategory.get(category.id) ?? 0,
    }));

  return [{ value: null, label: "Todos", count: products.length }, ...options];
}
