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
 * Hook for Searching People
 */
export const useSearchPeople = (debouncedQuery: string, filters?: any) => {
    return useQuery({
        queryKey: SEARCH_KEYS.people(debouncedQuery, filters),
        queryFn: () => searchService.searchPeople(debouncedQuery, filters),
        enabled: debouncedQuery.length >= 2,
        placeholderData: keepPreviousData,
    });
};

/**
 * Hook for Searching Gigs
 */
export const useSearchGigs = (debouncedQuery: string, filters?: any) => {
    return useQuery({
        queryKey: SEARCH_KEYS.gigs(debouncedQuery, filters),
        queryFn: () => searchService.searchGigs(debouncedQuery, filters),
        enabled: debouncedQuery.length >= 2,
        placeholderData: keepPreviousData,
    });
};

/**
 * Hook for Searching Events
 */
export const useSearchEvents = (debouncedQuery: string, filters?: any) => {
    return useQuery({
        queryKey: SEARCH_KEYS.events(debouncedQuery, filters),
        queryFn: () => searchService.searchEvents(debouncedQuery, filters),
        enabled: debouncedQuery.length >= 2,
        placeholderData: keepPreviousData,
    });
};
