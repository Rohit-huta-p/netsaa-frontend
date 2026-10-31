/**
 * useOrganizerGigsPublic — PUBLIC list of a Creative Lead / organizer's open
 * roles ("Now hiring" on the company profile). Public read:
 * GET /v1/organizers/:organizerId/gigs (published-only, NOT role-walled, no auth
 * required) — the same page is shown to every viewer (artist, client, CL, guest).
 *
 * Disabled until an organizerId is known; short-circuits without a network call.
 * Cold-start / error safe: callers get { gigs: [], total: 0 } and hide the section.
 */
import { useQuery } from '@tanstack/react-query';
import gigService from '@/services/gigService';

export function useOrganizerGigsPublic(organizerId?: string, limit = 4) {
  return useQuery<{ gigs: any[]; total: number }>({
    queryKey: ['organizerGigsPublic', organizerId, limit],
    enabled: !!organizerId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const res = await gigService.getPublicOrganizerGigs(organizerId!, {
        status: 'published',
        pageSize: limit,
      });
      const data: any = (res as any)?.data ?? {};
      return {
        gigs: data.gigs ?? [],
        total: data.pagination?.total ?? (data.gigs?.length ?? 0),
      };
    },
  });
}

export default useOrganizerGigsPublic;
