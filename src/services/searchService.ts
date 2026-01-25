import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Use env var or production fallback
const getSearchBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_SEARCH_URL || 'https://netsaa-search-service.onrender.com';
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
     * Search Gigs with filters in request body
     * POST /search/gigs
     */
    searchGigs: async (request: {
        q?: string;
        filters?: any;
        page?: number;
        pageSize?: number;
    }) => {
        const { data } = await SEARCH_API.post('/search/gigs', request);

        // Map search results to match Gig interface expected by UI
        if (data && data.results) {
            data.results = data.results.map((item: any) => ({
                _id: item.id, // Critical: Map id to _id for navigation
                title: item.title,
                compensation: item.metadata?.compensation,
                location: {
                    city: item.subtitle?.split('•')[0]?.trim()
                },
                artistTypes: [item.subtitle?.split('•')[1]?.trim() || 'Artist'],
                schedule: {
                    startDate: item.metadata?.date,
                    // Safe defaults for GigCard
                    practiceDays: { count: 0, isPaid: false },
                    durationLabel: 'N/A'
                },
                applicationDeadline: item.metadata?.expiresAt,
                createdAt: new Date().toISOString(), // Fallback
                experienceLevel: 'Professional', // Fallback
                isFeatured: (item.score || 0) > 3,
                organizerSnapshot: {
                    displayName: 'Organizer',
                    rating: 5,
                    profileImageUrl: item.image
                }
            }));
        }

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
