import { useCallback, useEffect, useState, type ReactNode } from "react";
import { authRepository } from "../data/auth-repository";
import type { AuthUser, LoginDto } from "../types";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = "nutrigon:auth-token";
const USER_KEY = "nutrigon:auth-user";
const LAST_BRANCH_KEY = "nutrigon:last-branch";

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedBranchSlug, setSelectedBranchSlugState] = useState<string>(() => {
    try {
      return localStorage.getItem(LAST_BRANCH_KEY) || "centro";
    } catch {
      return "centro";
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate session from storage on mount
  useEffect(() => {
    try {
      const storedToken =
        localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      const storedUserJson =
        localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

      if (storedToken && storedUserJson) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserJson) as AuthUser);
      }
    } catch {
      // Storage access failed, keep unauthenticated
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSelectedBranchSlug = useCallback((slug: string) => {
    setSelectedBranchSlugState(slug);
    try {
      localStorage.setItem(LAST_BRANCH_KEY, slug);
    } catch {
      // Ignore
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginDto, rememberMe = true) => {
      setIsLoading(true);
      try {
        const response = await authRepository.login(credentials);
        setToken(response.accessToken);
        setUser(response.user);

        const storage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;

        // Clear any old session in alternative storage
        otherStorage.removeItem(TOKEN_KEY);
        otherStorage.removeItem(USER_KEY);

        storage.setItem(TOKEN_KEY, response.accessToken);
        storage.setItem(USER_KEY, JSON.stringify(response.user));
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {
      // Ignore
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    selectedBranchSlug,
    setSelectedBranchSlug,
    isLoading,
    isAuthenticated: user !== null && token !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
