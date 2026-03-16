import api from "@/lib/api";
import type { Payment } from "@/types";

const unwrap = (res: any) => res.data?.data ?? res.data;

export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    const res = await api.get("/api/payments");
    return unwrap(res);
  },
  getById: async (id: number): Promise<Payment> => {
    const res = await api.get(`/api/payments/${id}`);
    return unwrap(res);
  },
  getByOrder: async (orderId: number): Promise<Payment> => {
    const res = await api.get(`/api/payments/order/${orderId}`);
    return unwrap(res);
  },
  create: async (payment: Omit<Payment, "id" | "createdAt">): Promise<Payment> => {
    const res = await api.post("/api/payments", payment);
    return unwrap(res);
  },
  update: async (id: number, payment: Partial<Payment>): Promise<Payment> => {
    const res = await api.put(`/api/payments/${id}`, payment);
    return unwrap(res);
  },
  updateStatus: async (id: number, status: string): Promise<Payment> => {
    const res = await api.patch(`/api/payments/${id}/status?status=${status}`);
    return unwrap(res);
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/payments/${id}`);
  },
};
