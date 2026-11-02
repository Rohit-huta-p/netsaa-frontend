/**
 * requestFormat — pure formatting helpers for the host Requests surface
 * (event-manage-aminimal.html · frame 11 "Requests"). Kept framework-free so
 * they unit-test without React/RN.
 */
import type { EventRosterRow, RosterAnswer } from '@/services/eventService';

type SpotLite = { _id?: string; name?: string };

/** "just now" / "5m ago" / "3h ago" / "2d ago" / "4w ago" — relative, compact. */
export function relativeTime(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/** "1 seat" / "3 seats". */
export function seatLabel(seats?: number): string {
  const n = typeof seats === 'number' && seats > 0 ? seats : 1;
  return `${n} ${n === 1 ? 'seat' : 'seats'}`;
}

/** Initials for the avatar: first + last initial, or first two letters. */
export function initialsOf(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Stable, muted avatar fills (matches the gig hub's hand-picked dark tints).
const AVATAR_TINTS = ['#3A2A1F', '#2A2340', '#1F3328', '#332A1F', '#24303F', '#331F2B', '#1F2A33', '#2E2A1F'];

/** Deterministic avatar tint from a name (same name → same colour). */
export function tintFor(name?: string): string {
  const s = name ?? '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

/** Resolve a chosen spot/tier's display name from the event's spots[]. */
export function spotNameFor(spotId?: string, spots?: SpotLite[]): string | undefined {
  if (!spotId || !spots?.length) return undefined;
  const hit = spots.find((s) => String(s._id) === String(spotId));
  const name = hit?.name?.trim();
  return name || undefined;
}

/**
 * The muted meta line under the name: "3 seats · VIP · 5m ago" — only the parts
 * that exist. `stampIso` defaults to the row's request time.
 */
export function requestMetaLine(row: EventRosterRow, spots?: SpotLite[]): string {
  const spot = spotNameFor(row.spotId, spots);
  const stamp = relativeTime(row.registeredAt ?? row.joinedAt);
  return [seatLabel(row.seats), spot, stamp].filter(Boolean).join('  ·  ');
}

/** A single answer as "Label — value", skipping blanks. */
export function formatAnswer(a: RosterAnswer): string | undefined {
  const value = (a?.value ?? '').toString().trim();
  if (!value) return undefined;
  const label = (a?.label ?? '').toString().trim();
  return label ? `${label} — ${value}` : value;
}

/** Non-empty, formatted answers for a request row. */
export function visibleAnswers(row: EventRosterRow): string[] {
  return (row.answers ?? []).map(formatAnswer).filter((s): s is string => !!s);
}

/** Header sub-copy for the pending count: "No requests yet" / "1 awaiting your call". */
export function pendingSummary(count: number): string {
  if (!count || count <= 0) return 'No requests yet';
  return `${count} awaiting your call`;
}
