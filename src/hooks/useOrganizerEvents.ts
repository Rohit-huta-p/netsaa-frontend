/**
 * useOrganizerEvents — hirer dashboard "Your posts" event source.
 *
 * Plan: `~/.gstack/projects/NETSA-React/ceo-plans/2026-05-16-your-posts-redesign.md`.
 *
 * Pulls events authored by the current organizer from
 * `GET /v1/organizers/me/events`. Mirrors the shape of `usePostedGigs` so the
 * merge hook (`useOrganizerPosts`) can consume both sources symmetrically.
 *
 * The events backend controller still reads organizerId from req.query
 * (TODO P3.2 in TODOS.md targets the req.user._id migration). To stay
 * forward-compatible the hook passes organizerId explicitly when the user
 * is authenticated — the param is harmless once the backend migrates.
 *
 * Returns React Query's full result so consumers can read isLoading, error,
 * refetch alongside data. Disabled when no userId — short-circuits without
 * a network call.
 */
import { useQuery } from '@tanstack/react-query';
import { eventService, type EventDoc } from '../services/eventService';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../stores/authStore';

type EventStatus = 'draft' | 'pending_review' | 'live' | 'cancelled' | 'completed';

export function useOrganizerEvents(filter?: EventStatus, limit = 5) {
  const userId = useAuthStore((s) => s.user?._id);

  return useQuery<EventDoc[]>({
    queryKey: queryKeys.hirer.events(filter),
    queryFn: () =>
      eventService.getOrganizerEvents({
        organizerId: userId as string,
        status: filter,
        limit,
      }),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export default useOrganizerEvents;
