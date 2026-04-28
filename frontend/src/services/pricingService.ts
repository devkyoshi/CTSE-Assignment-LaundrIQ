import api from "@/lib/api";
import type { ApiResponse, PriceCatalogue } from "@/types";

export const pricingService = {
  getAll: async (serviceType?: string): Promise<PriceCatalogue[]> => {
    const params = serviceType ? { serviceType } : {};
    const res = await api.get<ApiResponse<PriceCatalogue[]>>("/pricing", { params });
    return res.data.data;
  },
  getById: async (id: number): Promise<PriceCatalogue> => {
    const res = await api.get<ApiResponse<PriceCatalogue>>(`/pricing/${id}`);
    return res.data.data;
  },
  calculate: async (serviceType: string, itemType: string, quantity: number): Promise<number> => {
    const res = await api.get<ApiResponse<number>>("/pricing/calculate", {
      params: { serviceType, itemType, quantity },
    });
    return res.data.data;
  },
  create: async (entry: Omit<PriceCatalogue, "id" | "createdAt" | "updatedAt">): Promise<PriceCatalogue> => {
    const res = await api.post<ApiResponse<PriceCatalogue>>("/pricing", entry);
    return res.data.data;
  },
  update: async (id: number, entry: Partial<PriceCatalogue>): Promise<PriceCatalogue> => {
    const res = await api.put<ApiResponse<PriceCatalogue>>(`/pricing/${id}`, entry);
    return res.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pricing/${id}`);
  },
};
