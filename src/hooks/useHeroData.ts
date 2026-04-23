/**
 * useHeroData — React Query hook for the artist-home hero section.
 *
 * RETURN SHAPE
 * ------------
 * Pass-through of `useQuery` for the current user profile. Consumers read
 * `data` (User | undefined) for display (displayName, profileImageUrl,
 * trustTier, trustScore, rating, etc.), `isLoading` during the first
 * fetch, and `error` on failure.
 *
 * KEY + STALE
 * -----------
 * queryKey: queryKeys.artist.hero()
 * staleTime: 5 minutes — hero content is relatively stable (name, photo,
 *   trust tier). Other sections with more volatile data use shorter
 *   windows (e.g., useApplications at 30s).
 *
 * ENABLED
 * -------
 * Only fetches when a userId is available. Avoids 401 loops during boot
 * when authStore hasn't rehydrated yet.
 *
 * ERROR SEMANTICS
 * ---------------
 * Network errors surface via `error` so the section card can render its
 * retry UI. 401 responses bubble up to the global axios response
 * interceptor in authService which clears auth.
 *
 * NOTE ON authService
 * -------------------
 * The plan referenced `userService.getById` — that service doesn't exist
 * in this codebase. `authService.getUserById(id)` covers the same
 * endpoint (GET /users/:id) on the users-service.
 */

import { useQuery } from '@tanstack/react-query';
import authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { queryKeys } from '../constants/queryKeys';

export function useHeroData() {
  const userId = useAuthStore((s) => s.user?._id);

  return useQuery({
    queryKey: queryKeys.artist.hero(),
    queryFn: () => authService.getUserById(userId as string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export default useHeroData;
