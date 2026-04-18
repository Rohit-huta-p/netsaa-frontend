import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_PAYMENT_URL || 'http://localhost:5005/v1';
};

const API = axios.create({ baseURL: getBaseUrl() });

API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Contracts ──

export type ContractPaymentMethod = 'on_platform' | 'off_platform';

export interface SignContractPayload {
    deviceInfo?: string;
    otpVerified?: boolean;
    /** ISO 8601 timestamp when the signer reached the bottom of the terms scroller. */
    scrollEndedAt?: string;
    /** ISO 8601 timestamp when the double-confirm tap happened. */
    doubleConfirmedAt?: string;
    /** Phase 2 biometric check timestamp. */
    biometricPassedAt?: string;
}

export const contractService = {
    create: async (data: {
        gigId: string;
        artistId: string;
        terms: any;
        paymentMethod?: ContractPaymentMethod;
    }) => {
        const res = await API.post('/contracts', data);
        return res.data;
    },
    get: async (id: string) => {
        const res = await API.get(`/contracts/${id}`);
        return res.data;
    },
    getUserContracts: async (params?: { status?: string; page?: number; pageSize?: number }) => {
        const res = await API.get('/users/me/contracts', { params });
        return res.data;
    },
    sign: async (id: string, data?: SignContractPayload) => {
        const res = await API.patch(`/contracts/${id}/sign`, data || {});
        return res.data;
    },
    decline: async (id: string) => {
        const res = await API.patch(`/contracts/${id}/decline`);
        return res.data;
    },
    switchPaymentMethod: async (id: string, paymentMethod: ContractPaymentMethod) => {
        const res = await API.patch(`/contracts/${id}/payment-method`, { paymentMethod });
        return res.data;
    },
    amend: async (id: string, data: { changes: Record<string, any>; reason: string }) => {
        const res = await API.post(`/contracts/${id}/amend`, data);
        return res.data;
    },
};

// ── Transactions ──

export const transactionService = {
    initiate: async (data: { contractId: string; paymentStructure?: 'full' | 'advance_30' | 'balance_70' }) => {
        const res = await API.post('/transactions/initiate', data);
        return res.data;
    },
    confirm: async (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => {
        const res = await API.post('/transactions/confirm', data);
        return res.data;
    },
    get: async (id: string) => {
        const res = await API.get(`/transactions/${id}`);
        return res.data;
    },
    getUserTransactions: async (params?: { type?: string; status?: string; page?: number; pageSize?: number }) => {
        const res = await API.get('/users/me/transactions', { params });
        return res.data;
    },
    recordOffline: async (data: { toUserId: string; amount: number; method: string; gigId?: string; referenceId?: string; note?: string }) => {
        const res = await API.post('/transactions/offline', data);
        return res.data;
    },
    confirmOffline: async (id: string) => {
        const res = await API.patch(`/transactions/${id}/confirm-offline`);
        return res.data;
    },
};

export default { contractService, transactionService };
