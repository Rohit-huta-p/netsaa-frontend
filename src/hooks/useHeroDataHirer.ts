/**
 * useHeroDataHirer — data source for HeroGreetingHirer + TrustTierProgress
 * (hirer-home) + any future card that needs "who am I as a hirer" data.
 *
 * Merges two queries:
 *   1. The authenticated user (same query artist-home uses via useHeroData —
 *      `queryKeys.artist.hero()`). We share that cache key so the user profile
 *      does not refetch when the mode toggle flips. Fetched via
 *      `authService.getUserById` — this codebase has no userService; Plan 2
 *      flagged that in a note on useHeroData.
 *   2. The organizer profile (`GET /api/organizers/me`) — key
 *      `queryKeys.hirer.hero()`. Provides verification level + stats.
 *
 * Consumers read `{ user, organizer, isLoading, error }`. When either query
 * is loading, `isLoading` stays true so HeroGreetingHirer renders its
 * skeleton chrome. Errors surface the first non-null error.
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../stores/authStore';
import authService from '../services/authService';

export function useHeroDataHirer() {
  const userId = useAuthStore((s) => s.user?._id);

  const userQuery = useQuery({
    queryKey: queryKeys.artist.hero(),
    queryFn: () => authService.getUserById(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const organizerQuery = useQuery({
    queryKey: queryKeys.hirer.hero(),
    queryFn: () => authService.getOrganizer(),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: userQuery.data,
    organizer: organizerQuery.data,
    isLoading: userQuery.isLoading || organizerQuery.isLoading,
    error: (userQuery.error ?? organizerQuery.error) as Error | null,
  };
}

export default useHeroDataHirer;
