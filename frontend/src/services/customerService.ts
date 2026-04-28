// services/customerService.ts

import api from "@/lib/api.ts";

export interface Profile {
    id: string;
    username: string;
    email: string;
    roles: string;
    active: boolean;
}

export interface Address {
    id: number;
    customerId: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
    isDefault: boolean;
    addressType: string;
}

export interface AddressRequest {
    customerId: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
    isDefault: boolean;
    addressType: string;
}

export interface Preferences {
    preferredLanguage: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    preferredPaymentMethod: string;
    preferredServiceType: string;
    isExpressPreferred: boolean;
    isDryCleanPreferred: boolean;
}

export const customerService = {
    // Profile
    getProfile: async (customerId: string): Promise<Profile> => {
        const response = await api.get(`/customers/${customerId}/profile`);
        return response.data.data;
    },

    // Addresses
    addAddress: async (address: AddressRequest): Promise<Address> => {
        const response = await api.post("/customers/addresses", address);
        return response.data.data;
    },

    getAddresses: async (customerId: string): Promise<Address[]> => {
        const response = await api.get(`/customers/${customerId}/addresses`);
        return response.data.data;
    },

    updateAddress: async (addressId: number, address: AddressRequest): Promise<Address> => {
        const response = await api.put(`/customers/addresses/${addressId}`, address);
        return response.data.data;
    },

    deleteAddress: async (addressId: number, customerId: string): Promise<void> => {
        await api.delete(`/customers/addresses/${addressId}?customerId=${customerId}`);
    },

    // Preferences
    setPreferences: async (customerId: string, preferences: Preferences): Promise<Preferences> => {
        const response = await api.put(`/customers/${customerId}/preferences`, preferences);
        return response.data.data;
    },

    getPreferences: async (customerId: string): Promise<Preferences> => {
        const response = await api.get(`/customers/${customerId}/preferences`);
        return response.data.data;
    }
};