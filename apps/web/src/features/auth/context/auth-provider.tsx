import { useCallback, useEffect, useState, type ReactNode } from "react";
import { authRepository } from "../data/auth-repository";
import { Role, type AuthUser, type LoginDto } from "../types";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = "nutrigon:auth-token";
const USER_KEY = "nutrigon:auth-user";
const LAST_BRANCH_KEY = "nutrigon:last-branch";

const BRANCH_ID_TO_SLUG: Record<string, string> = {
  "b-origone": "origone",
  "b-pedrodiaz": "pedro-diaz",
  "b-wmorris": "w-morris",
  "b-centro": "origone",
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedBranchSlug, setSelectedBranchSlugState] = useState<string>(() => {
    try {
      return localStorage.getItem(LAST_BRANCH_KEY) || "origone";
    } catch {
      return "origone";
    }
  });
  const [isLoading, setIsLoading] = useState(true);

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

  // Rehydrate session from storage on mount and verify with backend
  useEffect(() => {
    let isMounted = true;

    async function rehydrateSession() {
      try {
        const storedToken =
          localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        const storedUserJson =
          localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

        if (!storedToken || !storedUserJson) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const parsedUser = JSON.parse(storedUserJson) as AuthUser;
        if (isMounted) {
          setToken(storedToken);
          setUser(parsedUser);

          if (parsedUser.role === Role.BRANCH_ADMIN && parsedUser.branchId) {
            const branchSlug = BRANCH_ID_TO_SLUG[parsedUser.branchId];
            if (branchSlug) {
              setSelectedBranchSlugState(branchSlug);
            }
          }
        }

        // Verify session integrity with the backend
        try {
          const freshUser = await authRepository.getMe(storedToken);
          if (isMounted) {
            setUser(freshUser);
            const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
            storage.setItem(USER_KEY, JSON.stringify(freshUser));
          }
        } catch {
          // Token is rejected (e.g. database wiped / user deleted / 401)
          if (isMounted) {
            logout();
          }
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void rehydrateSession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const setSelectedBranchSlug = useCallback((slug: string) => {
    setSelectedBranchSlugState(slug);
    try {
      localStorage.setItem(LAST_BRANCH_KEY, slug);
    } catch {
      // Ignore
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginDto, rememberMe = true): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const response = await authRepository.login(credentials);
        setToken(response.accessToken);
        setUser(response.user);

        if (response.user.role === Role.BRANCH_ADMIN && response.user.branchId) {
          const branchSlug = BRANCH_ID_TO_SLUG[response.user.branchId];
          if (branchSlug) {
            setSelectedBranchSlugState(branchSlug);
            try {
              localStorage.setItem(LAST_BRANCH_KEY, branchSlug);
            } catch {
              // Ignore
            }
          }
        }

        const storage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;

        // Clear any old session in alternative storage
        otherStorage.removeItem(TOKEN_KEY);
        otherStorage.removeItem(USER_KEY);

        storage.setItem(TOKEN_KEY, response.accessToken);
        storage.setItem(USER_KEY, JSON.stringify(response.user));

        return response.user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
