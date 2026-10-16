import type {
  BranchCatalog,
  CatalogBranch,
  CatalogCategory,
  CatalogProduct,
} from "../types";

/**
 * TEMPORARY in-memory data source.
 * Replace with an HTTP implementation once the public catalog endpoint exists
 * in `apps/api`; the `CatalogRepository` contract must stay the same.
 */

const BRANCHES: CatalogBranch[] = [
  {
    id: "b-centro",
    name: "Centro",
    slug: "centro",
    address: "San Martín 450 (Centro)",
    phone: "351-4210001",
    whatsappNumber: "5493514210001",
  },
  {
    id: "b-norte",
    name: "Norte",
    slug: "norte",
    address: "Av. Libertad 1200",
    phone: "351-4820002",
    whatsappNumber: "5493514820002",
  },
  {
    id: "b-sur",
    name: "Sur",
    slug: "sur",
    address: "Belgrano 890",
    phone: "351-4630003",
    whatsappNumber: "5493514630003",
  },
];

/** Branch-specific price multiplier, to exercise per-branch pricing. */
const PRICE_FACTOR: Record<string, number> = {
  centro: 1,
  norte: 1.05,
  sur: 0.98,
};

const CATEGORIES: CatalogCategory[] = [
  { id: "c-frutos-secos", name: "Frutos Secos", slug: "frutos-secos" },
  { id: "c-harinas-granos", name: "Harinas & Granos", slug: "harinas-granos" },
  { id: "c-sin-tacc", name: "Sin TACC", slug: "sin-tacc" },
  { id: "c-suplementos", name: "Suplementos", slug: "suplementos" },
  { id: "c-semillas-frutas", name: "Semillas & Frutas", slug: "semillas-frutas" },
];

interface SeedProduct extends Omit<CatalogProduct, "imageUrl" | "description"> {
  /** Branch slugs where the product is NOT sold. */
  unavailableIn?: string[];
}

const SEED: SeedProduct[] = [
  { id: "p-almendras", categoryId: "c-frutos-secos", name: "Almendras Nonpareil", saleUnit: "WEIGHT", price: 1450, promotionalPrice: null, isFeatured: true },
  { id: "p-nueces", categoryId: "c-frutos-secos", name: "Nueces Mariposa", saleUnit: "WEIGHT", price: 1900, promotionalPrice: 1600 },
  { id: "p-castanas", categoryId: "c-frutos-secos", name: "Castañas de Cajú", saleUnit: "WEIGHT", price: 2100, promotionalPrice: null },
  { id: "p-pistachos", categoryId: "c-frutos-secos", name: "Pistachos Tostados", saleUnit: "WEIGHT", price: 2600, promotionalPrice: null, unavailableIn: ["sur"] },
  { id: "p-avena", categoryId: "c-harinas-granos", name: "Avena Tradicional Arrollada", saleUnit: "WEIGHT", price: 380, promotionalPrice: null },
  { id: "p-harina-integral", categoryId: "c-harinas-granos", name: "Harina Integral Orgánica", saleUnit: "WEIGHT", price: 320, promotionalPrice: null },
  { id: "p-quinoa", categoryId: "c-harinas-granos", name: "Quinoa Real", saleUnit: "WEIGHT", price: 950, promotionalPrice: 800, isFeatured: true },
  { id: "p-galletas-arroz", categoryId: "c-sin-tacc", name: "Galletas de Arroz", saleUnit: "UNIT", price: 2400, promotionalPrice: null },
  { id: "p-premezcla", categoryId: "c-sin-tacc", name: "Premezcla Sin TACC", saleUnit: "UNIT", price: 3900, promotionalPrice: null },
  { id: "p-proteina", categoryId: "c-suplementos", name: "Proteína Vegetal 500 g", saleUnit: "UNIT", price: 12500, promotionalPrice: null, unavailableIn: ["norte"] },
  { id: "p-colageno", categoryId: "c-suplementos", name: "Colágeno Hidrolizado", saleUnit: "UNIT", price: 9800, promotionalPrice: 8900 },
  { id: "p-chia", categoryId: "c-semillas-frutas", name: "Semillas de Chía", saleUnit: "WEIGHT", price: 420, promotionalPrice: null },
  { id: "p-lino", categoryId: "c-semillas-frutas", name: "Semillas de Lino", saleUnit: "WEIGHT", price: 260, promotionalPrice: null },
  { id: "p-pasas", categoryId: "c-semillas-frutas", name: "Pasas de Uva Rubias", saleUnit: "WEIGHT", price: 540, promotionalPrice: null },
];

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

export function getMockBranches(): CatalogBranch[] {
  return BRANCHES;
}

export function getMockBranchCatalog(slug: string): BranchCatalog | null {
  const branch = BRANCHES.find((b) => b.slug === slug);
  if (!branch) return null;

  const factor = PRICE_FACTOR[slug] ?? 1;
  const products: CatalogProduct[] = SEED.filter((p) => !p.unavailableIn?.includes(slug)).map(
    ({ unavailableIn: _unavailableIn, ...product }) => ({
      ...product,
      description: null,
      imageUrl: null,
      price: roundToTen(product.price * factor),
      promotionalPrice:
        product.promotionalPrice === null ? null : roundToTen(product.promotionalPrice * factor),
      isFeatured: product.isFeatured ?? false,
    })
  );

  return { branch, categories: CATEGORIES, products };
}
