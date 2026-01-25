import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gigService from '../services/gigService';
import { searchService } from '../services/searchService';
import { Gig } from '../types/gig';
import { useRouter } from 'expo-router';
import { FilterState } from '../types/filters';
import { countActiveFilters } from '../lib/constants/filters';

/**
 * Gig search request interface
 */
export interface GigSearchRequest {
    q?: string;
    filters?: FilterState;
    page?: number;
    pageSize?: number;
}

// Keys
export const gigKeys = {
    all: ['gigs'] as const,
    lists: () => [...gigKeys.all, 'list'] as const,
    list: (page?: number, pageSize?: number) => [...gigKeys.lists(), { page, pageSize }] as const,
    search: (q?: string, filters?: FilterState, page?: number) => ['search:gigs', q, filters, page] as const,
    details: () => [...gigKeys.all, 'detail'] as const,
    detail: (id: string) => [...gigKeys.details(), id] as const,
    organizer: (organizerId: string) => [...gigKeys.all, 'organizer', organizerId] as const,
};

/**
 * Determines if we should use search-service based on request.
 * Use search-service only when:
 * - Query is provided, OR
 * - Filters are active
 */
const shouldUseSearchService = (request?: GigSearchRequest): boolean => {
    if (!request) return false;

    // Use search service if query is provided
    const hasQuery = !!(request.q && request.q.trim().length > 0);

    // Use search service if any filters are active
    const hasFilters = !!(request.filters && countActiveFilters(request.filters) > 0);

    return hasQuery || hasFilters;
};

/**
 * Hook for fetching gigs.
 *
 * - On mount (no query, no filters): Uses gigs-service GET /gigs
 * - With query OR filters: Uses search-service POST /search/gigs
 *
 * @param request - Search request with q, filters, page, pageSize
 */
export const useGigs = (request?: GigSearchRequest) => {
    const { q = '', filters, page = 1, pageSize = 20 } = request || {};
    const useSearch = shouldUseSearchService(request);

    return useQuery({
        // Different queryKey based on which service we're using
        queryKey: useSearch
            ? gigKeys.search(q, filters, page)
            : gigKeys.list(page, pageSize),
        queryFn: async () => {
            if (useSearch) {
                // Use search-service for filtered/searched results
                const response = await searchService.searchGigs({
                    q,
                    filters,
                    page,
                    pageSize,
                });
                return response.results || [];
            } else {
                // Use gigs-service for unfiltered list (on mount)
                const res = await gigService.getAllGigs({ page, pageSize });
                return res.data.gigs;
            }
        },
        // Keep previous data while fetching new results
        placeholderData: (previousData) => previousData,
    });
};

export const useOrganizerGigs = (organizerId: string) => {
    return useQuery({
        queryKey: gigKeys.organizer(organizerId),
        queryFn: () => gigService.getOrganizerGigs(organizerId).then(res => res.data.gigs), // Normalized response
        enabled: !!organizerId,
    });
};

export const useGig = (id: string) => {
    return useQuery({
        queryKey: gigKeys.detail(id),
        queryFn: () => gigService.getGigById(id).then(res => res.data),
        enabled: !!id,
    });
};

// Mutations
export const useCreateGig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Gig>) => gigService.createGig(data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gigKeys.lists() });
        },
    });
};

export const useApplyToGig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; payload: { coverNote: string; portfolioLinks?: string[] } }) =>
            gigService.applyToGig(variables.id, variables.payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: gigKeys.detail(variables.id) });
        },
    });
};

export const useUpdateGig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables: { id: string; payload: Partial<Gig> }) =>
            gigService.updateGig(variables.id, variables.payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: gigKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: gigKeys.lists() });
        },
    });
};

export const useDeleteGig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => gigService.deleteGig(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gigKeys.lists() });
        },
    });
};
