import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gigService from '../services/gigService';
import { Gig } from '../types/gig';
import { useRouter } from 'expo-router';

// Keys
export const gigKeys = {
    all: ['gigs'] as const,
    lists: () => [...gigKeys.all, 'list'] as const,
    list: (filters: any) => [...gigKeys.lists(), { ...filters }] as const,
    details: () => [...gigKeys.all, 'detail'] as const,
    detail: (id: string) => [...gigKeys.details(), id] as const,
    organizer: (organizerId: string) => [...gigKeys.all, 'organizer', organizerId] as const,
};

// Queries
export const useGigs = (params?: any) => {
    return useQuery({
        queryKey: gigKeys.list(params),
        queryFn: () => gigService.getAllGigs(params).then(res => res.data.gigs), // Assuming API returns { data: { gigs: [] } } or similar
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
