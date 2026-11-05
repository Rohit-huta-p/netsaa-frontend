/**
 * Pure formatting helpers for the E·9 photo-led event detail page (V3).
 * Maps a v4 EventDoc to display strings — no side effects, no rendering.
 * Reads v4 field names: people, spots, offers, registration.door, languages,
 * eventTypeLabel, bring/included, lineup.
 */
import type { EventDoc } from '@/services/eventService';
import { formatRupees, resolveEffectiveOffer } from '@/lib/eventPricing';

export const EVENT_TYPE_LABEL: Record<string, string> = {
  workshop: 'Workshop',
  masterclass: 'Masterclass',
  audition: 'Audition',
  open_mic: 'Open mic',
  competition: 'Competition',
  performance: 'Performance',
  screening: 'Screening',
  meetup: 'Meetup',
  showcase: 'Showcase',
  other: 'Event',
};

export const SKILL_LABEL: Record<string, string> = {
  all: 'All levels',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const LANG_LABEL: Record<string, string> = {
  en: 'English', hi: 'Hindi', mr: 'Marathi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', ml: 'Malayalam', bn: 'Bengali', gu: 'Gujarati', pa: 'Punjabi',
};

function langOne(code?: string): string {
  if (!code) return '';
  return LANG_LABEL[code.toLowerCase()] || code;
}

/** A readable language list from v4 `languages[]` (falling back to `language`). */
export function langLabel(event: EventDoc): string {
  const list = (event.languages && event.languages.length ? event.languages : [event.language])
    .filter(Boolean) as string[];
  return list.map(langOne).filter(Boolean).join(', ');
}

/** The event-kind label — the host's typed-in label wins over the preset. */
export function kindLabel(event: EventDoc): string {
  return event.eventTypeLabel || EVENT_TYPE_LABEL[event.eventType ?? ''] || 'Event';
}

/** "Workshop · Dance" — kind + craft/category (city deliberately left out). */
export function eyebrow(event: EventDoc): string {
  const kind = kindLabel(event);
  const craft = (event as any).category || event.topicTags?.[0] || '';
  return craft ? `${kind} · ${craft}` : kind;
}

/** Lowest price a single buyer can pay RIGHT NOW: base spot/event price with any ACTIVE,
 *  everyone-audience offer applied (via the resolver). Excludes expired offers and group rates
 *  (which need minSeats), so the "from" price is honest. Exposes the winning offer for a teaser. */
export function lowestPrice(event: EventDoc): { amount: number; multiple: boolean; offerName?: string; baseAmount?: number } {
  const spots = event.spots ?? [];
  const now = new Date();
  const results = spots.length
    ? spots.map((s) => resolveEffectiveOffer(event as any, { spotId: (s as any)._id ?? s.name, seats: 1, now }))
    : [resolveEffectiveOffer(event as any, { seats: 1, now })];
  const best = results.reduce((a, b) => (b.unitRupees < a.unitRupees ? b : a));
  const distinct = new Set([...spots.map((s) => s.price ?? 0), ...results.map((r) => r.unitRupees)]);
  return {
    amount: best.unitRupees,
    multiple: distinct.size > 1,
    offerName: best.appliedOffer?.name,
    baseAmount: best.appliedOffer?.baseUnitRupees,
  };
}

/** The door-policy verb for the CTA, refined by event type. */
export function doorVerb(event: EventDoc): string {
  const door = event.registration?.door ?? 'open';
  const paid = event.registrationMode === 'paid_ticket';
  if (door === 'apply') {
    if (event.eventType === 'audition') return 'Apply to audition';
    if (event.eventType === 'competition') return 'Enter';
    return 'Apply';
  }
  if (door === 'guest_list') return 'Request to join';
  // open
  if (event.eventType === 'open_mic') return 'Sign up';
  return paid ? 'Get tickets' : 'Register';
}

/** Full CTA label: "Register · ₹3,900 onwards" / "Apply to audition" / "Request to join". */
export function ctaLabel(event: EventDoc): string {
  const verb = doorVerb(event);
  const { amount, multiple } = lowestPrice(event);
  const free = event.registrationMode !== 'paid_ticket' && amount === 0;
  if (free) return verb;
  const priceStr = amount === 0 ? 'Free' : formatRupees(amount);
  return `${verb} · ${priceStr}${multiple ? ' onwards' : ''}`;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Fri 13 – Sun 15 Nov" for a range, "Fri 13 Nov" for one day. */
export function dateRange(startISO?: string, endISO?: string): string {
  if (!startISO) return 'Date TBA';
  const s = new Date(startISO);
  const sStr = `${DOW[s.getDay()]} ${s.getDate()} ${MON[s.getMonth()]}`;
  if (!endISO) return sStr;
  const e = new Date(endISO);
  if (s.toDateString() === e.toDateString()) return sStr;
  const sameMonth = s.getMonth() === e.getMonth();
  const sShort = sameMonth ? `${DOW[s.getDay()]} ${s.getDate()}` : sStr;
  return `${sShort} – ${DOW[e.getDay()]} ${e.getDate()} ${MON[e.getMonth()]}`;
}

const TIME_FMT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

export function timeLine(event: EventDoc): string {
  if (event.timeTbd) return 'Time TBA';
  if (!event.startsAt) return '';
  const s = new Date(event.startsAt).toLocaleTimeString('en-IN', TIME_FMT);
  if (!event.endsAt) return s;
  const e = new Date(event.endsAt).toLocaleTimeString('en-IN', TIME_FMT);
  return `${s} – ${e}`;
}

/** The individual "Level", "For", "Language", "Age" meta tags. */
export function metaParts(event: EventDoc): string[] {
  const parts: string[] = [];
  const levels = (Array.isArray(event.skillLevel) ? event.skillLevel : (event.skillLevel ? [event.skillLevel] : []))
    .filter((x) => x && x !== 'all');
  if (levels.length) parts.push(levels.map((l) => SKILL_LABEL[l] || l).join(', '));
  if (event.openToAll) {
    parts.push('All creatives');
  } else {
    const who = [...(event.eligibleArtistTypes ?? []), ...(event.otherArtistTypes ?? [])];
    if (who.length) parts.push(`For ${who.slice(0, 3).join(', ').toLowerCase()}`);
  }
  const lang = langLabel(event);
  if (lang) parts.push(lang);
  if (typeof event.ageRestriction === 'number' && event.ageRestriction > 0) parts.push(`${event.ageRestriction}+`);
  return parts;
}

/** The small "Level · For · Language · Age" meta line, from whatever is present. */
export function metaLine(event: EventDoc): string {
  return metaParts(event).join('  ·  ');
}

/** Refund label from the structured policy. */
export function refundLabel(event: EventDoc): string | null {
  const c = event.cancellationPolicy;
  if (!c) return null;
  if (c.fullRefundUntil) return 'Flexible refund';
  if (c.partialRefundPercent && c.partialRefundPercent > 0) return 'Partial refund';
  return 'No refund';
}

/** "Closes 12 Nov" from the registration deadline. */
export function closesLabel(event: EventDoc): string | null {
  if (!event.registrationDeadline) return null;
  const d = new Date(event.registrationDeadline);
  return `Closes ${d.getDate()} ${MON[d.getMonth()]}`;
}

export function initials(name?: string): string {
  if (!name) return '•';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '•';
}

/** The "Led by" section heading, per event type. */
export function featuringLabel(event: EventDoc): string {
  switch (event.eventType) {
    case 'audition': return 'Casting team';
    case 'competition': return 'Judges';
    case 'screening': return 'Filmmakers';
    case 'meetup': return 'Speakers';
    case 'performance':
    case 'open_mic': return 'Performers';
    case 'masterclass': return 'Masterclass by';
    default: return 'Led by';
  }
}
