// app/(app)/dashboard/cl-work.tsx
//
// Creative Lead "Your work" — the full See-all page. Destination for every
// See-all in the CL home's Your work section; opens on the tapped face + sub
// (?face=&sub=), lists ALL rows (the home caps each sub at 3), and keeps the
// face tabs so the CL can switch without going back.
//
// Tabbed layout, locked: DOCS/04-design/mockups/creative-lead-your-work.html.
// Pitching is "Coming soon" for now — it pitches on CLIENT briefs, and the
// client side is deferred (so there is nothing to pitch on yet). Hiring and
// Hosting are fully built. Rows come from the shared clWorkRows renderers, so
// each row is identical to the home. Models the artist See-all (activity.tsx).

import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ArrowUpDown } from 'lucide-react-native';

import { HC, HF, SegTabs, SubTabs, EmptyState } from '@/components/dashboard/artist/home/ui';
import useCreativeLeadInvolvement from '@/components/dashboard/creativeLead/home/useCreativeLeadInvolvement';
import { hiringRow, hostingRow, type HireSub, type HostSub } from '@/components/dashboard/creativeLead/home/clWorkRows';
import PitchingComingSoon from '@/components/dashboard/creativeLead/home/PitchingComingSoon';

type Face = 'hiring' | 'hosting' | 'pitching';

const FACES: { key: Face; label: string }[] = [
  { key: 'hiring', label: 'Hiring' },
  { key: 'hosting', label: 'Hosting' },
  { key: 'pitching', label: 'Pitching' },
];

const HIRE_SUBS: HireSub[] = ['live', 'draft', 'closed'];
const HOST_SUBS: HostSub[] = ['upcoming', 'draft', 'past'];
const LABEL: Record<string, string> = {
  live: 'Live', draft: 'Draft', closed: 'Closed', upcoming: 'Upcoming', past: 'Past',
};

/** The italic serif line under the title — a quiet state read per face (mockup .eyebrow). */
function faceLine(face: Face, total: number): string {
  if (face === 'hiring') return total ? `${total} ${total === 1 ? 'role' : 'roles'}, out in the world.` : 'No roles out yet.';
  if (face === 'hosting') return total ? `${total} ${total === 1 ? 'event' : 'events'} on your calendar.` : 'No events on your calendar yet.';
  return 'Pitching for client work is coming soon.';
}

function SortBar({ count, sort, onToggle }: { count: number; sort: 'newest' | 'oldest'; onToggle: () => void }) {
  return (
    <View style={styles.fbar}>
      <Text style={styles.fcount}>{count} RESULT{count === 1 ? '' : 'S'}</Text>
      <Pressable onPress={onToggle} style={styles.sortbtn} hitSlop={8} accessibilityRole="button">
        <ArrowUpDown size={13} color={HC.t2} />
        <Text style={styles.sortTxt}>{sort === 'newest' ? 'NEWEST' : 'OLDEST'}</Text>
      </Pressable>
    </View>
  );
}

export default function CreativeLeadWorkPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ face?: string; sub?: string }>();
  const inv = useCreativeLeadInvolvement();

  const initialFace: Face = (['hiring', 'hosting', 'pitching'].includes(String(params.face)) ? params.face : 'hiring') as Face;
  const [face, setFace] = useState<Face>(initialFace);
  const [hireSub, setHireSub] = useState<HireSub>(
    initialFace === 'hiring' && HIRE_SUBS.includes(params.sub as HireSub) ? (params.sub as HireSub) : 'live',
  );
  const [hostSub, setHostSub] = useState<HostSub>(
    initialFace === 'hosting' && HOST_SUBS.includes(params.sub as HostSub) ? (params.sub as HostSub) : 'upcoming',
  );
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const toggleSort = () => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'));

  // The involvement lists arrive newest-first from the API; "Oldest" just reverses
  // (a cosmetic flip — the rows carry no sortable timestamp yet).
  const ordered = <T,>(arr: T[]): T[] => (sort === 'oldest' ? [...arr].reverse() : arr);

  const faceTotal = useMemo(() => {
    if (face === 'hiring') return inv.hiring.live.length + inv.hiring.draft.length + inv.hiring.closed.length;
    if (face === 'hosting') return inv.hosting.upcoming.length + inv.hosting.draft.length + inv.hosting.past.length;
    return 0;
  }, [face, inv]);

  let body: React.ReactNode = null;
  if (face === 'pitching') {
    body = <PitchingComingSoon />;
  } else if (face === 'hiring') {
    const items = inv.hiring[hireSub];
    body = (
      <>
        <SubTabs value={hireSub} onChange={setHireSub} options={HIRE_SUBS.map((k) => ({ key: k, label: LABEL[k], count: inv.hiring[k].length }))} />
        {items.length > 0 ? (
          <>
            <SortBar count={items.length} sort={sort} onToggle={toggleSort} />
            {ordered(items).map((p) => hiringRow(p, hireSub, { newByGig: inv.newByGig, router }))}
          </>
        ) : (
          <EmptyState copy="No gigs here yet." cta="Post a gig" onPress={() => router.push('/(app)/create?initialTab=gig' as any)} />
        )}
      </>
    );
  } else {
    const items = inv.hosting[hostSub];
    body = (
      <>
        <SubTabs value={hostSub} onChange={setHostSub} options={HOST_SUBS.map((k) => ({ key: k, label: LABEL[k], count: inv.hosting[k].length }))} />
        {items.length > 0 ? (
          <>
            <SortBar count={items.length} sort={sort} onToggle={toggleSort} />
            {ordered(items).map((p) => hostingRow(p, hostSub, { router }))}
          </>
        ) : (
          <EmptyState copy="Nothing scheduled." cta="Create event" onPress={() => router.push('/(app)/create?initialTab=event' as any)} />
        )}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={20} color={HC.t2} />
        </Pressable>
        <Text style={styles.title}>Your work</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.faceLine}>{faceLine(face, faceTotal)}</Text>

        <SegTabs value={face} onChange={(k) => setFace(k as Face)} options={FACES} />

        {body}

        <View style={styles.frule} />
        <Text style={styles.fcap}>THAT’S EVERYTHING</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HC.canvas },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: HC.hair, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: HF.serif, fontSize: 25, letterSpacing: -0.6, color: HC.cream },

  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  faceLine: { fontFamily: HF.serif, fontStyle: 'italic', fontSize: 12.5, color: HC.t3, marginTop: 2, marginBottom: 14 },

  fbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 2 },
  fcount: { fontFamily: HF.mono, fontSize: 9.5, letterSpacing: 0.8, color: HC.t2 },
  sortbtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sortTxt: { fontFamily: HF.mono, fontSize: 9.5, letterSpacing: 0.8, color: HC.t1 },

  frule: { height: 1, backgroundColor: HC.hairSoft, marginTop: 28 },
  fcap: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 2, color: HC.t3, textAlign: 'center', textTransform: 'uppercase', paddingTop: 14 },
});
