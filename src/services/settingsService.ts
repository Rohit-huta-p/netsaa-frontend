// src/services/settingsService.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { IUserSettings } from '../types';

const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_URL || 'https://netsaa-backend.onrender.com';
};

const API = axios.create({
    baseURL: getBaseUrl(),
});

// Attach token automatically
API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const { clearAuth } = useAuthStore.getState();
            clearAuth();
        }
        return Promise.reject(error);
    }
);

/**
 * Pure stateless API functions for settings.
 * State management is handled exclusively by React Query (useSettings hook).
 */
const settingsService = {
    /** GET /api/users/me/settings */
    getSettings: async (): Promise<IUserSettings> => {
        const res = await API.get('/api/users/me/settings');
        return res.data.data.settings;
    },

    /** PATCH /api/users/me/settings — partial update */
    updateSettings: async (data: Partial<{
        privacy: Partial<IUserSettings['privacy']>;
        notifications: Partial<IUserSettings['notifications']>;
        messaging: Partial<IUserSettings['messaging']>;
        account: Partial<IUserSettings['account']>;
    }>): Promise<IUserSettings> => {
        const res = await API.patch('/api/users/me/settings', data);
        return res.data.data.settings;
    },
};

export default settingsService;
