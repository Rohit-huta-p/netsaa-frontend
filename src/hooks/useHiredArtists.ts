/**
 * useHiredArtists — hired applicants across the hirer's gigs, sorted by
 * gig startDate ascending (soonest first). Backed by the same
 * /organizers/me/applicants endpoint with status=hired.
 *
 * NOTE: the backend response currently denormalizes only `gigTitle`.
 * `gigStartDate` is NOT denormalized — this hook returns rows as-is and
 * lets the UI fall back on `appliedAt` when startDate is absent. Adding
 * startDate denormalization is a Plan 6 polish item (one extra Map lookup
 * in getOrganizerApplicants would suffice).
 */
import { useQuery } from '@tanstack/react-query';
import gigService from '../services/gigService';
import { queryKeys } from '../constants/queryKeys';

export function useHiredArtists(limit = 8) {
  return useQuery({
    queryKey: queryKeys.hirer.hiredArtists(),
    queryFn: () => gigService.getOrganizerApplicants({ status: 'hired', limit }),
    staleTime: 1000 * 60, // 1 minute
  });
}

export default useHiredArtists;
