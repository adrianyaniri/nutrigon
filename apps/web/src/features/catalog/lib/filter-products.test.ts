import { describe, expect, it } from "vitest";
import type { CatalogCategory, CatalogProduct } from "../types";
import {
  buildCategoryOptions,
  filterAndSortProducts,
  getEffectivePrice,
  isOnSale,
} from "./filter-products";

const categories: CatalogCategory[] = [
  { id: "c1", name: "Frutos Secos", slug: "frutos-secos" },
  { id: "c2", name: "Harinas & Granos", slug: "harinas-granos" },
  { id: "c3", name: "Suplementos", slug: "suplementos" },
];

function product(overrides: Partial<CatalogProduct> & Pick<CatalogProduct, "id" | "name">) {
  return {
    categoryId: "c1",
    description: null,
    saleUnit: "WEIGHT",
    imageUrl: null,
    price: 1000,
    promotionalPrice: null,
    ...overrides,
  } satisfies CatalogProduct;
}

const products: CatalogProduct[] = [
  product({ id: "p1", name: "Almendras", price: 1450 }),
  product({ id: "p2", name: "Avena Arrollada", categoryId: "c2", price: 600 }),
  product({ id: "p3", name: "Nueces Mariposa", price: 2000, promotionalPrice: 1500 }),
  product({ id: "p4", name: "Proteína Vegetal", categoryId: "c3", saleUnit: "UNIT", price: 9000 }),
];

describe("getEffectivePrice / isOnSale", () => {
  it("uses the promotional price only when it is lower than the regular price", () => {
    expect(getEffectivePrice(products[2]!)).toBe(1500);
    expect(isOnSale(products[2]!)).toBe(true);
  });

  it("ignores missing or higher promotional prices", () => {
    expect(getEffectivePrice(products[0]!)).toBe(1450);
    expect(isOnSale(products[0]!)).toBe(false);
    const bogus = product({ id: "x", name: "X", price: 100, promotionalPrice: 150 });
    expect(isOnSale(bogus)).toBe(false);
    expect(getEffectivePrice(bogus)).toBe(100);
  });
});

describe("filterAndSortProducts", () => {
  const base = { search: "", categorySlug: null, sort: "popular" } as const;

  it("returns every product in original order by default", () => {
    const result = filterAndSortProducts(products, categories, base);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p3", "p4"]);
  });

  it("prioritizes combos and featured products under popular sort", () => {
    const mixedProducts: CatalogProduct[] = [
      product({ id: "p1", name: "Almendras", isFeatured: false }),
      product({ id: "p2", name: "Avena", isFeatured: true }),
      product({ id: "p3", name: "Nueces", isFeatured: false }),
      product({ id: "p4", name: "Combo Desayuno", isCombo: true }),
    ];
    const result = filterAndSortProducts(mixedProducts, categories, base);
    expect(result.map((p) => p.id)).toEqual(["p4", "p2", "p1", "p3"]);
  });

  it("filters by category slug", () => {
    const result = filterAndSortProducts(products, categories, {
      ...base,
      categorySlug: "frutos-secos",
    });
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("returns nothing for an unknown category slug", () => {
    const result = filterAndSortProducts(products, categories, { ...base, categorySlug: "nope" });
    expect(result).toEqual([]);
  });

  it("searches ignoring case and accents", () => {
    const result = filterAndSortProducts(products, categories, { ...base, search: "proteina" });
    expect(result.map((p) => p.id)).toEqual(["p4"]);
  });

  it("ignores surrounding whitespace in the search term", () => {
    const result = filterAndSortProducts(products, categories, { ...base, search: "  AVENA " });
    expect(result.map((p) => p.id)).toEqual(["p2"]);
  });

  it("sorts by effective price ascending and descending", () => {
    const asc = filterAndSortProducts(products, categories, { ...base, sort: "price-asc" });
    expect(asc.map((p) => p.id)).toEqual(["p2", "p1", "p3", "p4"]);
    const desc = filterAndSortProducts(products, categories, { ...base, sort: "price-desc" });
    expect(desc.map((p) => p.id)).toEqual(["p4", "p3", "p1", "p2"]);
  });

  it("sorts by name using Spanish collation", () => {
    const result = filterAndSortProducts(products, categories, { ...base, sort: "name-asc" });
    expect(result.map((p) => p.name)).toEqual([
      "Almendras",
      "Avena Arrollada",
      "Nueces Mariposa",
      "Proteína Vegetal",
    ]);
  });

  it("does not mutate the input array", () => {
    const copy = [...products];
    filterAndSortProducts(products, categories, { ...base, sort: "price-desc" });
    expect(products).toEqual(copy);
  });
});

describe("buildCategoryOptions", () => {
  it("prepends an 'all' option and counts products per category", () => {
    const options = buildCategoryOptions(categories, products);
    expect(options).toEqual([
      { value: null, label: "Todos", count: 4 },
      { value: "frutos-secos", label: "Frutos Secos", count: 2 },
      { value: "harinas-granos", label: "Harinas & Granos", count: 1 },
      { value: "suplementos", label: "Suplementos", count: 1 },
    ]);
  });

  it("omits categories without products", () => {
    const options = buildCategoryOptions(categories, [products[0]!]);
    expect(options.map((o) => o.value)).toEqual([null, "frutos-secos"]);
  });

  it("includes Ofertas and Combos when includeSpecialFilters is enabled", () => {
    const withCombo = [
      ...products,
      product({
        id: "combo-1",
        name: "Combo Desayuno",
        categoryId: "__combos__",
        saleUnit: "UNIT",
        price: 12000,
        promotionalPrice: 9900,
        isCombo: true,
      }),
    ];
    const options = buildCategoryOptions(categories, withCombo, { includeSpecialFilters: true });
    expect(options.slice(0, 3)).toEqual([
      { value: null, label: "Todos", count: 5 },
      { value: "ofertas", label: "Ofertas", count: 1 },
      { value: "combos", label: "Combos", count: 1 },
    ]);

    const offersOnly = filterAndSortProducts(withCombo, categories, {
      search: "",
      categorySlug: "ofertas",
      sort: "popular",
    });
    expect(offersOnly.map((p) => p.id)).toEqual(["p3"]);

    const combosOnly = filterAndSortProducts(withCombo, categories, {
      search: "",
      categorySlug: "combos",
      sort: "popular",
    });
    expect(combosOnly.map((p) => p.id)).toEqual(["combo-1"]);
  });
});

