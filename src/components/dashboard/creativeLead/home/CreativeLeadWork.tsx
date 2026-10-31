// src/components/dashboard/creativeLead/home/CreativeLeadWork.tsx
//
// Section 3 — "Your work". Three primary faces (the CL's two sides), each with
// sub-tabs; the home shows up to 3 rows + a See-all:
//   Hiring   → Live · Draft · Closed      (rows show applicants — the inversion)
//   Hosting  → Upcoming · Draft · Past     (rows show registrations)
//   Pitching → Sent · Won · Closed         (the CL's apply face; rows show ₹)
// Rows render through the shared clWorkRows helpers, so each row is identical
// on the full See-all page (dashboard/cl-work). See-all deep-links there with
// ?face=&sub= so the page opens on the tapped face + status.

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SegTabs, SubTabs, SeeAll, EmptyState, HC, HF } from '@/components/dashboard/artist/home/ui';
import useCreativeLeadInvolvement from './useCreativeLeadInvolvement';
import { hiringRow, hostingRow, pitchRow } from './clWorkRows';
import PostDial from './PostDial';

type Face = 'hiring' | 'hosting' | 'pitching';
type HireSub = 'live' | 'draft' | 'closed';
type HostSub = 'upcoming' | 'draft' | 'past';
type PitchSub = 'sent' | 'won' | 'closed';

const LIMIT = 3;

export default function CreativeLeadWork() {
  const router = useRouter();
  const inv = useCreativeLeadInvolvement();

  const [face, setFace] = useState<Face>('hiring');
  const [hireSub, setHireSub] = useState<HireSub>('live');
  const [hostSub, setHostSub] = useState<HostSub>('upcoming');
  const [pitchSub, setPitchSub] = useState<PitchSub>('sent');

  // ＋Post rides the focus-card state: hidden for a brand-new CL (the focus card
  // then carries the dual Post CTAs) and returns once applicants are waiting —
  // kept in lockstep with CreativeLeadFocusCard's all-clear condition so exactly
  // one create affordance ever shows.
  const liveApplicants = inv.hiring.live.reduce((a, g) => a + (g.applicants ?? 0), 0);
  const showPost = liveApplicants > 0;

  let subtabs: React.ReactNode = null;
  let rows: React.ReactNode = null;
  let hasItems = false;
  let seeLabel = '';

  if (face === 'hiring') {
    const g = inv.hiring;
    const items = g[hireSub];
    hasItems = items.length > 0;
    seeLabel = `SEE ALL ${hireSub.toUpperCase()}`;
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
      items.slice(0, LIMIT).map((p) => hiringRow(p, hireSub, { newByGig: inv.newByGig, router }))
    ) : (
      <EmptyState copy="No gigs here yet." cta="Post a gig" onPress={() => router.push('/(app)/create?initialTab=gig' as any)} />
    );
  } else if (face === 'hosting') {
    const e = inv.hosting;
    const items = e[hostSub];
    hasItems = items.length > 0;
    seeLabel = `SEE ALL ${hostSub.toUpperCase()}`;
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
      items.slice(0, LIMIT).map((p) => hostingRow(p, hostSub, { router }))
    ) : (
      <EmptyState copy="Nothing scheduled." cta="Create event" onPress={() => router.push('/(app)/create?initialTab=event' as any)} />
    );
  } else {
    const pt = inv.pitching;
    const items = pt[pitchSub];
    hasItems = items.length > 0;
    seeLabel = `SEE ALL ${pitchSub.toUpperCase()}`;
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
      items.slice(0, LIMIT).map((p) => pitchRow(p, pitchSub, { router }))
    ) : (
      <EmptyState copy="No pitches yet." cta="Browse briefs" onPress={() => router.push('/requirements' as any)} />
    );
  }

  // Every See-all opens the full page on the tapped face + current status.
  const seeAllHref = () => {
    const sub = face === 'hiring' ? hireSub : face === 'hosting' ? hostSub : pitchSub;
    return `/(app)/dashboard/cl-work?face=${face}&sub=${sub}`;
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your work</Text>
        {showPost ? <PostDial /> : null}
      </View>
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
      {hasItems ? <SeeAll label={seeLabel} onPress={() => router.push(seeAllHref() as any)} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, marginTop: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 13 },
  headerTitle: { fontFamily: HF.serif, fontSize: 24, letterSpacing: -0.5, color: HC.cream },
});
