// src/services/securityService.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

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

// Handle 401 — expired token → clear auth → redirect to login
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

/* ── Types ── */
export type Device = {
    _id: string;
    platform: 'ios' | 'android' | 'web';
    lastActive?: string;
    appVersion?: string;
};

/* ── API ── */
const securityService = {
    /** GET /api/users/me/sessions */
    getActiveSessions: async (): Promise<Device[]> => {
        const res = await API.get('/users/me/sessions');
        return res.data.data.devices;
    },

    /** POST /api/users/me/change-password */
    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await API.post('/users/me/change-password', { currentPassword, newPassword });
    },

    /** DELETE /api/users/me/sessions/:deviceId */
    logoutDevice: async (deviceId: string): Promise<Device[]> => {
        const res = await API.delete(`/users/me/sessions/${deviceId}`);
        return res.data.data.devices;
    },

    /** DELETE /api/users/me/sessions */
    logoutAllDevices: async (): Promise<void> => {
        await API.delete('/users/me/sessions');
    },

    /** POST /users/me/password-reset/send-otp — sends OTP to registered phone */
    sendPasswordResetOtp: async (): Promise<void> => {
        await API.post('/users/me/password-reset/send-otp');
    },

    /** POST /users/me/password-reset/verify — verifies OTP and sets new password */
    resetPasswordWithOtp: async (otp: string, newPassword: string): Promise<void> => {
        await API.post('/users/me/password-reset/verify', { otp, newPassword });
    },
};

export default securityService;
