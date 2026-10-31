// src/components/dashboard/creativeLead/home/clWorkRows.tsx
//
// Shared row renderers for the Creative Lead "Your work" surface, used by BOTH
// the home section (CreativeLeadWork — capped at 3) and the full See-all page
// (dashboard/cl-work — every row). Co-locating them keeps a row identical in
// both places. The CL is the inverse of an artist, so:
//   Hiring  → gigs, rows surface applicants (+ "N NEW" accent)   — the inversion
//   Hosting → events, rows surface registrations / attendance
//   Pitching→ the CL's proposals to client briefs, rows surface ₹ (pay-as-fact)
// See [[netsa-creative-lead-home]] / [[pay-as-fact-rule]].

import React from 'react';
import { Row, fmtRupees, type PillTone } from '@/components/dashboard/artist/home/ui';
import type { PostRow } from '@/hooks/useOrganizerPosts';
import type { SentProposal } from '@/services/requirementService';

export type HireSub = 'live' | 'draft' | 'closed';
export type HostSub = 'upcoming' | 'draft' | 'past';
export type PitchSub = 'sent' | 'won' | 'closed';

/** Minimal shape of expo-router's push — avoids coupling the renderers to the hook. */
type Nav = { push: (href: any) => void };

export const initialOf = (s?: string) => (s?.trim()[0] || '•').toUpperCase();

/** A gig/event date + its pay, as a plain fact line (pay-as-fact — never a hero). */
export function metaLine(p: PostRow): string {
  const pay = p.price && p.price !== '—' && p.price !== 'Free' ? p.price : null;
  return [p.date && p.date !== '—' ? p.date : null, pay].filter(Boolean).join(' · ');
}

// ── Hiring rows (gigs — surface applicants) ─────────────────────────────────
export function hiringRow(p: PostRow, sub: HireSub, opts: { newByGig: Record<string, number>; router: Nav }) {
  const pill: { label: string; tone: PillTone } =
    sub === 'live' ? { label: 'Live', tone: 'green' }
    : sub === 'draft' ? { label: 'Draft', tone: 'muted' }
    : { label: 'Closed', tone: 'muted' };
  const showCount = sub !== 'draft';
  const rawId = p.id.startsWith('gig:') ? p.id.slice(4) : p.id;
  const newCount = sub === 'live' ? opts.newByGig[rawId] ?? 0 : 0;
  return (
    <Row
      key={p.id}
      title={p.title}
      initial={initialOf(p.title)}
      kind="gig"
      pill={pill}
      meta={metaLine(p)}
      right={showCount ? String(p.applicants ?? 0) : undefined}
      accent={newCount > 0 ? `${newCount} NEW` : undefined}
      rightSub={showCount ? 'APPLICANTS' : undefined}
      muted={sub !== 'live'}
      onPress={() => opts.router.push((sub === 'draft' ? p.href : `${p.href}?tab=applicants`) as any)}
    />
  );
}

// ── Hosting rows (events — surface registrations) ───────────────────────────
export function hostingRow(p: PostRow, sub: HostSub, opts: { router: Nav }) {
  const pill: { label: string; tone: PillTone } =
    sub === 'upcoming' ? { label: 'Upcoming', tone: 'blue' }
    : sub === 'draft' ? { label: 'Draft', tone: 'muted' }
    : { label: 'Past', tone: 'muted' };
  const showCount = sub !== 'draft';
  return (
    <Row
      key={p.id}
      title={p.title}
      initial={initialOf(p.title)}
      kind="event"
      pill={pill}
      meta={metaLine(p)}
      right={showCount ? String(p.seats?.taken ?? 0) : undefined}
      rightSub={showCount ? (sub === 'past' ? 'ATTENDED' : 'REGISTERED') : undefined}
      muted={sub !== 'upcoming'}
      onPress={() => opts.router.push(p.href as any)}
    />
  );
}

// ── Pitching rows (proposals to client briefs — surface ₹) ──────────────────
// Currently UNUSED: Pitching is "coming soon" on both the home and the See-all
// page (the client side is deferred — see PitchingComingSoon). Retained so the
// Sent/Won/Closed rows can be restored when the client side ships.
export function pitchRow(p: SentProposal, sub: PitchSub, opts: { router: Nav }) {
  const pill: { label: string; tone: PillTone } =
    sub === 'won' ? { label: 'Won', tone: 'green' }
    : sub === 'closed' ? { label: 'Closed', tone: 'muted' }
    : p.status === 'viewed' ? { label: 'Viewed', tone: 'gold' }
    : { label: 'Sent', tone: 'muted' };
  const title = p.requirement?.title || p.requirement?.occasionText || 'Client brief';
  const amount = p.quoteAmount ?? p.requirement?.budgetMax ?? p.requirement?.budgetMin ?? null;
  const meta = [p.requirement?.clientSnapshot?.displayName, p.requirement?.city].filter(Boolean).join(' · ').toUpperCase();
  return (
    <Row
      key={p._id}
      title={title}
      initial={initialOf(title)}
      kind="brief"
      pill={pill}
      meta={meta}
      right={fmtRupees(amount)}
      muted={sub === 'closed'}
      onPress={() => opts.router.push('/requirements' as any)}
    />
  );
}
