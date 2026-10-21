// src/components/events/board/theme.ts
//
// A·Minimal tokens + formatters for the events-board redesign
// (DOCS/04-design/mockups/event-board-aminimal.html, locked 2026-10-21).
//
// Sibling of the gig board's theme — reuses the locked artist-home palette
// (HC/HF, the exact token family the mockups were drawn in) and layers on the
// handful of board/sheet-only tokens + event-specific formatters the Marquee
// card needs. Pay is always a plain fact (pay-as-fact rule): Free / ₹X, never
// take-home or fee math.

import { HC, HF } from '@/components/dashboard/artist/home/ui';
import type { EventDoc } from '@/services/eventService';

export const C = HC;
export const F = HF;

// Board-only tokens the home palette doesn't carry (shared with the gig board).
export const INK = '#190B05'; // text/icon ink on any orange fill
export const SHEET = '#17171D'; // filter bottom-sheet background
export const ORANGE_SOFT = 'rgba(255,107,53,0.14)';

/* ─── price (pay-as-fact: Free / ₹X, no fee math) ─────────────────────────── */

export function fmtEventPrice(e: Pick<EventDoc, 'registrationMode' | 'pricing'>): {
    free: boolean;
    label: string;
} {
    const amount = e?.pricing?.amount ?? 0;
    const paid = e?.registrationMode === 'paid_ticket' && amount > 0;
    if (!paid) return { free: true, label: 'Free' };
    return { free: false, label: `₹${Math.round(amount).toLocaleString('en-IN')}` };
}

/* ─── dates ───────────────────────────────────────────────────────────────── */

/** "Sat 25 Oct" — weekday + day + month (the Marquee meta line). */
export function fmtMarqueeDate(iso?: string | null): string {
    if (!iso) return 'Date TBA';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Date TBA';
    const wd = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const day = d.toLocaleDateString('en-IN', { day: 'numeric' });
    const mo = d.toLocaleDateString('en-IN', { month: 'short' });
    return `${wd} ${day} ${mo}`;
}

/* ─── event-type chip label ───────────────────────────────────────────────── */

const titleCase = (v: string) =>
    v
        .split(/[_\s]+/)
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(' ');

/** Chip text: explicit label → Title-cased enum → first topic tag → "Event". */
export function eventTypeChipLabel(e: Pick<EventDoc, 'eventType' | 'eventTypeLabel' | 'topicTags'>): string {
    if (e?.eventTypeLabel?.trim()) return e.eventTypeLabel.trim();
    if (e?.eventType) return titleCase(e.eventType);
    if (e?.topicTags?.[0]) return titleCase(e.topicTags[0]);
    return 'Event';
}

/* ─── location summary (date · city meta) ─────────────────────────────────── */

export function cityOf(e: Pick<EventDoc, 'location'>): string {
    const loc = e?.location;
    if (!loc) return 'TBA';
    if (loc.kind === 'online') return 'Online';
    return loc.venueName || loc.city || loc.address?.split(',')[0]?.trim() || 'TBA';
}

/* ─── going / applied count ───────────────────────────────────────────────── */

/** "18 going" for RSVP/ticket events · "N applied" when the door is apply-to-attend. */
export function goingLabel(e: EventDoc): string {
    const n = e?.capacity?.registeredCount ?? 0;
    const applies = (e as any)?.registration?.door === 'apply';
    return `${n} ${applies ? 'applied' : 'going'}`;
}

/* ─── cover fallback (no fake stock photos → branded gradient + monogram) ──── */

const GRADS: [string, string][] = [
    ['#8B5CF6', '#4C1D95'], // purple
    ['#EC4899', '#9D174D'], // pink
    ['#FF6B35', '#B23A10'], // orange
    ['#3B82F6', '#1E3A8A'], // blue
    ['#F59E0B', '#92400E'], // amber
    ['#14B8A6', '#0F766E'], // teal
];

/** Deterministic gradient from a stable seed (event id/title) → same card, same cover. */
export function eventGradient(seed: string): [string, string] {
    let h = 0;
    const s = seed || '?';
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return GRADS[h % GRADS.length];
}

/** First grapheme of the title — Devanagari titles naturally show क/स/आ, Latin show an initial. */
export function monogramOf(title?: string): string {
    const t = (title || '').trim();
    return t ? Array.from(t)[0] : '◆';
}
