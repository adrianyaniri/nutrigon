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
  "admin.origone@nutrigon.com": {
    pass: "BranchAdmin2026!",
    user: {
      id: "u-branch-admin-origone",
      email: "admin.origone@nutrigon.com",
      fullName: "Encargado Sucursal Origone",
      role: Role.BRANCH_ADMIN,
      branchId: "b-origone",
    },
  },
  "admin.pedrodiaz@nutrigon.com": {
    pass: "BranchAdmin2026!",
    user: {
      id: "u-branch-admin-pedrodiaz",
      email: "admin.pedrodiaz@nutrigon.com",
      fullName: "Encargado Sucursal Pedro Díaz",
      role: Role.BRANCH_ADMIN,
      branchId: "b-pedrodiaz",
    },
  },
  "admin.wmorris@nutrigon.com": {
    pass: "BranchAdmin2026!",
    user: {
      id: "u-branch-admin-wmorris",
      email: "admin.wmorris@nutrigon.com",
      fullName: "Encargado Sucursal W. Morris",
      role: Role.BRANCH_ADMIN,
      branchId: "b-wmorris",
    },
  },
  "admin.centro@nutrigon.com": {
    pass: "BranchAdmin2026!",
    user: {
      id: "u-branch-admin-centro",
      email: "admin.centro@nutrigon.com",
      fullName: "Encargado Sucursal Centro",
      role: Role.BRANCH_ADMIN,
      branchId: "b-centro",
    },
  },
};

function mockLogin(credentials: LoginDto): LoginResponse {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const entry = MOCK_USERS[normalizedEmail];

  if (!entry || entry.pass !== credentials.password) {
    throw new Error("Credenciales inválidas. Verificá tu email y contraseña.");
  }

  return {
    accessToken: `mock-jwt-token-${entry.user.id}-${Date.now()}`,
    user: entry.user,
  };
}

function mockGetMe(token: string): AuthUser {
  const matched = Object.values(MOCK_USERS).find((entry) =>
    token.includes(entry.user.id)
  );
  if (matched) return matched.user;
  throw new Error("SESSION_INVALID");
}

export async function requestLogin(
  credentials: LoginDto,
  baseUrl: string,
  fetcher: typeof fetch = fetch
): Promise<LoginResponse> {
  const res = await fetcher(`${baseUrl}/api/v1/auth/login`, {
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
}

export async function requestCurrentUser(
  token: string,
  baseUrl: string,
  fetcher: typeof fetch = fetch
): Promise<AuthUser> {
  const res = await fetcher(`${baseUrl}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    return (await res.json()) as AuthUser;
  }
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }
  throw new Error("SESSION_INVALID");
}

export const authRepository: AuthRepository = {
  async login(credentials) {
    if (import.meta.env.MODE === "test") {
      return mockLogin(credentials);
    }
    return requestLogin(credentials, import.meta.env.VITE_API_URL || "");
  },

  async getMe(token) {
    if (import.meta.env.MODE === "test") {
      return mockGetMe(token);
    }
    return requestCurrentUser(token, import.meta.env.VITE_API_URL || "");
  },
};
