import type {
  BranchPricingRepository,
  BranchProductAdminItem,
} from "./branch-pricing-repository";
import {
  calculatePortionPrice,
  portionFromGrams,
} from "@/features/catalog/lib/portion-pricing";

export const INITIAL_MOCK_ITEMS: BranchProductAdminItem[] = [
  {
    productId: "p-almendras",
    name: "Almendras Nonpareil",
    description: "Almendras seleccionadas calibre grande.",
    categoryId: "c-frutos-secos",
    categoryName: "Frutos Secos",
    saleUnit: "WEIGHT",
    barcode: null,
    imageUrls: [],
    status: "ACTIVE",
    price: 14500,
    promotionalPrice: null,
    isOnSale: false,
    isAvailable: true,
    isFeatured: true,
  },
  {
    productId: "p-nueces",
    name: "Nueces Mariposa Extra Light",
    description: "Mitades seleccionadas de cosecha nueva.",
    categoryId: "c-frutos-secos",
    categoryName: "Frutos Secos",
    saleUnit: "WEIGHT",
    barcode: null,
    imageUrls: [],
    status: "ACTIVE",
    price: 19000,
    promotionalPrice: 16500,
    isOnSale: true,
    isAvailable: true,
    isFeatured: false,
  },
  {
    productId: "p-galletas-arroz",
    name: "Galletas de Arroz Sin TACC",
    description: "Paquete por 150g libre de gluten.",
    categoryId: "c-sin-tacc",
    categoryName: "Sin TACC",
    saleUnit: "UNIT",
    barcode: "7791234567890",
    imageUrls: [],
    status: "INACTIVE",
    price: 2400,
    promotionalPrice: null,
    isOnSale: false,
    isAvailable: false,
    isFeatured: false,
  },
  {
    productId: "p-pistachos",
    name: "Pistachos Tostados con Sal",
    description: "Pistachos calibre especial.",
    categoryId: "c-frutos-secos",
    categoryName: "Frutos Secos",
    saleUnit: "WEIGHT",
    barcode: null,
    imageUrls: [],
    status: "UNCONFIGURED",
    price: null,
    promotionalPrice: null,
    isOnSale: false,
    isAvailable: false,
    isFeatured: false,
  },
];

function validateOfferInput(
  isOnSale: boolean,
  promotionalPrice: number | null | undefined,
  regularPrice: number
): void {
  if (!isOnSale) return;

  if (!promotionalPrice || promotionalPrice <= 0) {
    throw new Error("Ingresá un precio promocional válido mayor a $0.");
  }
  if (promotionalPrice >= regularPrice) {
    throw new Error("El precio de oferta debe ser menor al precio regular.");
  }
}

export function createInMemoryBranchPricingRepository(
  seed: BranchProductAdminItem[] = INITIAL_MOCK_ITEMS
): BranchPricingRepository {
  const store = new Map<string, BranchProductAdminItem[]>(
    [["default", seed.map((item) => ({ ...item }))]]
  );

  function getBranchItems(branchId: string): BranchProductAdminItem[] {
    if (!store.has(branchId)) {
      store.set(
        branchId,
        seed.map((item) => ({ ...item }))
      );
    }
    return store.get(branchId)!;
  }

  return {
    async listProducts(branchId, _token, query = {}) {
      const items = getBranchItems(branchId);
      const search = query.search?.trim().toLowerCase() ?? "";

      const filtered = items.filter((item) => {
        if (query.status && item.status !== query.status) return false;
        if (query.isOnSale !== undefined && item.isOnSale !== query.isOnSale) return false;
        if (query.categoryId && item.categoryId !== query.categoryId) return false;
        if (search) {
          const matchesName = item.name.toLowerCase().includes(search);
          const matchesBarcode = item.barcode?.toLowerCase().includes(search) ?? false;
          if (!matchesName && !matchesBarcode) return false;
        }
        return true;
      });

      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const start = (page - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      return {
        items: paged,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      };
    },

    async getCounts(branchId) {
      const items = getBranchItems(branchId);
      return {
        ACTIVE: items.filter((i) => i.status === "ACTIVE").length,
        INACTIVE: items.filter((i) => i.status === "INACTIVE").length,
        UNCONFIGURED: items.filter((i) => i.status === "UNCONFIGURED").length,
        ON_SALE: items.filter((i) => i.isOnSale).length,
      };
    },

    async upsertProduct(branchId, productId, _token, input) {
      if (input.isAvailable && input.price <= 0) {
        throw new Error("El precio debe ser mayor a $0 para activar el producto en la sucursal.");
      }

      const items = getBranchItems(branchId);
      const idx = items.findIndex((i) => i.productId === productId);
      if (idx === -1) {
        throw new Error("Producto no encontrado.");
      }

      const current = items[idx]!;
      const nextIsOnSale =
        input.isOnSale !== undefined
          ? input.isOnSale
          : current.isOnSale &&
            current.promotionalPrice !== null &&
            current.promotionalPrice < input.price;
      const nextPromo =
        input.promotionalPrice !== undefined
          ? input.promotionalPrice
          : nextIsOnSale
            ? current.promotionalPrice
            : null;

      const nextIsFeatured =
        input.isFeatured !== undefined ? input.isFeatured : (current.isFeatured ?? false);

      const updated: BranchProductAdminItem = {
        ...current,
        price: input.price,
        isAvailable: input.isAvailable,
        status: input.isAvailable ? "ACTIVE" : "INACTIVE",
        isOnSale: nextIsOnSale,
        promotionalPrice: nextPromo,
        isFeatured: nextIsFeatured,
      };
      items[idx] = updated;

      return {
        id: `bp-${branchId}-${productId}`,
        branchId,
        productId,
        price: updated.price ?? 0,
        promotionalPrice: updated.promotionalPrice,
        isOnSale: updated.isOnSale,
        isAvailable: updated.isAvailable,
        isFeatured: updated.isFeatured,
      };
    },

    async updateOffer(branchId, productId, _token, input) {
      const items = getBranchItems(branchId);
      const idx = items.findIndex((i) => i.productId === productId);
      if (idx === -1) {
        throw new Error("Producto no encontrado.");
      }

      const current = items[idx]!;
      if (current.price === null || current.price <= 0) {
        throw new Error("Configurá primero el precio base antes de activar una oferta.");
      }

      const weightOffers = input.weightOffers ?? [];
      if (input.isOnSale && weightOffers.length > 0) {
        for (const offer of weightOffers) {
          if (!(current.weightOptionsGrams ?? []).includes(offer.weightGrams)) {
            throw new Error("El gramaje seleccionado no está configurado para el producto.");
          }
          const regularPortionPrice = calculatePortionPrice(
            current.price,
            portionFromGrams(offer.weightGrams)
          );
          if (offer.promotionalPrice <= 0 || offer.promotionalPrice >= regularPortionPrice) {
            throw new Error("El precio de oferta debe ser menor al precio regular.");
          }
        }
      } else {
        validateOfferInput(input.isOnSale, input.promotionalPrice, current.price);
      }

      const updated: BranchProductAdminItem = {
        ...current,
        isOnSale: input.isOnSale,
        promotionalPrice:
          input.isOnSale && weightOffers.length === 0
            ? (input.promotionalPrice ?? null)
            : null,
        weightOffers: input.isOnSale ? weightOffers : [],
      };
      items[idx] = updated;

      return {
        id: `bp-${branchId}-${productId}`,
        branchId,
        productId,
        price: updated.price ?? 0,
        promotionalPrice: updated.promotionalPrice,
        isOnSale: updated.isOnSale,
        isAvailable: updated.isAvailable,
        isFeatured: updated.isFeatured,
      };
    },
  };
}
