import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const getDiscoverBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_SEARCH_URL || 'https://netsaa-search-service.onrender.com';
};

const SIMILAR_API = axios.create({
    baseURL: getDiscoverBaseUrl(),
});

SIMILAR_API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const similarService = {
    /**
     * Fetch compact "similar artists" rail (used on profile cards, inline widgets)
     * GET /discover/similar/:artistId?limit=...
     */
    rail: async (artistId: string, limit = 6) => {
        const { data } = await SIMILAR_API.get(`/discover/similar/${artistId}`, {
            params: { limit },
        });
        return data;
    },

    /**
     * Fetch full paginated "similar artists" page
     * GET /discover/similar/:artistId?page=...&pageSize=...
     */
    page: async (artistId: string, page: number, pageSize = 20) => {
        const { data } = await SIMILAR_API.get(`/discover/similar/${artistId}`, {
            params: { page, pageSize },
        });
        return data;
    },
};
