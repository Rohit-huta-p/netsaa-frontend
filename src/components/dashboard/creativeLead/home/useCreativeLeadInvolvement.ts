// src/components/dashboard/creativeLead/home/useCreativeLeadInvolvement.ts
//
// "Your work" data for the Creative Lead home. The CL is the INVERSE of an
// artist — it posts and is applied to — so the three faces map onto organizer
// data instead of the artist's apply/save buckets:
//   Hiring  → Live · Draft · Closed     (gigs the CL posted; rows surface applicants)
//   Hosting → Upcoming · Draft · Past    (events the CL runs; rows surface registrations)
//   Pitching→ Sent · Won · Closed        (the CL's own proposals to client requirements; rows surface ₹)
//
// Fans out useOrganizerPosts (merged gigs+events, bucketed by status then split
// by `kind`) + useApplicantsInbox (the "new applicants" signal the focus card
// reads) + requirementService.myProposals. Mirrors useArtistInvolvement.

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganizerPosts, type PostRow } from '@/hooks/useOrganizerPosts';
import { useApplicantsInbox } from '@/hooks/useApplicantsInbox';
import { requirementService, type SentProposal } from '@/services/requirementService';
import { useAuthStore } from '@/stores/authStore';

export interface CLInvolvement {
  hiring: { live: PostRow[]; draft: PostRow[]; closed: PostRow[] };
  hosting: { upcoming: PostRow[]; draft: PostRow[]; past: PostRow[] };
  pitching: { sent: SentProposal[]; won: SentProposal[]; closed: SentProposal[] };
  /** New (unreviewed, status='applied') applicants — the focus-card signal. */
  newApplicants: number;
  isLoading: boolean;
}

function unwrapApplicants(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data.applicants)) return data.applicants;
  if (Array.isArray(data?.data?.applicants)) return data.data.applicants;
  return [];
}

export function useCreativeLeadInvolvement(): CLInvolvement {
  // Merged gigs+events bucketed by status; allItems is the full list which we
  // split by `kind` into the Hiring (gig) and Hosting (event) faces.
  const active = useOrganizerPosts('active', 50);
  const drafts = useOrganizerPosts('draft', 50);
  const past = useOrganizerPosts('past', 50);

  // Shared React Query cache with the focus card + ApplicantsInbox — the key
  // does NOT encode limit, so keep it at 5 everywhere to avoid clobbering.
  const { data: appData, isLoading: appsLoading } = useApplicantsInbox('applied', 5);

  const userId = useAuthStore((s) => s.user?._id);
  const proposalsQ = useQuery({
    queryKey: ['creativeLead', 'proposals', userId],
    queryFn: () => requirementService.myProposals(),
    enabled: !!userId,
    staleTime: 30_000,
  });

  return useMemo(() => {
    const gigs = (rows?: PostRow[]) => (rows ?? []).filter((r) => r.kind === 'gig');
    const events = (rows?: PostRow[]) => (rows ?? []).filter((r) => r.kind === 'event');
    const proposals = Array.isArray(proposalsQ.data) ? proposalsQ.data : [];
    const inStatus = (set: SentProposal['status'][]) =>
      proposals.filter((p) => set.includes(p.status));

    return {
      hiring: {
        live: gigs(active.allItems),
        draft: gigs(drafts.allItems),
        closed: gigs(past.allItems),
      },
      hosting: {
        upcoming: events(active.allItems),
        draft: events(drafts.allItems),
        past: events(past.allItems),
      },
      pitching: {
        sent: inStatus(['sent', 'viewed']),
        won: inStatus(['accepted']),
        closed: inStatus(['declined', 'withdrawn']),
      },
      newApplicants: unwrapApplicants(appData).length,
      isLoading: active.isLoading || drafts.isLoading || past.isLoading || appsLoading,
    };
  }, [active, drafts, past, appData, appsLoading, proposalsQ.data]);
}

export default useCreativeLeadInvolvement;
