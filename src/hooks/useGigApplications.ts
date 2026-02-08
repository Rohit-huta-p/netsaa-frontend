import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gigService from '../services/gigService';

export const useGigApplications = (gigId: string) => {
    return useQuery({
        queryKey: ['gigApplications', gigId],
        queryFn: () => gigService.getGigApplications(gigId),
        enabled: !!gigId,
    });
};

export const useUpdateApplicationStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ applicationId, status }: { applicationId: string; status: string }) =>
            gigService.updateApplicationStatus(applicationId, status),
        onSuccess: (_, variables) => {
            // Invalidate all gig application queries or specific ones
            queryClient.invalidateQueries({ queryKey: ['gigApplications'] });
        },
    });
};

export const useApplyToGig = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gigId, payload }: { gigId: string; payload: { coverNote: string; portfolioLinks?: string[] } }) =>
            gigService.applyToGig(gigId, payload),
        onSuccess: (_, variables) => {
            // Invalidate queries to refresh data if needed (e.g., if we show "Applied" status on gig details)
            // Fix: Must match useGigs keys -> ['gigs', 'detail', id]
            queryClient.invalidateQueries({ queryKey: ['gigs', 'detail', variables.gigId] });
            queryClient.invalidateQueries({ queryKey: ['gigApplications', variables.gigId] });
        },
    });
};

// Hook to get a specific application for profile context card
export const useApplicationContext = (gigId: string, applicationId: string) => {
    return useQuery({
        queryKey: ['applicationContext', gigId, applicationId],
        queryFn: async () => {
            // Fetch all applications for the gig and find the specific one
            const applications = await gigService.getGigApplications(gigId);
            return applications?.find((app: any) => app._id === applicationId) || null;
        },
        enabled: !!gigId && !!applicationId,
    });
};
