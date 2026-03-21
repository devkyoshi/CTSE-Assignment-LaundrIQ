import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthUser, LoginData } from "@/types";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem("token"));

  const fetchUser = useCallback(async () => {
    try {
      const res = await authService.me();
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      if (!user) fetchUser(); // Only fetch if we don't have user in localstorage (or maybe we always want fresh data, but to avoid flash, just set loading false if we have it)
      else setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [token, fetchUser, user]);

  const login = (data: LoginData) => {
    localStorage.setItem("token", data.token);
    setToken(data.token);
    
    const newUser: AuthUser = {
      id: data.userId,
      username: data.username,
      email: data.email,
      roles: data.roles,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
