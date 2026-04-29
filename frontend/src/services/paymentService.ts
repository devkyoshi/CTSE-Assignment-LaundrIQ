import api from "@/lib/api";
import type { Payment, CreatePaymentRequest, ConfirmPaymentRequest } from "@/types";

const unwrap = (res: any) => res.data?.data ?? res.data;

export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    const res = await api.get("/payments");
    return unwrap(res);
  },
  getById: async (id: number): Promise<Payment> => {
    const res = await api.get(`/payments/${id}`);
    return unwrap(res);
  },
  getByOrder: async (orderId: number): Promise<Payment> => {
    const res = await api.get(`/payments/order/${orderId}`);
    return unwrap(res);
  },
  getByCustomer: async (customerId: string): Promise<Payment[]> => {
    const res = await api.get(`/payments/customer/${customerId}`);
    return unwrap(res);
  },
  createPayment: async (request: CreatePaymentRequest): Promise<Payment> => {
    const res = await api.post("/payments", request);
    return unwrap(res);
  },
  confirmPayment: async (request: ConfirmPaymentRequest): Promise<Payment> => {
    const res = await api.post("/payments/confirm", request);
    return unwrap(res);
  },
  refundPayment: async (id: number): Promise<Payment> => {
    const res = await api.post(`/payments/${id}/refund`);
    return unwrap(res);
  },
};
