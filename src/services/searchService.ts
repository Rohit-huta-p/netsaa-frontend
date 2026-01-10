import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/authStore';

// Assuming Search Service runs on port 3000 based on walkthrough
const getSearchBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_SEARCH_URL) return process.env.EXPO_PUBLIC_API_SEARCH_URL;
    // if (Platform.OS === 'web') return 'http://localhost:5003';
    // Use the same LAN IP as authService for consistency
    return 'https://netsaa-search-service.onrender.com';
};

const SEARCH_API = axios.create({
    baseURL: getSearchBaseUrl(),
});

// Request Interceptor: Attach Token (Search might be public, but helpful for context/enrichment)
SEARCH_API.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const searchService = {
    /**
     * Get preview results for the global search bar
     */
    preview: async (query: string) => {
        const { data } = await SEARCH_API.get('/search/preview', {
            params: { q: query },
        });
        return data;
    },

    /**
     * Search People
     */
    searchPeople: async (query: string, filters?: Record<string, any>) => {
        const { data } = await SEARCH_API.get('/search/people', {
            params: { q: query, ...filters },
        });
        return data;
    },

    /**
     * Search Gigs
     */
    searchGigs: async (query: string, filters?: Record<string, any>) => {
        const { data } = await SEARCH_API.get('/search/gigs', {
            params: { q: query, ...filters },
        });
        return data;
    },

    /**
     * Search Events
     */
    searchEvents: async (query: string, filters?: Record<string, any>) => {
        const { data } = await SEARCH_API.get('/search/events', {
            params: { q: query, ...filters },
        });
        return data;
    },
};
