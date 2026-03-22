// src/services/dangerService.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_URL || 'https://netsaa-backend.onrender.com';
};

const API = axios.create({ baseURL: getBaseUrl() });

API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
        }
        return Promise.reject(error);
    }
);

const dangerService = {
    /** POST /api/users/me/deactivate */
    deactivateAccount: async (password: string): Promise<void> => {
        await API.post('/users/me/deactivate', { password });
    },

    /** POST /api/users/me/delete */
    deleteAccount: async (confirmationText: string, reason?: string): Promise<void> => {
        await API.post('/users/me/delete', { confirmationText, reason });
    },

    /** POST /api/users/me/restore */
    restoreAccount: async (): Promise<void> => {
        await API.post('/users/me/restore');
    },
};

export default dangerService;
