// services/loyaltyService.ts

import api from "@/lib/api.ts";

export interface LoyaltyAccount {
    id: number;
    customerId: string;
    totalPoints: number;
    lifetimePoints: number;
    tier: string;
    tierMultiplier: number;
    pointsToNextTier: number;
    updatedAt: string;
}

export interface LoyaltyTransaction {
    id: number;
    points: number;
    type: "EARNED" | "REDEEMED";
    description: string;
    referenceId: string;
    balanceAfter: number;
    createdAt: string;
}

export interface EarnPointsRequest {
    points: number;
    description: string;
    referenceId: string;
    customerId?: string;
}

export interface RedeemPointsRequest {
    points: number;
    description: string;
    referenceId: string;
    customerId?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export const loyaltyService = {
    getAccount: async (customerId: string): Promise<LoyaltyAccount> => {
        const response = await api.get(`/api/customers/${customerId}/loyalty`);
        return response.data.data;
    },

    createAccount: async (customerId: string): Promise<LoyaltyAccount> => {
        const response = await api.post(`/api/customers/${customerId}/loyalty/init`);
        return response.data.data;
    },

    getTransactions: async (customerId: string, page: number = 0, size: number = 10): Promise<PageResponse<LoyaltyTransaction>> => {
        const response = await api.get(`/api/customers/${customerId}/loyalty/transactions`, {
            params: { page, size }
        });
        return response.data.data;
    },

    earnPoints: async (customerId: string, data: Omit<EarnPointsRequest, 'customerId'>): Promise<LoyaltyAccount> => {
        const response = await api.post(`/api/customers/${customerId}/loyalty/earn`, data);
        return response.data.data;
    },

    redeemPoints: async (customerId: string, data: Omit<RedeemPointsRequest, 'customerId'>): Promise<LoyaltyAccount> => {
        const response = await api.post(`/api/customers/${customerId}/loyalty/redeem`, data);
        return response.data.data;
    }
};