import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/services/eventService';

/**
 * Public "who's going" for an event — count + first names only (no PII).
 * Powers the E·9 detail page's "Who's going" line.
 *
 * Backend: GET /v1/events/:id/roster/public (no auth). Returns
 * { count, names: string[] } where names holds up to 12 public registrants.
 *
 * staleTime 60 s — the count moves slowly; no need to refetch on every render.
 */
export function usePublicRoster(eventId?: string) {
  return useQuery({
    queryKey: ['publicRoster', eventId],
    enabled: !!eventId,
    staleTime: 60_000,
    queryFn: () => eventService.getPublicRoster(eventId as string),
  });
}
