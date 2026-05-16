/**
 * useOrganizerPosts — merged "Your posts" feed (gigs + events) for the hirer home.
 *
 * Plan: `~/.gstack/projects/NETSA-React/ceo-plans/2026-05-16-your-posts-redesign.md`.
 * Architecture: Option A (frontend-defensive merge). Backend aggregator
 * (Option B) lives as TODOS.md P3.1 for future migration.
 *
 * Two parallel queries via useQueries:
 *   1. usePostedGigs equivalent — GET /v1/organizers/me/gigs (via gigService)
 *   2. useOrganizerEvents     — GET /v1/organizers/me/events (via eventService)
 *
 * Both hydrate into the same React Query cache so future consumers
 * (Manage-all page, useActionQueue) hit warm cache. Normalized into
 * PostRow[] with `kind: 'gig' | 'event'` discriminator, sorted by
 * createdAt DESC, sliced to `limit`.
 *
 * Failure isolation (plan §6 code-quality decision): when one source
 * errors and the other resolves, render what we have. The hook surfaces
 * per-source error info via `sourceErrors`; consumers (YourPostsSection)
 * decide whether to show a per-source error pill or full empty/error state.
 */
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import gigService from '../services/gigService';
import { eventService, type EventDoc } from '../services/eventService';
import { queryKeys } from '../constants/queryKeys';
import { useAuthStore } from '../stores/authStore';

export type PostKind = 'gig' | 'event';

export interface PostRow {
  id: string;
  kind: PostKind;
  title: string;
  category?: string;
  /** Pre-formatted display price. `'—'` when none available. */
  price: string;
  /** Pre-formatted display date. `'—'` when none available. */
  date: string;
  /** Gigs only — number of applicants. Undefined for events. */
  applicants?: number;
  /** Gigs only — view count. Undefined for events. */
  views?: number;
  /** Events only — seat fractions (taken / total). Undefined for gigs. */
  seats?: { taken: number; total: number };
  status: string;
  createdAt: string;
  /** Expo Router href the card taps into. */
  href: string;
  /** Original raw entity. Avoid in render code; for debug + future enrichment. */
  _raw: unknown;
}

// Map UI tab labels to per-service status enums.
// 'Active' aliases gigs `published` AND events `live` — both mean "accepting interaction now".
const TAB_TO_GIG_STATUS: Record<string, 'draft' | 'published' | 'closed' | undefined> = {
  active: 'published',
  draft: 'draft',
  past: 'closed',
};

const TAB_TO_EVENT_STATUS: Record<string, 'draft' | 'live' | 'completed' | undefined> = {
  active: 'live',
  draft: 'draft',
  past: 'completed',
};

type TabKey = 'active' | 'draft' | 'past';

function readGigPrice(g: any): string {
  if (typeof g?.price === 'number') return `₹${g.price.toLocaleString('en-IN')}`;
  if (typeof g?.price?.amount === 'number') return `₹${g.price.amount.toLocaleString('en-IN')}`;
  if (typeof g?.budget === 'number') return `₹${g.budget.toLocaleString('en-IN')}`;
  return '—';
}

function readEventPrice(e: EventDoc): string {
  // Free RSVP events have no price line.
  const pricing = (e as any).pricing;
  if (e.registrationMode === 'free_rsvp') return 'Free';
  if (pricing && typeof pricing.amount === 'number') {
    // events-service stores pricing.amount in RUPEES (see Event schema +
    // razorpay.service.ts:createEventOrder which does the ×100 to paise
    // at order-create time, not at storage time). Use as-is.
    return `₹${pricing.amount.toLocaleString('en-IN')}`;
  }
  return '—';
}

function readDate(raw?: string): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function readCategory(g: any): string | undefined {
  if (typeof g?.category === 'string' && g.category.length > 0) {
    return g.category.replace(/_/g, ' ');
  }
  return undefined;
}

function unwrapGigs(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data.gigs)) return data.gigs;
  if (Array.isArray(data?.data?.gigs)) return data.data.gigs;
  if (Array.isArray(data)) return data;
  return [];
}

function normalizeGig(g: any): PostRow {
  const id = g._id ?? g.id ?? '';
  return {
    id: `gig:${id}`,
    kind: 'gig',
    title: g.title ?? 'Untitled gig',
    category: readCategory(g),
    price: readGigPrice(g),
    date: readDate(g.startsAt ?? g.gigDate ?? g.dates?.start ?? g.createdAt),
    applicants: g.stats?.applicationsCount ?? 0,
    views: g.stats?.viewsCount ?? 0,
    status: g.status ?? 'unknown',
    createdAt: g.createdAt ?? new Date(0).toISOString(),
    href: `/(app)/gigs/${id}`,
    _raw: g,
  };
}

function normalizeEvent(e: EventDoc): PostRow {
  const id = e._id ?? '';
  const cap = e.capacity;
  return {
    id: `event:${id}`,
    kind: 'event',
    title: e.title ?? 'Untitled event',
    category: e.topicTags?.[0],
    price: readEventPrice(e),
    date: readDate(e.startsAt ?? e.createdAt),
    seats: cap
      ? { taken: cap.registeredCount ?? 0, total: cap.total ?? 0 }
      : undefined,
    status: e.status ?? 'unknown',
    createdAt: e.createdAt ?? new Date(0).toISOString(),
    href: `/(app)/events/${id}`,
    _raw: e,
  };
}

export interface UseOrganizerPostsResult {
  items: PostRow[];
  /** Total rows across both sources after merge (before slice). */
  totalCount: number;
  isLoading: boolean;
  sourceErrors: { gigs?: Error; events?: Error };
  refetch: () => void;
}

export function useOrganizerPosts(
  tab: TabKey = 'active',
  limit = 5,
): UseOrganizerPostsResult {
  const userId = useAuthStore((s) => s.user?._id);
  const gigStatus = TAB_TO_GIG_STATUS[tab];
  const eventStatus = TAB_TO_EVENT_STATUS[tab];

  const [gigsQuery, eventsQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.hirer.postedGigs(gigStatus),
        queryFn: () =>
          gigService.getOrganizerGigs({
            status: gigStatus,
            // Pull a wider page than `limit` so the merge has headroom to pick
            // top items by createdAt across both sources.
            limit: Math.max(limit * 4, 20),
            // Defensive: stale gigs-service dist/ still expects this in the query.
            // Cleanup tracked in TODOS.md P3.1 + P3.2.
            organizerId: userId as string,
          }),
        enabled: !!userId,
        staleTime: 1000 * 30,
      },
      {
        queryKey: queryKeys.hirer.events(eventStatus),
        queryFn: () =>
          eventService.getOrganizerEvents({
            organizerId: userId as string,
            status: eventStatus,
            limit: Math.max(limit * 4, 20),
          }),
        enabled: !!userId,
        staleTime: 1000 * 30,
      },
    ],
  });

  const merged = useMemo<PostRow[]>(() => {
    const out: PostRow[] = [];

    if (gigsQuery.data && !gigsQuery.error) {
      for (const g of unwrapGigs(gigsQuery.data)) {
        out.push(normalizeGig(g));
      }
    }

    if (eventsQuery.data && !eventsQuery.error) {
      for (const e of eventsQuery.data) {
        // Client-side status filter — events backend ignores ?status= today.
        if (eventStatus && e.status !== eventStatus) continue;
        out.push(normalizeEvent(e));
      }
    }

    // createdAt DESC. Locked decision from the eng review.
    out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
    return out;
  }, [gigsQuery.data, gigsQuery.error, eventsQuery.data, eventsQuery.error, eventStatus]);

  const sourceErrors: { gigs?: Error; events?: Error } = {};
  if (gigsQuery.error) sourceErrors.gigs = gigsQuery.error as Error;
  if (eventsQuery.error) sourceErrors.events = eventsQuery.error as Error;

  return {
    items: merged.slice(0, limit),
    totalCount: merged.length,
    // Loading is true only while ANY source is still resolving its first run.
    // Once one resolves, the merged list shows what we have (failure isolation).
    isLoading: gigsQuery.isLoading || eventsQuery.isLoading,
    sourceErrors,
    refetch: () => {
      gigsQuery.refetch();
      eventsQuery.refetch();
    },
  };
}

export default useOrganizerPosts;
