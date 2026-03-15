"use client";

import {
  ApiError,
  type CurrentUser,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "@/lib/api-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: CurrentUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  refreshCurrentUser: () => Promise<void>;
  login: (input: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const LOGIN_MODE_KEY = "shortr.loginMode";
const SESSION_MARKER_KEY = "shortr.sessionMarker";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshCurrentUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(
    async (input: { email: string; password: string; rememberMe?: boolean }) => {
      const rememberMe = input.rememberMe ?? true;
      await loginRequest({ email: input.email, password: input.password });

      localStorage.setItem(LOGIN_MODE_KEY, rememberMe ? "remember" : "session");
      sessionStorage.setItem(SESSION_MARKER_KEY, "1");
      await refreshCurrentUser();
    },
    [refreshCurrentUser],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    localStorage.removeItem(LOGIN_MODE_KEY);
    sessionStorage.removeItem(SESSION_MARKER_KEY);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let isActive = true;

    void getCurrentUser()
      .then(async (currentUser) => {
        if (!isActive) return;

        const loginMode = localStorage.getItem(LOGIN_MODE_KEY);
        const hasSessionMarker =
          sessionStorage.getItem(SESSION_MARKER_KEY) === "1";

        // Legacy fallback: existing logins before this feature default to "remember".
        if (!loginMode) {
          localStorage.setItem(LOGIN_MODE_KEY, "remember");
          sessionStorage.setItem(SESSION_MARKER_KEY, "1");
        }

        if (loginMode === "session" && !hasSessionMarker) {
          await logoutRequest();
          if (!isActive) return;
          localStorage.removeItem(LOGIN_MODE_KEY);
          sessionStorage.removeItem(SESSION_MARKER_KEY);
          setUser(null);
          setStatus("unauthenticated");
          return;
        }

        if (loginMode === "remember" && !hasSessionMarker) {
          sessionStorage.setItem(SESSION_MARKER_KEY, "1");
        }

        setUser(currentUser);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!isActive) return;
        setUser(null);
        setStatus("unauthenticated");
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      refreshCurrentUser,
      login,
      logout,
    }),
    [user, status, refreshCurrentUser, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

