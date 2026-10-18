// netsa-frontend/app/(app)/dashboard/activity.tsx
//
// "What you're in" — full page. The destination for every See-all in the artist
// home's What-you're-in section (artist-whatyourein-full.html, skin A). Opens on
// the tapped tab + sub-tab (?tab=&sub=), lists ALL items (home caps at 3), and
// keeps the same tabs so the artist can switch without going back.

import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { HC, HF, SegTabs, SubTabs } from '../../../src/components/dashboard/artist/home/ui';
import useArtistInvolvement from '../../../src/components/dashboard/artist/home/useArtistInvolvement';
import { InvolvementList, pickItems, Primary } from '../../../src/components/dashboard/artist/home/InvolvementList';

const GIG_SUBS: { key: string; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'hired', label: 'Hired' },
  { key: 'saved', label: 'Saved' },
];
const EVENT_SUBS: { key: string; label: string }[] = [
  { key: 'registered', label: 'Registered' },
  { key: 'saved', label: 'Saved' },
  { key: 'past', label: 'Past' },
];

export default function ActivityPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; sub?: string }>();

  const initialTab: Primary = params.tab === 'events' ? 'events' : 'gigs';
  const initialSub = String(params.sub ?? '');

  const [primary, setPrimary] = useState<Primary>(initialTab);
  const [gigSub, setGigSub] = useState<string>(
    initialTab === 'gigs' && ['applied', 'hired', 'saved'].includes(initialSub) ? initialSub : 'applied',
  );
  const [eventSub, setEventSub] = useState<string>(
    initialTab === 'events' && ['registered', 'saved', 'past'].includes(initialSub) ? initialSub : 'registered',
  );

  const inv = useArtistInvolvement();
  const sub = primary === 'gigs' ? gigSub : eventSub;
  const total = pickItems(inv, primary, sub).length;
  const countOf = (p: Primary, s: string) => pickItems(inv, p, s).length;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={20} color={HC.t2} />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>YOUR ACTIVITY</Text>
          <Text style={styles.title}>What you're in</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SegTabs
          value={primary}
          onChange={setPrimary}
          options={[
            { key: 'gigs', label: 'Gigs' },
            { key: 'events', label: 'Events' },
          ]}
        />

        {primary === 'gigs' ? (
          <SubTabs value={gigSub} onChange={setGigSub} options={GIG_SUBS.map((o) => ({ ...o, count: countOf('gigs', o.key) }))} />
        ) : (
          <SubTabs value={eventSub} onChange={setEventSub} options={EVENT_SUBS.map((o) => ({ ...o, count: countOf('events', o.key) }))} />
        )}

        {total > 0 ? <Text style={styles.count}>SHOWING ALL {total}</Text> : null}

        <InvolvementList inv={inv} primary={primary} sub={sub} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HC.canvas },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: HC.hair, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 1.4, color: HC.t3, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontFamily: HF.serif, fontSize: 20, letterSpacing: -0.3, color: HC.cream },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  count: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 1, color: HC.t4, textTransform: 'uppercase', paddingTop: 12, paddingBottom: 2 },
});
