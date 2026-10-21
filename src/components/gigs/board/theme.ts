// src/components/gigs/board/theme.ts
//
// A·Minimal tokens + formatters for the gig-board redesign
// (DOCS/04-design/mockups/gig-board-aminimal.html, locked 2026-10-21).
//
// Reuses the locked artist-home palette (HC/HF) — the exact token family the
// board mockup was drawn in — and layers on the handful of board/sheet-only
// tokens the mockup needs. Pay is always a plain fact (pay-as-fact rule): no
// take-home / fee math, ever.

import { HC, HF, fmtRupees } from '@/components/dashboard/artist/home/ui';

export const C = HC;
export const F = HF;
export { fmtRupees };

// Board-only tokens the home palette doesn't carry.
export const INK = '#190B05'; // text/icon ink on any orange fill
export const SHEET = '#17171D'; // filter bottom-sheet background
export const ORANGE_SOFT = 'rgba(255,107,53,0.14)'; // selected performer chip bg
export const AMBER = HC.gold; // #F59E0B — "Nd left" urgency

/* ─── pay (pay-as-fact: amount + tiny unit, or range, or Negotiable) ─────── */

const UNIT: Record<string, string> = {
  fixed: 'fixed',
  hourly: 'per hr',
  'per-day': 'per day',
  'per-track': 'per track',
  'per-shoot': 'per shoot',
};
const payUnit = (m?: string) => (m ? UNIT[m] ?? m : '');
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Full pay for the Roles card: fixed → "₹18,000"+unit / range → "₹x–y" / "Negotiable". */
export function fmtPay(c: any): { amount: string; unit: string } {
  if (!c) return { amount: '—', unit: '' };
  const unit = payUnit(c.model);
  if (typeof c.amount === 'number' && c.amount > 0) return { amount: inr(c.amount), unit };
  const lo = typeof c.minAmount === 'number' ? c.minAmount : null;
  const hi = typeof c.maxAmount === 'number' ? c.maxAmount : null;
  if (lo != null && hi != null && (lo > 0 || hi > 0)) return { amount: `${inr(lo)}–${inr(hi)}`, unit };
  if (lo != null && lo > 0) return { amount: `${inr(lo)}+`, unit };
  if (hi != null && hi > 0) return { amount: `Up to ${inr(hi)}`, unit };
  if (c.negotiable) return { amount: 'Negotiable', unit: '' };
  return { amount: '—', unit: '' };
}

/** Abbreviated pay for the Casting card's nested roles: "₹60k". */
export function fmtPayShort(c: any): string {
  if (!c) return '—';
  const n =
    typeof c.amount === 'number' && c.amount > 0
      ? c.amount
      : typeof c.minAmount === 'number' && c.minAmount > 0
        ? c.minAmount
        : typeof c.maxAmount === 'number' && c.maxAmount > 0
          ? c.maxAmount
          : null;
  if (n != null) return fmtRupees(n);
  return c.negotiable ? 'Neg' : '—';
}

/* ─── dates & urgency ────────────────────────────────────────────────────── */

/** "25 Oct" (card/caster meta — not uppercased, unlike the home fmtShortDate). */
export function fmtDate(iso?: string | Date | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Urgency pill: amber "Nd left" when the deadline is within 7 days, else orange
 * "New" when freshly posted (≤3d), else null. Deadline-less gigs simply get no
 * pill (deadline is optional on the model).
 */
export function fmtUrgency(gig: any): { label: string; soon: boolean } | null {
  const dl = gig?.applicationDeadline;
  if (dl) {
    const t = new Date(dl).getTime();
    if (!Number.isNaN(t)) {
      const days = Math.ceil((t - Date.now()) / 86_400_000);
      if (days > 0 && days <= 7) return { label: `${days}d left`, soon: true };
    }
  }
  const cr = gig?.createdAt;
  if (cr) {
    const t = new Date(cr).getTime();
    if (!Number.isNaN(t)) {
      const age = Math.floor((Date.now() - t) / 86_400_000);
      if (age <= 3) return { label: 'New', soon: false };
    }
  }
  return null;
}

/* ─── caster avatar fallback ─────────────────────────────────────────────── */

const GRADS: [string, string][] = [
  ['#8B5CF6', '#6D23B6'],
  ['#FF6B35', '#F59E0B'],
  ['#3B82F6', '#1E40AF'],
  ['#EC4899', '#9D174D'],
];

export function casterGradient(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

export function initialOf(name?: string): string {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}
