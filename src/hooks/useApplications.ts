/**
 * useApplications — React Query hook for the artist-home Applied section.
 *
 * SIGNATURE
 * ---------
 *   useApplications(filter?: string, limit?: number)
 *
 * filter is an optional backend status. Pass undefined or '' to mean "no
 * filter applied" — the hook forwards undefined to the service so the
 * backend returns every status. Valid filter values match the
 * GigApplication.status enum (applied, shortlisted, rejected, hired,
 * withdrawn). See src/constants/applicationStatus.ts for the UI chip set.
 *
 * RETURN SHAPE
 * ------------
 * Pass-through of useQuery. `data` is whatever the backend returns on
 * GET /v1/users/me/gig-applications — typically { data: Application[],
 * meta: {...} } but consumers should defensively read `data?.data ?? []`.
 *
 * KEY + STALE
 * -----------
 * queryKey: queryKeys.artist.applications(filter)
 *   — cached separately per filter so chips toggle instantly when
 *     data is warm.
 * staleTime: 30 seconds. Applications change often after a withdraw or
 *   a hirer decision; keep the window short so the UI stays fresh.
 *
 * INVALIDATION CONTRACT
 * ---------------------
 * Components that mutate applications (e.g., withdraw) MUST call
 *   queryClient.invalidateQueries({ queryKey: queryKeys.artist.applications() })
 * with no filter argument — that invalidates every cached filter so all
 * chip counts update together.
 *
 * ERROR SEMANTICS
 * ---------------
 * Network errors surface via `error`. SectionCard renders a retry state.
 */

import { useQuery } from '@tanstack/react-query';
import gigService from '../services/gigService';
import { queryKeys } from '../constants/queryKeys';

export function useApplications(filter?: string, limit?: number) {
  // Empty string from a chip "all" selection maps to "no filter".
  const status = filter && filter.length > 0 ? filter : undefined;

  return useQuery({
    queryKey: queryKeys.artist.applications(status),
    queryFn: () => gigService.getUserApplications({ status, limit }),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export default useApplications;
