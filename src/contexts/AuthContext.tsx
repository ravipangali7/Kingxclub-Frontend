import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiPost, apiGet, getSessionWebSocketUrl } from "@/lib/api";
import { authGoogle, authGoogleComplete } from "@/api/auth";

export type UserRole = "powerhouse" | "super" | "master" | "player";

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  role_display?: string;
  main_balance?: string;
  bonus_balance?: string;
  pl_balance?: string;
  exposure_balance?: string;
  exposure_limit?: string;
  super_balance?: string | null;
  master_balance?: string | null;
  player_balance?: string | null;
  total_balance?: string | number;
  kyc_status?: string;
  parent?: number | null;
  whatsapp_number?: string;
  parent_whatsapp_number?: string | null;
  country_code?: string;
  currency_symbol?: string;
  last_login?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export type GoogleNeedsUsername = { needs_username: true; email: string; name: string };

interface AuthContextValue extends AuthState {
  login: (username: string, password: string, countryCode?: string) => Promise<User>;
  register: (data: { signup_token: string; phone: string; name: string; password: string; referral_code?: string; country_code?: string }) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<User | GoogleNeedsUsername>;
  googleComplete: (idToken: string, username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_KEY = "user";
const TOKEN_KEY = "token";

function loadStored(): { user: User | null; token: string | null } {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      return { token: t, user: JSON.parse(u) as User };
    }
  } catch {
    // ignore
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    ...loadStored(),
    loading: true,
  }));

  const refreshUser = useCallback(async () => {
    const { token } = loadStored();
    if (!token) {
      setState((s) => ({ ...s, user: null, token: null, loading: false }));
      return;
    }
    try {
      const res = await apiGet<User>("/public/auth/me/");
      const user = res as unknown as User;
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState((s) => ({ ...s, user, loading: false }));
      } else {
        setState((s) => ({ ...s, user: null, token: null, loading: false }));
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setState((s) => ({ ...s, user: null, token: null, loading: false }));
    }
  }, []);

  useEffect(() => {
    const { token, user } = loadStored();
    if (!token) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onLogout = () => {
      setState({ user: null, token: null, loading: false });
    };
    window.addEventListener("auth-logout", onLogout);
    return () => window.removeEventListener("auth-logout", onLogout);
  }, []);

  const login = useCallback(async (username: string, password: string, countryCode?: string): Promise<User> => {
    const body: { username: string; password: string; country_code?: string } = { username, password };
    if (countryCode) body.country_code = countryCode;
    const res = await apiPost<{ token: string; user: User }>("/public/auth/login/", body);
    const data = res as unknown as { token: string; user: User };
    if (!data.token || !data.user) throw new Error("Invalid response");
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, loading: false });
    return data.user;
  }, []);

  const register = useCallback(
    async (data: {
      signup_token: string;
      phone: string;
      name: string;
      password: string;
      referral_code?: string;
      country_code?: string;
    }) => {
      const res = await apiPost<{ token: string; user: User }>("/public/auth/register/", data);
      const out = res as unknown as { token: string; user: User };
      if (out.token && out.user) {
        localStorage.setItem(TOKEN_KEY, out.token);
        localStorage.setItem(USER_KEY, JSON.stringify(out.user));
        setState({ user: out.user, token: out.token, loading: false });
      }
    },
    []
  );

  const loginWithGoogle = useCallback(async (idToken: string): Promise<User | GoogleNeedsUsername> => {
    const res = await authGoogle(idToken);
    if ("needs_username" in res && res.needs_username) {
      return { needs_username: true, email: res.email, name: res.name };
    }
    const data = res as { token: string; user: User };
    if (!data.token || !data.user) throw new Error("Invalid response");
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, loading: false });
    return data.user;
  }, []);

  const googleComplete = useCallback(async (idToken: string, username: string, password: string): Promise<User> => {
    const res = await authGoogleComplete(idToken, username, password);
    if (!res.token || !res.user) throw new Error("Invalid response");
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setState({ user: res.user, token: res.token, loading: false });
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const tokenRef = useRef<string | null>(state.token);
  tokenRef.current = state.token;

  useEffect(() => {
    const token = state.token;
    if (!token) return;
    const url = getSessionWebSocketUrl();
    if (!url) return;
    const ws = new WebSocket(url);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string; current_token?: string };
        if (data?.type === "session.revoked" && data.current_token !== tokenRef.current) {
          logoutRef.current();
          ws.close();
        }
      } catch {
        // ignore parse errors
      }
    };
    return () => {
      ws.close();
    };
  }, [state.token]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    loginWithGoogle,
    googleComplete,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
