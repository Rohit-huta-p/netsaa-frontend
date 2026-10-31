// src/components/dashboard/creativeLead/home/CreativeLeadWork.tsx
//
// Section 3 — "Your work". Three primary faces (the CL's two sides):
//   Hiring   → Live · Draft · Closed      (rows show applicants — the inversion)
//   Hosting  → Upcoming · Draft · Past     (rows show registrations)
//   Pitching → Coming soon                 (bids on CLIENT briefs; the client side
//                                            is deferred, so nothing to pitch on yet)
// Hiring/Hosting show up to 3 rows + a See-all into the full page
// (dashboard/cl-work) via ?face=&sub=. Rows render through the shared clWorkRows
// helpers so they're identical on the See-all page.

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SegTabs, SubTabs, SeeAll, EmptyState, HC, HF } from '@/components/dashboard/artist/home/ui';
import useCreativeLeadInvolvement from './useCreativeLeadInvolvement';
import { hiringRow, hostingRow } from './clWorkRows';
import PitchingComingSoon from './PitchingComingSoon';
import PostDial from './PostDial';

type Face = 'hiring' | 'hosting' | 'pitching';
type HireSub = 'live' | 'draft' | 'closed';
type HostSub = 'upcoming' | 'draft' | 'past';

const LIMIT = 3;

export default function CreativeLeadWork() {
  const router = useRouter();
  const inv = useCreativeLeadInvolvement();

  const [face, setFace] = useState<Face>('hiring');
  const [hireSub, setHireSub] = useState<HireSub>('live');
  const [hostSub, setHostSub] = useState<HostSub>('upcoming');

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
    // Pitching bids on CLIENT briefs; the client side is deferred, so there's
    // nothing to pitch on yet — "coming soon" (matches the See-all page). Restore
    // the Sent/Won/Closed rows (clWorkRows.pitchRow) when the client side ships.
    rows = <PitchingComingSoon />;
  }

  // See-all only shows for Hiring/Hosting (Pitching is coming-soon); it opens the
  // full page on the tapped face + current status.
  const seeAllHref = () => {
    const sub = face === 'hiring' ? hireSub : hostSub;
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
