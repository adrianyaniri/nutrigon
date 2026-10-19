import type {
  BranchAdminItem,
  BranchesRepository,
  CreateBranchInput,
  UpdateBranchInput,
} from "../types";

const INITIAL_MOCK_BRANCHES: BranchAdminItem[] = [
  {
    id: "b-origone",
    name: "Origone",
    slug: "origone",
    address: "Tte. Manuel Origone 196, Villa Tesei",
    phone: "11-4450-1001",
    whatsappNumber: "5491144501001",
    openingHours: "Lun a Sáb 9:00 a 13:00 y 16:30 a 20:30",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b-pedrodiaz",
    name: "Pedro Díaz",
    slug: "pedro-diaz",
    address: "Av. Gral. Pedro Díaz 1265, Hurlingham",
    phone: "11-4450-1002",
    whatsappNumber: "5491144501002",
    openingHours: "Lun a Sáb 9:00 a 13:00 y 16:30 a 20:30",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "b-wmorris",
    name: "William Morris",
    slug: "w-morris",
    address: "Gdor. Vergara 4210, William C. Morris",
    phone: "11-4450-1003",
    whatsappNumber: "5491144501003",
    openingHours: "Lun a Sáb 9:00 a 13:00 y 16:30 a 20:30",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function createInMemoryBranchesRepository(
  initialBranches: BranchAdminItem[] = INITIAL_MOCK_BRANCHES
): BranchesRepository {
  const branches = [...initialBranches];

  return {
    async getBranches(_token?: string, includeInactive = true) {
      if (!includeInactive) {
        return branches.filter((b) => b.isActive);
      }
      return [...branches];
    },

    async createBranch(input: CreateBranchInput, _token: string) {
      const existing = branches.find((b) => b.slug.toLowerCase() === input.slug.toLowerCase());
      if (existing) {
        throw new Error(`Ya existe una sucursal con el slug "${input.slug}".`);
      }

      const newBranch: BranchAdminItem = {
        id: `b-${Date.now()}`,
        name: input.name,
        slug: input.slug,
        address: input.address ?? null,
        phone: input.phone ?? null,
        whatsappNumber: input.whatsappNumber ?? null,
        openingHours: input.openingHours ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      branches.push(newBranch);
      return newBranch;
    },

    async updateBranch(id: string, input: UpdateBranchInput, _token: string) {
      const idx = branches.findIndex((b) => b.id === id);
      if (idx === -1) {
        throw new Error(`Sucursal con id "${id}" no encontrada.`);
      }

      if (input.slug) {
        const existing = branches.find(
          (b) => b.slug.toLowerCase() === input.slug!.toLowerCase() && b.id !== id
        );
        if (existing) {
          throw new Error(`Ya existe otra sucursal con el slug "${input.slug}".`);
        }
      }

      const current = branches[idx]!;
      const updated: BranchAdminItem = {
        ...current,
        name: input.name ?? current.name,
        slug: input.slug ?? current.slug,
        address: input.address !== undefined ? input.address : current.address,
        phone: input.phone !== undefined ? input.phone : current.phone,
        whatsappNumber:
          input.whatsappNumber !== undefined ? input.whatsappNumber : current.whatsappNumber,
        openingHours:
          input.openingHours !== undefined ? input.openingHours : current.openingHours,
        isActive: input.isActive !== undefined ? input.isActive : current.isActive,
        updatedAt: new Date().toISOString(),
      };

      branches[idx] = updated;
      return updated;
    },

    async deleteBranch(id: string, _token: string) {
      const idx = branches.findIndex((b) => b.id === id);
      if (idx === -1) {
        throw new Error(`Sucursal con id "${id}" no encontrada.`);
      }

      const updated: BranchAdminItem = {
        ...branches[idx]!,
        isActive: false,
        updatedAt: new Date().toISOString(),
      };

      branches[idx] = updated;
      return updated;
    },
  };
}

export function createHttpBranchesRepository(baseUrl: string): BranchesRepository {
  return {
    async getBranches(token?: string, includeInactive = true) {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const url = `${baseUrl}/api/v1/branches${includeInactive ? "?includeInactive=true" : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Error al obtener sucursales (${res.status})`);
      }
      return res.json();
    },

    async createBranch(input: CreateBranchInput, token: string) {
      const res = await fetch(`${baseUrl}/api/v1/branches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Error al crear sucursal (${res.status})`);
      }

      return res.json();
    },

    async updateBranch(id: string, input: UpdateBranchInput, token: string) {
      const res = await fetch(`${baseUrl}/api/v1/branches/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Error al actualizar sucursal (${res.status})`);
      }

      return res.json();
    },

    async deleteBranch(id: string, token: string) {
      const res = await fetch(`${baseUrl}/api/v1/branches/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Error al desactivar sucursal (${res.status})`);
      }

      return res.json();
    },
  };
}

const isTestEnv = import.meta.env.MODE === "test" && !import.meta.env.VITE_API_URL;
const inMemoryRepo = createInMemoryBranchesRepository();
const httpRepo = createHttpBranchesRepository(import.meta.env.VITE_API_URL ?? "");

export const branchesRepository: BranchesRepository = isTestEnv
  ? inMemoryRepo
  : {
      async getBranches(token?: string, includeInactive?: boolean) {
        try {
          return await httpRepo.getBranches(token, includeInactive);
        } catch (err) {
          if (import.meta.env.DEV) {
            return inMemoryRepo.getBranches(token, includeInactive);
          }
          throw err;
        }
      },
      async createBranch(input: CreateBranchInput, token: string) {
        try {
          return await httpRepo.createBranch(input, token);
        } catch (err) {
          if (import.meta.env.DEV) {
            return inMemoryRepo.createBranch(input, token);
          }
          throw err;
        }
      },
      async updateBranch(id: string, input: UpdateBranchInput, token: string) {
        try {
          return await httpRepo.updateBranch(id, input, token);
        } catch (err) {
          if (import.meta.env.DEV) {
            return inMemoryRepo.updateBranch(id, input, token);
          }
          throw err;
        }
      },
      async deleteBranch(id: string, token: string) {
        try {
          return await httpRepo.deleteBranch(id, token);
        } catch (err) {
          if (import.meta.env.DEV) {
            return inMemoryRepo.deleteBranch(id, token);
          }
          throw err;
        }
      },
    };
