import type { AuthUser, LoginDto, LoginResponse } from "@nutrigon/contracts";
import { Role } from "@nutrigon/contracts";

export { Role };
export type { AuthUser, LoginDto, LoginResponse };

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  selectedBranchSlug: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginDto, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  setSelectedBranchSlug: (slug: string) => void;
}
