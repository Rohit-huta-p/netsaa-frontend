/**
 * useActionQueue — single source of truth for the hirer home Today / Action queue.
 *
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.3.
 *
 * v1 contract: pulls *new* applicants from useApplicantsInbox and shapes them
 * into category-tagged ActionItems. As the supporting backends ship, this hook
 * folds in additional sources:
 *
 *   booking_confirm    — useBookingConfirmations()        (TODO)
 *   balance_due        — useBalancePayments()             (TODO, gated on PAYMENTS-DISABLED)
 *   refund_decision    — useRefundRequests()              (TODO)
 *   venue_change       — useVenueChangeProposals()        (TODO, Plan 6 followup)
 *   subartist_payment  — useSubArtistPaymentDeadlines()   (TODO, Plan 8 / PRD §3)
 *   message_pending    — useUnansweredMessages()          (TODO)
 *
 * Each source returns rows that this hook normalizes into a single ActionItem
 * shape, then priority-sorts by the CATEGORY_PRIORITY map.
 *
 * The component consumes `{ items, totalCount, isLoading, error }` and renders
 * up to `displayLimit` items, falling back to the "All clear" empty state when
 * none are open.
 */
import { useMemo } from 'react';
import { useApplicantsInbox } from './useApplicantsInbox';

export type ActionCategory =
  | 'applicants_new'
  | 'booking_confirm'
  | 'balance_due'
  | 'refund_decision'
  | 'venue_change'
  | 'subartist_payment'
  | 'message_pending';

export interface ActionItem {
  id: string;
  category: ActionCategory;
  title: string;
  subtitle: string;
  href: string;
  overdue?: boolean;
}

// Lower number = higher priority.
const CATEGORY_PRIORITY: Record<ActionCategory, number> = {
  applicants_new:    1,
  booking_confirm:   2,
  balance_due:       3,
  refund_decision:   4,
  venue_change:      5,
  subartist_payment: 6,
  message_pending:   7,
};

interface ApplicantRow {
  _id?: string;
  id?: string;
  gigId?: string;
  gigTitle?: string;
  artistSnapshot?: { displayName?: string; artistType?: string };
  status?: string;
  appliedAt?: string;
}

function unwrapApplicants(data: any): ApplicantRow[] {
  if (!data) return [];
  if (Array.isArray(data.applicants)) return data.applicants;
  if (Array.isArray(data?.data?.applicants)) return data.data.applicants;
  return [];
}

function timeAgo(iso?: string): string {
  if (!iso) return 'recent';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'recent';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function useActionQueue(displayLimit = 4) {
  const applicants = useApplicantsInbox('applied', 20);

  const items = useMemo<ActionItem[]>(() => {
    const out: ActionItem[] = [];

    // Source 1: new applicants → applicants_new
    for (const row of unwrapApplicants(applicants.data)) {
      const id = row._id ?? row.id;
      if (!id) continue;
      const artist = row.artistSnapshot?.displayName ?? 'Someone';
      const gig = row.gigTitle ?? 'a gig';
      out.push({
        id: `applicant:${id}`,
        category: 'applicants_new',
        title: `${artist} applied to ${gig}`,
        subtitle: `${row.artistSnapshot?.artistType ?? 'Artist'} · ${timeAgo(row.appliedAt)}`,
        href: row.gigId
          ? `/(app)/gigs/${row.gigId}?tab=applicants`
          : '/gigs?mine=1&tab=applicants',
      });
    }

    // TODO §6.3: source 2-7 fold in here as their hooks ship.

    // Priority sort
    out.sort((a, b) => CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category]);
    return out;
  }, [applicants.data]);

  return {
    items: items.slice(0, displayLimit),
    /** Total open across all categories (drives the "See N more" link + header pill). */
    totalCount: items.length,
    isLoading: applicants.isLoading,
    error: applicants.error as Error | null,
    refetch: () => applicants.refetch(),
  };
}

export default useActionQueue;
