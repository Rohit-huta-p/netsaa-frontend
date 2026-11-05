// src/hooks/useEventHubData.ts
//
// Composition selector for the Manage-Event host hub — the events sibling of the
// gig hub's useGigHubData. Combines useEvent + useEventRoster + usePayoutAccount
// into the shape EventHostHub renders: stage buckets, counts, capacity, a derived
// host-net "Earned", the day-of flag, the status pill, gating, and the phase-aware
// sticky intent. Pure derivation over the three queries — no fetching of its own.
//
// Design + decisions: DOCS/03-features/events/MANAGE_EVENT_BACKEND_READINESS.md
// (Screen 1 + "Consolidated work list · A"); mockup manage-event-aminimal.html.

import { useMemo } from 'react';
import { useEvent } from '@/hooks/useEvents';
import { useEventRoster } from '@/hooks/useEventRoster';
import { usePayoutAccount } from '@/hooks/usePayoutAccount';
import type { EventDoc, EventRosterRow } from '@/services/eventService';
import type { PayoutAccount, PayoutStatus } from '@/services/payoutService';

/** The attendee-lifecycle spine. `requests` leads only on gated events. */
export type EventHubStage = 'requests' | 'going' | 'waitlist' | 'checkedIn';

/** Phase-aware bottom CTA. day-of + draft lead with their own body CTAs → `none`. */
export type EventStickyIntent =
  | { kind: 'none' }
  | { kind: 'announce'; label: string }
  | { kind: 'promote'; label: string; entryName: string };

export type EventHubCounts = {
  going: number;      // confirmed rows, status 'registered'
  checkedIn: number;  // confirmed rows, status 'attended'
  waitlist: number;   // waitlist bucket rows
  requests: number;   // pending requests bucket rows
};

export type StatusPill = { label: string; color: string };

const DAY = 86_400_000;
// 0.5% NETSA fee — mirrors eventPricing.NETSA_FEE_PERCENT + RoomStats/OverviewStatsGrid,
// so the hub's "Earned" matches the figure the Living-Poster overview showed.
const NETSA_FEE = 0.005;

/** "21 days to go" / "tomorrow" / "today" / "underway" / "ended" — ported from the old overview. */
function timeToGo(startsAt?: string, endsAt?: string): string {
  if (!startsAt) return '';
  const start = new Date(startsAt).getTime();
  if (Number.isNaN(start)) return '';
  const now = Date.now();
  const end = endsAt ? new Date(endsAt).getTime() : start;
  if (now > end + DAY) return 'ended';
  if (now >= start) return 'underway';
  const d = Math.ceil((start - now) / DAY);
  if (d <= 0) return 'today';
  if (d === 1) return 'tomorrow';
  return `${d} days to go`;
}

/** First name for the "Promote {name}" sticky. */
function firstNameOf(name?: string): string {
  const n = (name ?? '').trim();
  return n ? n.split(/\s+/)[0] : 'the top of the queue';
}

export type EventHubData = {
  event: EventDoc | undefined;
  roster: ReturnType<typeof useEventRoster>['data'];
  payout: PayoutAccount | undefined;

  // stage buckets (rows)
  goingRows: EventRosterRow[];
  checkedInRows: EventRosterRow[];
  waitlistRows: EventRosterRow[];
  requestRows: EventRosterRow[];
  approvedRows: EventRosterRow[];
  counts: EventHubCounts;

  // capacity (seats — count-on-read)
  seatsTotal: number;
  seatsTaken: number;
  seatsOpen: number;

  // money (host-net, pay-as-fact)
  isPaid: boolean;
  priceRupees: number;
  earnedNet: number;

  // payout
  payoutStatus: PayoutStatus | null;

  // time / phase
  daysLeft: number;
  dayOf: boolean;
  statusPill: StatusPill;

  // gating + phase routing
  gated: boolean;
  defaultStage: EventHubStage;
  sticky: EventStickyIntent;

  // state flags
  isDraft: boolean;
  isEmpty: boolean;
  canCancel: boolean;
  walkupsAllowed: boolean;

  isLoading: boolean;
  error: unknown;
};

export function useEventHubData(eventId: string): EventHubData {
  const eventQuery = useEvent(eventId);
  const rosterQuery = useEventRoster(eventId);
  const payoutQuery = usePayoutAccount();

  const event = eventQuery.data;
  const roster = rosterQuery.data;
  const payout = payoutQuery.data;

  return useMemo<EventHubData>(() => {
    const confirmed = roster?.confirmed ?? [];
    // Roster lumps registered ∪ attended into `confirmed`; the spine splits them
    // client-side (registrations.ts:339). Status strings are the backend enum.
    const goingRows = confirmed.filter((r) => r.status === 'registered');
    const checkedInRows = confirmed.filter((r) => r.status === 'attended');
    const waitlistRows = [...(roster?.waitlist ?? [])].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
    const requestRows = roster?.requests ?? [];
    const approvedRows = roster?.approved ?? [];

    const counts: EventHubCounts = {
      going: goingRows.length,
      checkedIn: checkedInRows.length,
      waitlist: waitlistRows.length,
      requests: requestRows.length,
    };

    // Seats are count-on-read off the event (authoritative), not a row sum.
    const seatsTotal = event?.capacity?.total ?? 0;
    const seatsTaken = event?.capacity?.registeredCount ?? 0;
    const seatsOpen = Math.max(0, seatsTotal - seatsTaken);

    const isPaid = event?.registrationMode === 'paid_ticket';
    const priceRupees: number =
      (event as any)?.pricing?.amount ?? (event as any)?.ticketPrice ?? 0;
    // Pay-as-fact: the host's own net estimate (seats × price − 0.5%), paid only.
    // ⚠️ derived, not a revenue rollup — see readiness Screen 1 / B5.
    const earnedNet = isPaid ? Math.round(seatsTaken * priceRupees * (1 - NETSA_FEE)) : 0;

    // Payout: loading → null (no "set up" flash); error/empty → not_started.
    const payoutStatus: PayoutStatus | null = payoutQuery.isLoading
      ? null
      : payoutQuery.isError || !payout
        ? 'not_started'
        : payout.status;

    const status = event?.status;
    const tl = timeToGo(event?.startsAt, event?.endsAt);
    const dayOf = (tl === 'today' || tl === 'underway') && status === 'live';
    let daysLeft = 0;
    if (event?.startsAt) {
      const ms = new Date(event.startsAt).getTime();
      if (Number.isFinite(ms)) daysLeft = Math.max(0, Math.ceil((ms - Date.now()) / DAY));
    }

    // Day number for a multi-day event that's underway ("Today · Day 2").
    let dayNumber = 1;
    if (dayOf && event?.startsAt) {
      const start = new Date(event.startsAt).getTime();
      if (Number.isFinite(start) && Date.now() >= start) {
        dayNumber = Math.floor((Date.now() - start) / DAY) + 1;
      }
    }

    const statusPill: StatusPill = (() => {
      if (status === 'draft') return { label: 'Draft', color: '#6E6C76' };
      if (status === 'cancelled') return { label: 'Cancelled', color: '#F0858A' };
      if (status === 'completed') return { label: 'Ended', color: '#6E6C76' };
      if (status === 'pending_review') return { label: 'In review', color: '#F0B65A' };
      if (dayOf) return { label: dayNumber > 1 ? `Today · Day ${dayNumber}` : 'Today', color: '#FF6B35' };
      return { label: daysLeft > 0 ? `Live · ${daysLeft}d` : 'Live', color: '#6EE7A0' };
    })();

    // Gated = the spine gains a leading Requests tab: approval doors, an explicit
    // requiresApproval flag, or any pending request already sitting in the bucket.
    const door = event?.registration?.door;
    const gated =
      door === 'guest_list' || door === 'apply' || !!event?.requiresApproval || counts.requests > 0;

    const confirmedCount = counts.going + counts.checkedIn;
    const isDraft = status === 'draft';
    const isEmpty =
      status === 'live' &&
      confirmedCount === 0 &&
      counts.waitlist === 0 &&
      counts.requests === 0;
    const canCancel = status === 'live' || status === 'pending_review';
    const walkupsAllowed = !!event?.walkupsAllowed;

    const defaultStage: EventHubStage = dayOf
      ? 'checkedIn'
      : gated && counts.requests > 0
        ? 'requests'
        : 'going';

    // Phase-aware sticky: draft + day-of carry their own body CTAs (Publish /
    // scanner), so no bottom bar. A full house with a free seat + a queue →
    // promote. Otherwise, while the room has people, nudge an announcement.
    const sticky: EventStickyIntent = (() => {
      if (isDraft || dayOf || status !== 'live') return { kind: 'none' };
      if (counts.waitlist > 0 && seatsOpen > 0) {
        const name = firstNameOf(waitlistRows[0]?.name);
        return { kind: 'promote', entryName: name, label: `Promote ${name} to the open seat` };
      }
      if (confirmedCount > 0) {
        return { kind: 'announce', label: `Send an update to your ${confirmedCount} going` };
      }
      return { kind: 'none' };
    })();

    return {
      event,
      roster,
      payout,
      goingRows,
      checkedInRows,
      waitlistRows,
      requestRows,
      approvedRows,
      counts,
      seatsTotal,
      seatsTaken,
      seatsOpen,
      isPaid,
      priceRupees,
      earnedNet,
      payoutStatus,
      daysLeft,
      dayOf,
      statusPill,
      gated,
      defaultStage,
      sticky,
      isDraft,
      isEmpty,
      canCancel,
      walkupsAllowed,
      // The hub needs the event to render anything; roster/payout only decorate,
      // so a roster/payout failure degrades (empty buckets / no payout line)
      // rather than blanking the screen — mirrors useGigHubData's contracts-optional rule.
      isLoading: eventQuery.isLoading || rosterQuery.isLoading,
      error: eventQuery.error,
    };
  }, [
    event,
    roster,
    payout,
    payoutQuery.isLoading,
    payoutQuery.isError,
    eventQuery.isLoading,
    eventQuery.error,
    rosterQuery.isLoading,
  ]);
}
