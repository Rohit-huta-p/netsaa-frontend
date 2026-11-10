import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { buildQueryParamsFromFilters } from '../lib/constants/filters';
import { FilterState } from '../types/filters';

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
     * Search Gigs. POST /search/gigs.
     *
     * Two caller shapes are supported and merged:
     *  - `filters` (a FilterState, from the gig board) → converted to the flat
     *    GigSearchFilters DTO the search-service expects via
     *    buildQueryParamsFromFilters: artistTypes[], experienceLevel[], `city`
     *    (comma-joined multi-city from location.cities[]), remoteOnly,
     *    minCompensation, sortMode, …
     *  - `crafts` (a craft facet, from global search) → unioned into artistTypes.
     *
     * Previously this only read `crafts` and dropped the FilterState entirely,
     * so every advanced gig facet (city/pay/experience/artist/sort) was inert
     * end-to-end. Forwarding the whole FilterState reconnects the pipeline.
     */
    searchGigs: async (request: {
        q?: string;
        crafts?: string[];
        filters?: FilterState;
        page?: number;
        pageSize?: number;
    }) => {
        const { q, crafts, filters, page, pageSize } = request;

        // Flat GigSearchFilters DTO from the nested FilterState (handles the
        // multi-city location.cities[] → `city` CSV mapping, among others).
        const payload: Record<string, any> = filters ? buildQueryParamsFromFilters(filters) : {};

        // Merge the craft facet from either channel so neither is dropped.
        if (crafts && crafts.length) {
            const existing: string[] = Array.isArray(payload.artistTypes) ? payload.artistTypes : [];
            payload.artistTypes = Array.from(new Set([...existing, ...crafts]));
        }

        const { data } = await SEARCH_API.post('/search/gigs', { q, filters: payload, page, pageSize });

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
