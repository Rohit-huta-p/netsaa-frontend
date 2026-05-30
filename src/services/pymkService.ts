import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const getDiscoverBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_SEARCH_URL || 'https://netsaa-search-service.onrender.com';
};

const DISCOVER_API = axios.create({
    baseURL: getDiscoverBaseUrl(),
});

DISCOVER_API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const pymkService = {
    /**
     * Fetch People You May Know list
     * GET /discover/pymk?page=...&pageSize=...
     */
    list: async (page = 1, pageSize = 10) => {
        const { data } = await DISCOVER_API.get('/discover/pymk', {
            params: { page, pageSize },
        });
        return data;
    },

    /**
     * Dismiss a PYMK suggestion for the current user
     * POST /pymk/dismiss { artistId }
     */
    dismiss: async (artistId: string) => {
        const { data } = await DISCOVER_API.post('/pymk/dismiss', { artistId });
        return data;
    },
};
