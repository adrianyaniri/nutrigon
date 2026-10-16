import { Role, type AuthUser, type LoginDto, type LoginResponse } from "../types";

export interface AuthRepository {
  login(credentials: LoginDto): Promise<LoginResponse>;
  getMe(token: string): Promise<AuthUser>;
}

const MOCK_USERS: Record<string, { pass: string; user: AuthUser }> = {
  "admin@nutrigon.com": {
    pass: "AdminNutrigon2026!",
    user: {
      id: "u-admin-general-001",
      email: "admin@nutrigon.com",
      fullName: "Administrador General",
      role: Role.ADMIN_GENERAL,
      branchId: null,
    },
  },
  "admin.centro@nutrigon.com": {
    pass: "BranchAdmin2026!",
    user: {
      id: "u-branch-admin-centro",
      email: "admin.centro@nutrigon.com",
      fullName: "Encargado Centro",
      role: Role.BRANCH_ADMIN,
      branchId: "b-centro",
    },
  },
  "admin.norte@nutrigon.com": {
    pass: "BranchAdmin2026!",
    user: {
      id: "u-branch-admin-norte",
      email: "admin.norte@nutrigon.com",
      fullName: "Encargado Norte",
      role: Role.BRANCH_ADMIN,
      branchId: "b-norte",
    },
  },
  "admin.sur@nutrigon.com": {
    pass: "BranchAdmin2026!",
    user: {
      id: "u-branch-admin-sur",
      email: "admin.sur@nutrigon.com",
      fullName: "Encargado Sur",
      role: Role.BRANCH_ADMIN,
      branchId: "b-sur",
    },
  },
};

export const authRepository: AuthRepository = {
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        if (res.ok) {
          return (await res.json()) as LoginResponse;
        }
        if (res.status === 401) {
          throw new Error("Credenciales inválidas. Verificá tu email y contraseña.");
        }
        const errorData = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errorData.message || "Error al iniciar sesión en el servidor.");
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes("Credenciales")) {
          throw err;
        }
        // If server is unreachable, fall back to mock database during development
      }
    }

    // Mock Authentication Logic
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const entry = MOCK_USERS[normalizedEmail];

    if (!entry || entry.pass !== credentials.password) {
      throw new Error("Credenciales inválidas. Verificá tu email y contraseña.");
    }

    return {
      accessToken: `mock-jwt-token-${entry.user.id}-${Date.now()}`,
      user: entry.user,
    };
  },

  async getMe(token: string): Promise<AuthUser> {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return (await res.json()) as AuthUser;
        }
      } catch {
        // Fall back to stored mock
      }
    }

    // Fall back to first matching user from token
    const matched = Object.values(MOCK_USERS).find((entry) =>
      token.includes(entry.user.id)
    );
    if (matched) return matched.user;

    return MOCK_USERS["admin@nutrigon.com"]!.user;
  },
};
