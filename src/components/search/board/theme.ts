// src/components/search/board/theme.ts
//
// A·Minimal tokens + formatters for the /search redesign
// (DOCS/04-design/mockups/search-aminimal.html, locked 2026-10-31).
//
// Reuses the locked artist-home palette (HC/HF) — the exact token family the
// search mockup was drawn in — and layers on the handful of search-only tokens
// the mockup needs. Pay is always a plain fact (pay-as-fact rule): no take-home
// / fee math, ever. Mirrors the pattern of gigs/board/theme.ts; kept
// self-contained so search owns its row/pay/date formatting.

import { HC, HF, fmtRupees } from '@/components/dashboard/artist/home/ui';

export const C = HC;
export const F = HF;
export { fmtRupees };

// Search-only tokens the home palette doesn't carry.
export const INK = '#190B05'; // text/icon ink on any orange fill
export const SHEET = '#17171D'; // sheet background (parity with the board)
export const ORANGE_SOFT = 'rgba(255,107,53,0.14)'; // tile / pill fill
export const ORANGE_LINE = 'rgba(255,107,53,0.30)'; // tile / pill border

/* ─── avatar fallback (gradient + initial, matching the mockup's g1…g5) ───── */

export const AV_GRADIENTS: [string, string][] = [
  ['#FF6B35', '#F59E0B'], // g1 orange → gold
  ['#8B5CF6', '#6D23B6'], // g2 purple
  ['#3B82F6', '#22C55E'], // g3 blue → green
  ['#F43F5E', '#8B5CF6'], // g4 rose → purple
  ['#0EA5E9', '#8B5CF6'], // g5 sky → purple
];

export function avatarGradient(seed?: string): [string, string] {
  const s = seed || '?';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AV_GRADIENTS[h % AV_GRADIENTS.length];
}

export function initialOf(name?: string): string {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}

/* ─── pay (pay-as-fact: quiet serif amount + tiny mono unit) ──────────────── */

const GIG_UNIT: Record<string, string> = {
  fixed: '',
  hourly: '/hr',
  'per-hour': '/hr',
  'per-day': '/day',
  daily: '/day',
  'per-track': '/track',
  'per-shoot': '/shoot',
  'per-event': '/event',
};
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * Gig pay as a plain fact → { amount, unit }. Fixed → "₹8,000" + "/day";
 * range → "₹x–y"; negotiable → "Negotiable"; nothing usable → empty strings
 * (the row then simply shows no pay — never a placeholder or fee math).
 */
export function fmtPayFact(c: any): { amount: string; unit: string } {
  if (!c) return { amount: '', unit: '' };
  const unit = c.model ? (GIG_UNIT[c.model] ?? '') : '';
  if (typeof c.amount === 'number' && c.amount > 0) return { amount: inr(c.amount), unit };
  const lo = typeof c.minAmount === 'number' ? c.minAmount : null;
  const hi = typeof c.maxAmount === 'number' ? c.maxAmount : null;
  if (lo != null && hi != null && (lo > 0 || hi > 0)) return { amount: `${inr(lo)}–${inr(hi)}`, unit };
  if (lo != null && lo > 0) return { amount: `${inr(lo)}+`, unit };
  if (hi != null && hi > 0) return { amount: `${inr(hi)}`, unit };
  if (c.negotiable) return { amount: 'Negotiable', unit: '' };
  return { amount: '', unit: '' };
}

/** Event price → { label, free }. Free covers 0 / missing / isFree. */
export function fmtEventPrice(e: any): { label: string; free: boolean } {
  const raw =
    e?.price ?? e?.ticketPrice ?? e?.fee ?? e?.registrationFee ?? e?.pricing?.amount ?? null;
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  if (e?.isFree || !Number.isFinite(n) || n <= 0) return { label: 'Free', free: true };
  return { label: inr(n), free: false };
}

/* ─── dates ───────────────────────────────────────────────────────────────── */

/** Meta-line date → "Nov 12" (not uppercased). Empty when unparseable. */
export function fmtMetaDate(iso?: string | Date | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Event date chit → { month: "NOV", day: "15" }. Empty strings when unparseable. */
export function fmtMonthDay(iso?: string | Date | null): { month: string; day: string } {
  if (!iso) return { month: '', day: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { month: '', day: '' };
  return {
    month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
  };
}

/** Join non-empty meta parts with " · ". */
export function metaLine(...parts: (string | null | undefined)[]): string {
  return parts.filter((p) => p && String(p).trim()).join(' · ');
}
