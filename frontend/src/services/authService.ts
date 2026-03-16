import api from "@/lib/api";
import type { ApiResponse, LoginData, AuthUser } from "@/types";

export const authService = {
  login: async (username: string, password: string) => {
    const res = await api.post<ApiResponse<LoginData>>("/api/auth/login", { username, password });
    return res.data;
  },
  register: async (username: string, email: string, password: string) => {
    const res = await api.post<ApiResponse<LoginData>>("/api/auth/register", { username, email, password });
    return res.data;
  },
  me: async () => {
    const res = await api.get<ApiResponse<AuthUser>>("/api/auth/me");
    return res.data;
  },
};
