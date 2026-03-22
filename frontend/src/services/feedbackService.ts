// services/feedbackService.ts

import api from "@/lib/api.ts";

export interface FeedbackRequest {
    customerId: string;
    orderId: string;
    rating: number;
    category: string;
    comment: string;
    isPublic: boolean;
}

export interface FeedbackUpdateRequest {
    rating?: number;
    category?: string;
    comment?: string;
    isPublic?: boolean;
}

export interface Feedback {
    id: number;
    customerId: string;
    orderId: string;
    rating: number;
    category: string;
    comment: string;
    isPublic: boolean;
    status: string;
    staffResponse?: string;
    respondedAt?: string;
    createdAt: string;
}

export interface FeedbackSummary {
    id: number;
    orderId: string;
    rating: number;
    category: string;
    commentSnippet: string;
    status: string;
    createdAt: string;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export const feedbackService = {
    submitFeedback: async (customerId: string, data: FeedbackRequest): Promise<Feedback> => {
        const requestData: FeedbackRequest = {
            ...data,
            customerId: customerId
        };
        const response = await api.post(`/api/customers/${customerId}/feedback`, requestData);        return response.data.data;
    },

    getFeedbackHistory: async (customerId: string, page: number = 0, size: number = 10): Promise<PageResponse<FeedbackSummary>> => {
        const response = await api.get(`/api/customers/${customerId}/feedback`, {
            params: { page, size }
        });
        return response.data.data;
    },

    getFeedback: async (customerId: string, feedbackId: number): Promise<Feedback> => {
        const response = await api.get(`/api/customers/${customerId}/feedback/${feedbackId}`);
        return response.data.data;
    },

    updateFeedback: async (customerId: string, feedbackId: number, data: FeedbackUpdateRequest): Promise<Feedback> => {
        const response = await api.patch(`/api/customers/${customerId}/feedback/${feedbackId}`, data);
        return response.data.data;
    },

    deleteFeedback: async (customerId: string, feedbackId: number): Promise<void> => {
        await api.delete(`/api/customers/${customerId}/feedback/${feedbackId}`);
    },

    getAverageRating: async (customerId: string): Promise<number> => {
        const response = await api.get(`/api/customers/${customerId}/feedback/average-rating`);
        return response.data.data.averageRating;
    }
};