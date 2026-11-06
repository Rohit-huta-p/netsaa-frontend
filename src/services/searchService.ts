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
     * Typeahead results for the new search-v2 surface.
     * Returns intent-classified, vertically-ordered preview results.
     * Endpoint: GET /search/preview?q=...&mode=typeahead
     */
    typeahead: async (query: string) => {
        const { data } = await SEARCH_API.get('/search/preview', {
            params: { q: query, mode: 'typeahead' },
        });
        return data;
    },

    /**
     * Get preview results for the global search bar
     */
    preview: async (query: string) => {
        const { data } = await SEARCH_API.get('/search/preview', {
            params: { q: query },
        });
        console.log("search query data:", data)
        return data;
    },

    /**
     * Search People.
     * `crafts` is the multi-select craft facet → sent as repeated `artistTypes`
     * query params (artistTypes=Dancer&artistTypes=Actor), which the backend
     * reads as an array and matches (case-insensitive OR) against `artistType`.
     */
    searchPeople: async (query: string, crafts?: string[]) => {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        (crafts ?? []).forEach((c) => params.append('artistTypes', c));
        const { data } = await SEARCH_API.get('/search/people', { params });
        return data;
    },

    /**
     * Search Gigs. POST /search/gigs with the craft facet as `filters.artistTypes`.
     */
    searchGigs: async (request: {
        q?: string;
        crafts?: string[];
        page?: number;
        pageSize?: number;
    }) => {
        const { q, crafts, page, pageSize } = request;
        const filters: Record<string, any> = {};
        if (crafts && crafts.length) filters.artistTypes = crafts;

        const { data } = await SEARCH_API.post('/search/gigs', { q, filters, page, pageSize });

        // The backend returns the full gig document under `item.raw`; use it
        // verbatim. No client-side fabrication — we never invent a rating,
        // experience level or organizer name (pay-as-fact / no-fake-data).
        if (data && Array.isArray(data.results)) {
            data.results = data.results.map((item: any) => item?.raw ?? item);
        }
        return data;
    },

    /**
     * Search Events. POST /search/events with the craft facet as
     * `filters.eligibleArtistTypes`.
     */
    searchEvents: async ({ q, crafts, page, pageSize }: {
        q?: string;
        crafts?: string[];
        page?: number;
        pageSize?: number;
    }) => {
        const filters: Record<string, any> = {};
        if (crafts && crafts.length) filters.eligibleArtistTypes = crafts;

        const { data } = await SEARCH_API.post('/search/events', { q, filters, page, pageSize });
        return data;
    },
};
