import type {
  UsersRepository,
  UserItem,
  CreateUserDto,
  ChangePasswordDto,
} from "../types";
import { Role } from "@nutrigon/contracts";

const INITIAL_MOCK_USERS: UserItem[] = [
  {
    id: "u-admin-general-001",
    email: "admin@nutrigon.com",
    fullName: "Administrador General",
    role: Role.ADMIN_GENERAL,
    branchId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u-branch-admin-origone",
    email: "admin.origone@nutrigon.com",
    fullName: "Encargado Sucursal Origone",
    role: Role.BRANCH_ADMIN,
    branchId: "b-origone",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u-branch-admin-pedrodiaz",
    email: "admin.pedrodiaz@nutrigon.com",
    fullName: "Encargado Sucursal Pedro Díaz",
    role: Role.BRANCH_ADMIN,
    branchId: "b-pedrodiaz",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "u-branch-admin-wmorris",
    email: "admin.wmorris@nutrigon.com",
    fullName: "Encargado Sucursal W. Morris",
    role: Role.BRANCH_ADMIN,
    branchId: "b-wmorris",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function createInMemoryUsersRepository(
  seed: UserItem[] = INITIAL_MOCK_USERS
): UsersRepository & { reset: () => void } {
  let users = seed.map((u) => ({ ...u }));

  return {
    reset() {
      users = seed.map((u) => ({ ...u }));
    },

    async listByBranch(branchId: string) {
      return users.filter((u) => u.branchId === branchId);
    },

    async createUser(input: CreateUserDto) {
      const normalizedEmail = input.email.toLowerCase().trim();
      const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existing) {
        throw new Error("El correo electrónico ya está registrado.");
      }

      const newUser: UserItem = {
        id: `u-${Date.now()}`,
        email: normalizedEmail,
        fullName: input.fullName.trim(),
        role: input.role ?? Role.BRANCH_ADMIN,
        branchId: input.branchId ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(newUser);
      return newUser;
    },

    async resetPassword(userId: string, newPassword: string) {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        throw new Error("Usuario no encontrado.");
      }
      if (!newPassword || newPassword.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
      }
      user.updatedAt = new Date().toISOString();
      return { success: true, message: "Contraseña restablecida exitosamente." };
    },

    async changePassword(data: ChangePasswordDto) {
      if (!data.currentPassword) {
        throw new Error("La contraseña actual es requerida.");
      }
      if (!data.newPassword || data.newPassword.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
      }
      return { success: true, message: "Contraseña actualizada correctamente." };
    },
  };
}

export function createHttpUsersRepository(baseUrl: string): UsersRepository {
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  return {
    async listByBranch(branchId: string, token: string): Promise<UserItem[]> {
      const res = await fetch(`${normalizedBase}/api/v1/users?branchId=${encodeURIComponent(branchId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Error al obtener encargados de la sucursal.");
      }
      return res.json();
    },

    async createUser(input: CreateUserDto, token: string): Promise<UserItem> {
      const res = await fetch(`${normalizedBase}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let message = "Error al crear encargado.";
        if (typeof errData.message === "string") {
          message = errData.message;
        } else if (Array.isArray(errData.message) && errData.message.length > 0) {
          message = typeof errData.message[0] === "string" ? errData.message[0] : (errData.message[0]?.message ?? message);
        } else if (Array.isArray(errData.errors) && errData.errors.length > 0) {
          message = errData.errors[0]?.message ?? message;
        }
        throw new Error(message);
      }
      return res.json();
    },

    async resetPassword(
      userId: string,
      newPassword: string,
      token: string
    ): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${normalizedBase}/api/v1/users/${encodeURIComponent(userId)}/reset-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Error al restablecer la contraseña.");
      }
      return res.json();
    },

    async changePassword(
      data: ChangePasswordDto,
      token: string
    ): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${normalizedBase}/api/v1/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Error al cambiar la contraseña.");
      }
      return res.json();
    },
  };
}

const isTestEnv = import.meta.env.MODE === "test" || !import.meta.env.VITE_API_URL;
const httpUsersRepo = createHttpUsersRepository(import.meta.env.VITE_API_URL ?? "");
const mockUsersRepo = createInMemoryUsersRepository();

export const usersRepository: UsersRepository = isTestEnv
  ? mockUsersRepo
  : {
      async listByBranch(branchId, token) {
        try {
          return await httpUsersRepo.listByBranch(branchId, token);
        } catch (err) {
          if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
            return mockUsersRepo.listByBranch(branchId, token);
          }
          throw err;
        }
      },

      async createUser(input, token) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockUsersRepo.createUser(input, token);
        }
        return httpUsersRepo.createUser(input, token);
      },

      async resetPassword(userId, newPassword, token) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockUsersRepo.resetPassword(userId, newPassword, token);
        }
        return httpUsersRepo.resetPassword(userId, newPassword, token);
      },

      async changePassword(data, token) {
        if (import.meta.env.DEV && token.startsWith("mock-jwt-token")) {
          return mockUsersRepo.changePassword(data, token);
        }
        return httpUsersRepo.changePassword(data, token);
      },
    };

export function resetMockUsersRepository(): void {
  mockUsersRepo.reset();
}
