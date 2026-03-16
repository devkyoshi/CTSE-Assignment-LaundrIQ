import api from "@/lib/api";
import type { Order } from "@/types";

// Order endpoints may or may not use ApiResponse envelope
const unwrap = (res: any) => res.data?.data ?? res.data;

export const orderService = {
  getAll: async (): Promise<Order[]> => {
    const res = await api.get("/api/orders");
    return unwrap(res);
  },
  getById: async (id: number): Promise<Order> => {
    const res = await api.get(`/api/orders/${id}`);
    return unwrap(res);
  },
  getByCustomer: async (customerId: string): Promise<Order[]> => {
    const res = await api.get(`/api/orders/customer/${customerId}`);
    return unwrap(res);
  },
  create: async (order: Omit<Order, "id" | "createdAt">): Promise<Order> => {
    const res = await api.post("/api/orders", order);
    return unwrap(res);
  },
  update: async (id: number, order: Partial<Order>): Promise<Order> => {
    const res = await api.put(`/api/orders/${id}`, order);
    return unwrap(res);
  },
  updateStatus: async (id: number, status: string): Promise<Order> => {
    const res = await api.patch(`/api/orders/${id}/status?status=${status}`);
    return unwrap(res);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/orders/${id}`);
  },
};
