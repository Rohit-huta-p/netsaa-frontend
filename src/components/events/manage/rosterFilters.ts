// src/components/events/manage/rosterFilters.ts
//
// Pure, UI-free core for the Manage-Event "See all" attendee list
// (EventAttendeesAllScreen). The events sibling of the gig hub's
// applicantFilters.ts: group assignment, derived group visibility, name/phone
// search, and the event sorts — all testable without rendering anything.
//
// Groups: the canonical six (pattern doc §8) — Requests · Awaiting payment ·
// Confirmed · Waitlist · Checked-in · Cancelled. WHICH ones a given event shows is
// DERIVED from the event's shape (door · price · capacity), not hard-coded, and an
// eligible stage shows even at count 0 so the host sees it exists. See visibleGroups.
//
// Build plan: DOCS/02-engineering/NETSA_Event_SeeAll_Build_Plan.md (§1, §1a).

import type { EventDoc, EventRosterRow, EventRosterData } from '@/services/eventService';

export type AttendeeGroup =
  | 'requests' | 'awaitingpay' | 'confirmed' | 'waitlist' | 'checkedin' | 'cancelled';

// v1: 'registered' = default (time order); 'name' = A–Z; 'waitlist' = position, the
// Waitlist group's natural order. (phase 2: 'seats', 'paywindow'.)
export type AttendeeSort = 'registered' | 'name' | 'waitlist';

// v1: name/phone search only. (phase 2: tiers[], seats, checkedIn, hasAnswers.)
export type AttendeeFilters = { name: string };
export const EMPTY_FILTERS: AttendeeFilters = { name: '' };

/** The lifecycle order an attendee moves through — the order chips render in. */
export const GROUP_ORDER: AttendeeGroup[] = [
  'requests', 'awaitingpay', 'confirmed', 'waitlist', 'checkedin', 'cancelled',
];

/** Host-facing labels. "Confirmed" (not the attendee-facing "Going"). */
export const GROUP_LABEL: Record<AttendeeGroup, string> = {
  requests: 'Requests',
  awaitingpay: 'Awaiting pay',
  confirmed: 'Confirmed',
  waitlist: 'Waitlist',
  checkedin: 'Checked-in',
  cancelled: 'Cancelled',
};

/**
 * status → group. Labels over the backend EventRegistration status enum:
 *   pending → requests | approved → awaitingpay | registered → confirmed |
 *   attended → checkedin | cancelled/declined/no-show → cancelled.
 * Waitlist is identified by its own roster bucket (not a status), so it is handled
 * in buildGroups, never here. An unknown status stays VISIBLE (→ confirmed) rather
 * than silently dropping a real attendee.
 */
export function groupOf(status: string | undefined): AttendeeGroup {
  switch (status) {
    case 'pending': return 'requests';
    case 'approved': return 'awaitingpay';
    case 'registered': return 'confirmed';
    case 'attended': return 'checkedin';
    case 'cancelled':
    case 'declined':
    case 'no-show': return 'cancelled';
    default: return 'confirmed';
  }
}

export type GroupBuckets = Record<AttendeeGroup, EventRosterRow[]>;

/**
 * Split the roster payload into the six groups. Every NON-waitlist bucket is routed
 * by row.status (so a `no-show` lands in Cancelled wherever the backend files it,
 * and the `confirmed` bucket — which lumps registered ∪ attended — splits into
 * Confirmed vs Checked-in exactly as useEventHubData does). The waitlist bucket maps
 * straight across, sorted by queue position. Pure — never mutates the input.
 */
export function buildGroups(roster?: Partial<EventRosterData> | null): GroupBuckets {
  const groups: GroupBuckets = {
    requests: [], awaitingpay: [], confirmed: [], waitlist: [], checkedin: [], cancelled: [],
  };
  if (!roster) return groups;
  const nonWaitlist = [
    ...(roster.confirmed ?? []),
    ...(roster.requests ?? []),
    ...(roster.approved ?? []),
    ...(roster.cancelled ?? []),
    ...(roster.declined ?? []),
  ];
  for (const row of nonWaitlist) groups[groupOf(row.status)].push(row);
  groups.waitlist = [...(roster.waitlist ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return groups;
}

export function groupCounts(groups: GroupBuckets): Record<AttendeeGroup, number> {
  return {
    requests: groups.requests.length,
    awaitingpay: groups.awaitingpay.length,
    confirmed: groups.confirmed.length,
    waitlist: groups.waitlist.length,
    checkedin: groups.checkedin.length,
    cancelled: groups.cancelled.length,
  };
}

/** The event fields that decide which groups are possible. */
type EventShape = Pick<
  EventDoc, 'registrationMode' | 'registration' | 'requiresApproval' | 'capacity' | 'allowWaitlist'
>;

/**
 * The groups to render for this event, in GROUP_ORDER. A group shows when the
 * event's SHAPE makes it possible — even at count 0, so the host learns the stage
 * exists — OR when it currently holds rows (never hide a real attendee, e.g. after a
 * door change strands old requests). This is why a count of 0 alone can't decide
 * visibility: 0 means either "impossible for this event" or "nobody yet", and only
 * the shape tells them apart.
 *
 *   requests    ⟸ approval door (guest_list / apply) or requiresApproval
 *   awaitingpay ⟸ approval AND paid (the 48h pay-hold cohort; empty on free / pay-now)
 *   waitlist    ⟸ capped AND waitlist not disabled
 *   confirmed / checkedin / cancelled ⟸ always
 */
export function visibleGroups(
  event?: EventShape | null,
  counts?: Partial<Record<AttendeeGroup, number>>,
): AttendeeGroup[] {
  const door = event?.registration?.door;
  const requiresApproval = door === 'guest_list' || door === 'apply' || !!event?.requiresApproval;
  const isPaid = event?.registrationMode === 'paid_ticket';
  const hasWaitlist = (event?.capacity?.total ?? 0) > 0 && event?.allowWaitlist !== false;

  const eligible: Record<AttendeeGroup, boolean> = {
    requests: requiresApproval,
    awaitingpay: requiresApproval && isPaid,
    confirmed: true,
    waitlist: hasWaitlist,
    checkedin: true,
    cancelled: true,
  };
  const has = (g: AttendeeGroup) => (counts?.[g] ?? 0) > 0;
  return GROUP_ORDER.filter((g) => eligible[g] || has(g));
}

/** name OR phone contains the query (trim + case-insensitive). Empty query passes. */
export function matchesFilters(row: EventRosterRow, f: AttendeeFilters): boolean {
  const q = f.name.trim().toLowerCase();
  if (!q) return true;
  const name = (row.name ?? '').toLowerCase();
  const phone = (row.phone ?? '').toLowerCase();
  return name.includes(q) || phone.includes(q);
}

const timeOf = (iso?: string): number => {
  const t = new Date(iso ?? 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

/**
 * Filter then sort one group's rows. Pure — never mutates `rows`. `group` tunes the
 * default order: the Requests queue is FIFO (oldest first, fairest to approve), every
 * other group is newest-first, and the Waitlist always rides its queue position.
 */
export function filterAndSortAttendees(
  rows: EventRosterRow[],
  f: AttendeeFilters,
  sort: AttendeeSort,
  group: AttendeeGroup,
): EventRosterRow[] {
  const out = rows.filter((r) => matchesFilters(r, f));
  const byName = (a: EventRosterRow, b: EventRosterRow) =>
    (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' });
  const byPosition = (a: EventRosterRow, b: EventRosterRow) => (a.position ?? 0) - (b.position ?? 0);
  const newestFirst = (a: EventRosterRow, b: EventRosterRow) => timeOf(b.registeredAt) - timeOf(a.registeredAt);
  const oldestFirst = (a: EventRosterRow, b: EventRosterRow) => timeOf(a.registeredAt) - timeOf(b.registeredAt);

  out.sort((a, b) => {
    if (sort === 'name') return byName(a, b);
    if (group === 'waitlist') return byPosition(a, b);
    return group === 'requests' ? oldestFirst(a, b) : newestFirst(a, b);
  });
  return out;
}

export const setName = (f: AttendeeFilters, v: string): AttendeeFilters => ({ ...f, name: v });
