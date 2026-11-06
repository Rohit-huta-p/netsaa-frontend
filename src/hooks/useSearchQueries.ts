import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchService } from '../services/searchService';

// Keys for React Query
export const SEARCH_KEYS = {
    all: ['search'] as const,
    preview: (query: string) => [...SEARCH_KEYS.all, 'preview', query] as const,
    people: (query: string, filters?: any) => [...SEARCH_KEYS.all, 'people', query, filters] as const,
    gigs: (query: string, filters?: any) => [...SEARCH_KEYS.all, 'gigs', query, filters] as const,
    events: (query: string, filters?: any) => [...SEARCH_KEYS.all, 'events', query, filters] as const,
};

/**
 * Hook for Search Preview (Global Search)
 */
export const useSearchPreview = (debouncedQuery: string) => {
    return useQuery({
        queryKey: SEARCH_KEYS.preview(debouncedQuery),
        queryFn: () => searchService.preview(debouncedQuery),
        enabled: debouncedQuery.length >= 2,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 1, // Cache for 1 min
    });
};

/**
 * Hook for Searching People.
 * `crafts` is the multi-select craft facet. Active when there are ≥2 query
 * chars OR at least one craft is selected (facet-only search).
 */
export const useSearchPeople = (debouncedQuery: string, crafts: string[] = []) => {
    return useQuery({
        queryKey: SEARCH_KEYS.people(debouncedQuery, crafts),
        queryFn: () => searchService.searchPeople(debouncedQuery, crafts),
        enabled: debouncedQuery.length >= 2 || crafts.length > 0,
        placeholderData: keepPreviousData,
    });
};

/**
 * Hook for Searching Gigs.
 */
export const useSearchGigs = (debouncedQuery: string, crafts: string[] = []) => {
    return useQuery({
        queryKey: SEARCH_KEYS.gigs(debouncedQuery, crafts),
        queryFn: () => searchService.searchGigs({ q: debouncedQuery, crafts }),
        enabled: debouncedQuery.length >= 2 || crafts.length > 0,
        placeholderData: keepPreviousData,
    });
};

/**
 * Hook for Searching Events.
 */
export const useSearchEvents = (debouncedQuery: string, crafts: string[] = []) => {
    return useQuery({
        queryKey: SEARCH_KEYS.events(debouncedQuery, crafts),
        queryFn: () => searchService.searchEvents({ q: debouncedQuery, crafts }),
        enabled: debouncedQuery.length >= 2 || crafts.length > 0,
        placeholderData: keepPreviousData,
    });
};
