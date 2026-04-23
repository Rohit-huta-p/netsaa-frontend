/**
 * useApplicantsInbox — hirer-side Applicants Inbox data hook (Plan 3, Task 14).
 *
 * Returns up to `limit` applicants flat across all the current user's gigs,
 * filtered by the inbox status (`applied` | `shortlisted` | `hired`). Backed
 * by `GET /organizers/me/applicants`.
 *
 * `queryKey: queryKeys.hirer.applicants(filter)` — prefix-match invalidation:
 * calling `invalidateQueries({ queryKey: queryKeys.hirer.applicants() })` bulk
 * invalidates every filter variant.
 */
import { useQuery } from '@tanstack/react-query';
import gigService from '../services/gigService';
import { queryKeys } from '../constants/queryKeys';

export function useApplicantsInbox(
  filter?: 'applied' | 'shortlisted' | 'hired',
  limit = 5
) {
  const status = filter && filter.length > 0 ? filter : undefined;
  return useQuery({
    queryKey: queryKeys.hirer.applicants(status),
    queryFn: () => gigService.getOrganizerApplicants({ status, limit }),
    staleTime: 1000 * 30,
  });
}

export default useApplicantsInbox;
