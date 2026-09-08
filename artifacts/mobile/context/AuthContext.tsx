import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY_TOKEN = "@auth_token_v1";
const API_BASE = process.env.EXPO_PUBLIC_API_URL;

type AuthResult = { success: true } | { success: false; message: string };

type AuthContextType = {
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  authFetch: (path: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
        if (stored) setToken(stored);
      } catch (e) {
        console.error("Failed to load auth token:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const callAuthEndpoint = useCallback(
    async (endpoint: "register" | "login", email: string, password: string): Promise<AuthResult> => {
      if (!API_BASE) {
        return { success: false, message: "EXPO_PUBLIC_API_URL tanımlı değil." };
      }
      try {
        const response = await fetch(`${API_BASE}/api/auth/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const data = await response.json();
        if (!response.ok || !data?.token) {
          return {
            success: false,
            message: data?.error || data?.message || `İstek başarısız (${response.status}).`,
          };
        }
        await AsyncStorage.setItem(STORAGE_KEY_TOKEN, data.token);
        setToken(data.token);
        return { success: true };
      } catch (e) {
        return {
          success: false,
          message: e instanceof Error ? e.message : "Bilinmeyen bir hata oluştu.",
        };
      }
    },
    []
  );

  const register = useCallback(
    (email: string, password: string) => callAuthEndpoint("register", email, password),
    [callAuthEndpoint]
  );
  const login = useCallback(
    (email: string, password: string) => callAuthEndpoint("login", email, password),
    [callAuthEndpoint]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
    setToken(null);
  }, []);

  // Diğer ekranların (ileride add-item.tsx, closet/outfit taşıma adımlarında)
  // kullanabileceği ortak istek fonksiyonu — token varsa Authorization
  // header'ını otomatik ekler, yoksa sessizce eklemez (token gerektirmeyen
  // istekler için de kullanılabilir).
  const authFetch = useCallback(
    async (path: string, options: RequestInit = {}) => {
      if (!API_BASE) {
        throw new Error("EXPO_PUBLIC_API_URL tanımlı değil.");
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      return fetch(`${API_BASE}${path}`, { ...options, headers });
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{ token, loading, isAuthenticated: !!token, register, login, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
