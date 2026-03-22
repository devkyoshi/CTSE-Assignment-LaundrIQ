import api from "@/lib/api";
import type { ApiResponse, LoginData, AuthUser } from "@/types";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  roles: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

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
  getProfile: async () => {
    const res = await api.get<ApiResponse<UserProfile>>("/api/auth/me");
    return res.data;
  },
  updateProfile: async (profileData: ProfileUpdateRequest) => {
    const res = await api.put<ApiResponse<UserProfile>>("/api/auth/me", profileData);
    return res.data;
  },
  deleteAccount: async (password: string) => {
    const res = await api.delete<ApiResponse<null>>("/api/auth/me", {
      params: { password }
    });
    return res.data;
  },
};