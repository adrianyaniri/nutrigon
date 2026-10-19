import { uploadOptimizedMediaToR2 } from "@/lib/image/optimize-image";
import type {
  BranchComboAdminItem,
  CreateComboInput,
  UpdateComboInput,
} from "../types";

export interface CombosRepository {
  listForBranch(branchId: string, token: string): Promise<BranchComboAdminItem[]>;
  createForBranch(
    branchId: string,
    token: string,
    input: CreateComboInput
  ): Promise<BranchComboAdminItem>;
  updateForBranch(
    branchId: string,
    comboId: string,
    token: string,
    input: UpdateComboInput
  ): Promise<BranchComboAdminItem>;
  deleteForBranch(
    branchId: string,
    comboId: string,
    token: string
  ): Promise<{ success: boolean }>;
  uploadComboImage(
    token: string,
    file: File
  ): Promise<string>;
}

const INITIAL_MOCK_COMBOS: BranchComboAdminItem[] = [
  {
    id: "combo-desayuno",
    branchId: "b-centro",
    name: "Pack Desayuno Saludable",
    description: "Almendras tostadas + Avena arrollada + Semillas de chía.",
    imageUrls: ["https://cdn.nutrigon.com/combos/desayuno.webp"],
    price: 11500,
    isAvailable: true,
    isActive: true,
    items: [
      {
        productId: "p-almendras",
        productName: "Almendras Nonpareil",
        quantity: 0.5,
        saleUnit: "WEIGHT",
      },
      {
        productId: "p-avena",
        productName: "Avena Arrollada",
        quantity: 1,
        saleUnit: "WEIGHT",
      },
      {
        productId: "p-chia",
        productName: "Semillas de Chía",
        quantity: 0.25,
        saleUnit: "WEIGHT",
      },
    ],
  },
  {
    id: "combo-degustacion",
    branchId: "b-centro",
    name: "Mix Degustación Frutos Secos",
    description: "Nueces Chandler + Castañas de Cajú + Pasas de Uva.",
    imageUrls: ["https://cdn.nutrigon.com/combos/degustacion.webp"],
    price: 14500,
    isAvailable: true,
    isActive: true,
    items: [
      {
        productId: "p-nueces",
        productName: "Nueces Chandler",
        quantity: 0.5,
        saleUnit: "WEIGHT",
      },
      {
        productId: "p-castanas",
        productName: "Castañas de Cajú",
        quantity: 0.5,
        saleUnit: "WEIGHT",
      },
    ],
  },
];

export interface InMemoryCombosRepository extends CombosRepository {
  reset: () => void;
}

export function createInMemoryCombosRepository(
  seed: BranchComboAdminItem[] = INITIAL_MOCK_COMBOS
): InMemoryCombosRepository {
  let store = new Map<string, BranchComboAdminItem[]>(
    [["default", seed.map((c) => ({ ...c }))]]
  );

  function getBranchCombos(branchId: string): BranchComboAdminItem[] {
    if (!store.has(branchId)) {
      store.set(
        branchId,
        seed.map((c) => ({ ...c }))
      );
    }
    return store.get(branchId)!;
  }

  return {
    reset() {
      store = new Map<string, BranchComboAdminItem[]>(
        [["default", seed.map((c) => ({ ...c }))]]
      );
    },

    async listForBranch(branchId) {
      const combos = getBranchCombos(branchId);
      return combos.filter((c) => c.isActive);
    },

    async createForBranch(branchId, _token, input) {
      if (!input.name || input.name.trim().length < 2) {
        throw new Error("El nombre del combo debe tener al menos 2 caracteres.");
      }
      if (!input.price || input.price <= 0) {
        throw new Error("El precio del combo debe ser mayor a $0.");
      }
      if (!input.items || input.items.length < 2) {
        throw new Error("Un combo debe incluir al menos 2 productos.");
      }

      const combos = getBranchCombos(branchId);
      const newCombo: BranchComboAdminItem = {
        id: `combo-${Date.now()}`,
        branchId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        imageUrls: input.imageUrls || [],
        price: input.price,
        isAvailable: input.isAvailable ?? true,
        isActive: true,
        items: input.items.map((i) => ({
          productId: i.productId,
          productName: `Producto (${i.productId})`,
          quantity: i.quantity,
          saleUnit: "WEIGHT",
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      combos.unshift(newCombo);
      return newCombo;
    },

    async updateForBranch(branchId, comboId, _token, input) {
      const combos = getBranchCombos(branchId);
      const idx = combos.findIndex((c) => c.id === comboId);
      if (idx === -1) {
        throw new Error("Combo no encontrado.");
      }

      const current = combos[idx]!;
      const updated: BranchComboAdminItem = {
        ...current,
        name: input.name !== undefined ? input.name.trim() : current.name,
        description:
          input.description !== undefined
            ? input.description?.trim() || null
            : current.description,
        imageUrls: input.imageUrls !== undefined ? input.imageUrls : current.imageUrls,
        price: input.price !== undefined ? input.price : current.price,
        isAvailable:
          input.isAvailable !== undefined ? input.isAvailable : current.isAvailable,
        updatedAt: new Date().toISOString(),
      };
      combos[idx] = updated;
      return updated;
    },

    async deleteForBranch(branchId, comboId) {
      const combos = getBranchCombos(branchId);
      const idx = combos.findIndex((c) => c.id === comboId);
      if (idx !== -1) {
        combos[idx]!.isActive = false;
      }
      return { success: true };
    },

    async uploadComboImage(_token, file) {
      return `https://mock-cdn.nutrigon.com/combos/${encodeURIComponent(file.name)}`;
    },
  };
}

async function parseApiError(res: Response, fallbackMessage: string): Promise<Error> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message) && body.message.length > 0) {
      return new Error(body.message[0]);
    }
    if (typeof body.message === "string" && body.message.trim()) {
      return new Error(body.message);
    }
  } catch {
    // Ignore JSON parse failure
  }
  return new Error(fallbackMessage);
}

export function createHttpCombosRepository(
  baseUrl = "",
  fetchFn: typeof fetch = fetch
): CombosRepository {
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  return {
    async listForBranch(branchId, token) {
      const url = `${normalizedBase}/api/v1/branches/${encodeURIComponent(branchId)}/combos`;
      const res = await fetchFn(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw await parseApiError(res, "No se pudieron obtener los combos de la sucursal.");
      }

      return (await res.json()) as BranchComboAdminItem[];
    },

    async createForBranch(branchId, token, input) {
      const url = `${normalizedBase}/api/v1/branches/${encodeURIComponent(branchId)}/combos`;
      const res = await fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw await parseApiError(res, "No se pudo crear el combo en la sucursal.");
      }

      return (await res.json()) as BranchComboAdminItem;
    },

    async updateForBranch(branchId, comboId, token, input) {
      const url = `${normalizedBase}/api/v1/branches/${encodeURIComponent(
        branchId
      )}/combos/${encodeURIComponent(comboId)}`;
      const res = await fetchFn(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw await parseApiError(res, "No se pudo actualizar el combo.");
      }

      return (await res.json()) as BranchComboAdminItem;
    },

    async deleteForBranch(branchId, comboId, token) {
      const url = `${normalizedBase}/api/v1/branches/${encodeURIComponent(
        branchId
      )}/combos/${encodeURIComponent(comboId)}`;
      const res = await fetchFn(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw await parseApiError(res, "No se pudo eliminar el combo.");
      }

      return { success: true };
    },

    async uploadComboImage(token, file) {
      return uploadOptimizedMediaToR2({
        baseUrl: normalizedBase,
        fetchFn,
        token,
        file,
        folder: "combos",
      });
    },
  };
}

const isTestEnv = import.meta.env.MODE === "test" && !import.meta.env.VITE_API_URL;
const httpCombosRepo = createHttpCombosRepository(import.meta.env.VITE_API_URL ?? "");
const mockCombosRepo = createInMemoryCombosRepository();

export const combosRepository: CombosRepository = isTestEnv
  ? mockCombosRepo
  : {
      async listForBranch(branchId, token) {
        try {
          return await httpCombosRepo.listForBranch(branchId, token);
        } catch (err) {
          if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
            return mockCombosRepo.listForBranch(branchId, token);
          }
          throw err;
        }
      },
      async createForBranch(branchId, token, input) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockCombosRepo.createForBranch(branchId, token, input);
        }
        return httpCombosRepo.createForBranch(branchId, token, input);
      },
      async updateForBranch(branchId, comboId, token, input) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockCombosRepo.updateForBranch(branchId, comboId, token, input);
        }
        return httpCombosRepo.updateForBranch(branchId, comboId, token, input);
      },
      async deleteForBranch(branchId, comboId, token) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockCombosRepo.deleteForBranch(branchId, comboId, token);
        }
        return httpCombosRepo.deleteForBranch(branchId, comboId, token);
      },
      async uploadComboImage(token, file) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockCombosRepo.uploadComboImage(token, file);
        }
        return httpCombosRepo.uploadComboImage(token, file);
      },
    };

export function resetMockCombosRepository(): void {
  mockCombosRepo.reset();
}
