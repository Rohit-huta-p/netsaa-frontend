/**
 * useActionQueueArtist — single source of truth for the artist home
 * "Today" action queue (DOCS/designs/artist-home-v1.html §3).
 *
 * Mirrors the hirer-side useActionQueue contract but with artist lenses:
 *
 *   hirer_reply         — hirer responded / shortlisted you on an application
 *   payout_settled      — money landed in your account, awaiting acknowledge
 *   event_starting_soon — registered event starting within 24h
 *   gig_starting_soon   — confirmed gig starting within 24h
 *   audition_pending    — audition window approaching (<72h)
 *
 * v1 contract: pulls from useUpcoming (already merges hired gigs + event
 * registrations) and useApplications (active statuses) to synthesize rows.
 * Earnings / payout_settled rows are stubbed at zero until the payouts
 * endpoint ships (Plan 8 follow-up).
 *
 * Each row carries an `href` for tap-through. The presentation component
 * keeps its row-shape decoupled from this hook via the ActionItem
 * interface — same pattern as useActionQueue.
 */
import { useMemo } from 'react';
import useApplications from './useApplications';
import { useUpcoming } from './useUpcoming';

export type ArtistActionCategory =
    | 'hirer_reply'
    | 'payout_settled'
    | 'event_starting_soon'
    | 'gig_starting_soon'
    | 'audition_pending';

export interface ArtistActionItem {
    id: string;
    category: ArtistActionCategory;
    title: string;
    subtitle: string;
    href: string;
    /** Optional CTA label override. Defaults to the category-level fallback. */
    cta?: string;
    /** Hours until the event/gig. Used by the chevron / urgency hint. */
    hoursUntil?: number;
}

// Lower = higher priority. Reply windows beat "you'll feel good" tiles.
const CATEGORY_PRIORITY: Record<ArtistActionCategory, number> = {
    hirer_reply:         1,
    audition_pending:    2,
    gig_starting_soon:   3,
    event_starting_soon: 4,
    payout_settled:      5,
};

const ACTIVE_REPLY_STATUSES = new Set(['shortlisted', 'reviewed']);

function hoursFromNow(iso?: string): number | undefined {
    if (!iso) return undefined;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return undefined;
    return (t - Date.now()) / 3_600_000;
}

function fmtHours(h: number): string {
    if (h < 1) return 'starting now';
    if (h < 24) return `in ${Math.round(h)}h`;
    return `in ${Math.round(h / 24)}d`;
}

export function useActionQueueArtist(): {
    items: ArtistActionItem[];
    totalCount: number;
    isLoading: boolean;
} {
    const appsQ = useApplications();
    const upcoming = useUpcoming();

    const items = useMemo<ArtistActionItem[]>(() => {
        const out: ArtistActionItem[] = [];

        // ─── hirer_reply ────────────────────────────────────────────
        const apps = Array.isArray(appsQ.data) ? appsQ.data : [];
        apps.forEach((a: any) => {
            const status = String(a?.status ?? '').toLowerCase();
            if (!ACTIVE_REPLY_STATUSES.has(status)) return;
            const gigTitle = a?.gig?.title ?? a?.gigTitle ?? 'a gig';
            out.push({
                id: `reply-${a?._id ?? a?.id ?? gigTitle}`,
                category: 'hirer_reply',
                title: `Hirer needs a reply on ${gigTitle}`,
                subtitle: `Status: ${status}`,
                href: `/applications/${a?._id ?? ''}`,
                cta: 'Reply',
            });
        });

        // ─── gig_starting_soon + event_starting_soon ─────────────────
        const upcomingItems = (upcoming as any)?.items ?? [];
        upcomingItems.forEach((u: any) => {
            const hrs = hoursFromNow(u?.startsAt ?? u?.gig?.startsAt);
            if (typeof hrs !== 'number' || hrs < 0 || hrs > 24) return;
            const isEvent = (u?.kind ?? '').toLowerCase() === 'event' || !!u?.eventId;
            const title = u?.title ?? u?.event?.title ?? u?.gig?.title ?? 'Your next stage';
            const venue =
                u?.location?.venueName ?? u?.gig?.location?.venueName ?? 'directions ready';
            out.push({
                id: `${isEvent ? 'event' : 'gig'}-soon-${u?._id ?? title}`,
                category: isEvent ? 'event_starting_soon' : 'gig_starting_soon',
                title: isEvent
                    ? `${title} ${fmtHours(hrs)}`
                    : `${title} ${fmtHours(hrs)}`,
                subtitle: venue,
                href: isEvent ? `/events/${u?._id ?? ''}` : `/gigs/${u?._id ?? ''}`,
                cta: 'Open',
                hoursUntil: hrs,
            });
        });

        // TODO(plan-8-followup): payout_settled rows from /payouts when shipped.
        // TODO(audition):       audition_pending rows from gigs with audition slots.

        // Priority sort + cap to 5 rows on screen.
        return out
            .sort((a, b) => CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category])
            .slice(0, 5);
    }, [appsQ.data, upcoming]);

    return {
        items,
        totalCount: items.length,
        isLoading: appsQ.isLoading || ((upcoming as any)?.isLoading ?? false),
    };
}

export default useActionQueueArtist;
