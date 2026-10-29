// src/components/dashboard/creativeLead/home/CreativeLeadWork.tsx
//
// Section 3 — "Your work". Three primary faces (the CL's two sides), each with
// sub-tabs; the home shows up to 3 rows + a See-all:
//   Hiring   → Live · Draft · Closed      (rows show applicants — the inversion)
//   Hosting  → Upcoming · Draft · Past     (rows show registrations)
//   Pitching → Sent · Won · Closed         (the CL's apply face; rows show ₹)
// Reuses the artist home's ui.tsx atoms (SegTabs/SubTabs/Row/SeeAll/EmptyState).

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  SectionTitle,
  SegTabs,
  SubTabs,
  SeeAll,
  Row,
  EmptyState,
  fmtRupees,
  type PillTone,
} from '@/components/dashboard/artist/home/ui';
import type { PostRow } from '@/hooks/useOrganizerPosts';
import type { SentProposal } from '@/services/requirementService';
import useCreativeLeadInvolvement from './useCreativeLeadInvolvement';

type Face = 'hiring' | 'hosting' | 'pitching';
type HireSub = 'live' | 'draft' | 'closed';
type HostSub = 'upcoming' | 'draft' | 'past';
type PitchSub = 'sent' | 'won' | 'closed';

const LIMIT = 3;

const initialOf = (s?: string) => (s?.trim()[0] || '•').toUpperCase();

/** A gig/event date + its pay, as a plain fact line (pay-as-fact — never a hero). */
function metaLine(p: PostRow): string {
  const pay = p.price && p.price !== '—' && p.price !== 'Free' ? p.price : null;
  return [p.date && p.date !== '—' ? p.date : null, pay].filter(Boolean).join(' · ');
}

export default function CreativeLeadWork() {
  const router = useRouter();
  const inv = useCreativeLeadInvolvement();

  const [face, setFace] = useState<Face>('hiring');
  const [hireSub, setHireSub] = useState<HireSub>('live');
  const [hostSub, setHostSub] = useState<HostSub>('upcoming');
  const [pitchSub, setPitchSub] = useState<PitchSub>('sent');

  // ── Hiring rows (gigs — surface applicants) ───────────────────────────────
  const hiringRow = (p: PostRow, sub: HireSub) => {
    const pill: { label: string; tone: PillTone } =
      sub === 'live' ? { label: 'Live', tone: 'green' }
      : sub === 'draft' ? { label: 'Draft', tone: 'muted' }
      : { label: 'Closed', tone: 'muted' };
    const showCount = sub !== 'draft';
    return (
      <Row
        key={p.id}
        title={p.title}
        initial={initialOf(p.title)}
        kind="gig"
        pill={pill}
        meta={metaLine(p)}
        right={showCount ? String(p.applicants ?? 0) : undefined}
        rightSub={showCount ? 'APPLICANTS' : undefined}
        muted={sub !== 'live'}
        onPress={() =>
          router.push((sub === 'draft' ? p.href : `${p.href}?tab=applicants`) as any)
        }
      />
    );
  };

  // ── Hosting rows (events — surface registrations) ─────────────────────────
  const hostingRow = (p: PostRow, sub: HostSub) => {
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
        onPress={() => router.push(p.href as any)}
      />
    );
  };

  // ── Pitching rows (proposals to client briefs — surface ₹) ────────────────
  const pitchRow = (p: SentProposal, sub: PitchSub) => {
    const pill: { label: string; tone: PillTone } =
      sub === 'won' ? { label: 'Won', tone: 'green' }
      : sub === 'closed' ? { label: 'Closed', tone: 'muted' }
      : p.status === 'viewed' ? { label: 'Viewed', tone: 'gold' }
      : { label: 'Sent', tone: 'muted' };
    const title = p.requirement?.title || p.requirement?.occasionText || 'Client brief';
    const amount = p.quoteAmount ?? p.requirement?.budgetMax ?? p.requirement?.budgetMin ?? null;
    const meta = [p.requirement?.clientSnapshot?.displayName, p.requirement?.city]
      .filter(Boolean)
      .join(' · ')
      .toUpperCase();
    return (
      <Row
        key={p._id}
        title={title}
        initial={initialOf(title)}
        kind="gig"
        pill={pill}
        meta={meta}
        right={fmtRupees(amount)}
        muted={sub === 'closed'}
        onPress={() => router.push('/requirements' as any)}
      />
    );
  };

  let subtabs: React.ReactNode = null;
  let rows: React.ReactNode = null;
  let hasItems = false;
  let seeLabel = '';
  let seeHref = '/posts';

  if (face === 'hiring') {
    const g = inv.hiring;
    const items = g[hireSub];
    hasItems = items.length > 0;
    seeLabel = `SEE ALL ${hireSub.toUpperCase()}`;
    seeHref = '/posts';
    subtabs = (
      <SubTabs
        value={hireSub}
        onChange={setHireSub}
        options={[
          { key: 'live', label: 'Live', count: g.live.length },
          { key: 'draft', label: 'Draft', count: g.draft.length },
          { key: 'closed', label: 'Closed', count: g.closed.length },
        ]}
      />
    );
    rows = hasItems ? (
      items.slice(0, LIMIT).map((p) => hiringRow(p, hireSub))
    ) : (
      <EmptyState copy="No gigs here yet." cta="Post a gig" onPress={() => router.push('/(app)/create?initialTab=gig' as any)} />
    );
  } else if (face === 'hosting') {
    const e = inv.hosting;
    const items = e[hostSub];
    hasItems = items.length > 0;
    seeLabel = `SEE ALL ${hostSub.toUpperCase()}`;
    seeHref = '/posts';
    subtabs = (
      <SubTabs
        value={hostSub}
        onChange={setHostSub}
        options={[
          { key: 'upcoming', label: 'Upcoming', count: e.upcoming.length },
          { key: 'draft', label: 'Draft', count: e.draft.length },
          { key: 'past', label: 'Past', count: e.past.length },
        ]}
      />
    );
    rows = hasItems ? (
      items.slice(0, LIMIT).map((p) => hostingRow(p, hostSub))
    ) : (
      <EmptyState copy="Nothing scheduled." cta="Create event" onPress={() => router.push('/(app)/create?initialTab=event' as any)} />
    );
  } else {
    const pt = inv.pitching;
    const items = pt[pitchSub];
    hasItems = items.length > 0;
    seeLabel = `SEE ALL ${pitchSub.toUpperCase()}`;
    seeHref = '/requirements';
    subtabs = (
      <SubTabs
        value={pitchSub}
        onChange={setPitchSub}
        options={[
          { key: 'sent', label: 'Sent', count: pt.sent.length },
          { key: 'won', label: 'Won', count: pt.won.length },
          { key: 'closed', label: 'Closed', count: pt.closed.length },
        ]}
      />
    );
    rows = hasItems ? (
      items.slice(0, LIMIT).map((p) => pitchRow(p, pitchSub))
    ) : (
      <EmptyState copy="No pitches yet." cta="Browse briefs" onPress={() => router.push('/requirements' as any)} />
    );
  }

  return (
    <View style={styles.root}>
      <SectionTitle>Your work</SectionTitle>
      <SegTabs
        value={face}
        onChange={setFace}
        options={[
          { key: 'hiring', label: 'Hiring' },
          { key: 'hosting', label: 'Hosting' },
          { key: 'pitching', label: 'Pitching' },
        ]}
      />
      {subtabs}
      {rows}
      {hasItems ? <SeeAll label={seeLabel} onPress={() => router.push(seeHref as any)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, marginTop: 4 },
});
