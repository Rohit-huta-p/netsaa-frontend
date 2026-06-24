// src/hooks/useOrganizer.ts
// Wraps `GET /organizers/me` in React Query and surfaces whether the current
// client is an agency. The agency flag is server-authoritative (lives on the
// Organizer doc, not the JWT) — gigs-service reads it directly to gate the
// supplier "Find work" feed. The home uses `isAgency` to reveal the dual-home
// toggle ("My requirements" / "Find work").
import { useQuery } from '@tanstack/react-query';
import authService from '@/services/authService';

export function useOrganizer() {
    const q = useQuery({
        queryKey: ['organizer', 'me'],
        queryFn: () => authService.getOrganizer(),
        staleTime: 60_000,
    });
    return {
        organizer: q.data,
        isAgency: q.data?.organizerTypeCategory === 'agency',
        ...q,
    };
}
