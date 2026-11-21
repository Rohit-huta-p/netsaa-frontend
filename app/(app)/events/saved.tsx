// app/(app)/events/saved.tsx
//
// "Your events" — the current user's GOING (registered) + SAVED + PAST events,
// reached from the bookmark button on the events board (events/index.tsx). This is
// role-agnostic on purpose: a Creative Lead (who is an organizer but can also attend)
// — or anyone — who saves or registers for an event lands here. There was no surface
// for a CL's attended/saved events before this.
//
// Reuses the artist home's involvement machinery, whose data is keyed by the current
// user (not artist-gated): `useArtistInvolvement` buckets (registered / savedEvents /
// past) + the shared `InvolvementList` renderer, so these rows and empty states can't
// drift from the artist "What you're in → Events" surface.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import AppScrollView from '@/components/AppScrollView';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { SubTabs, HC, HF } from '@/components/dashboard/artist/home/ui';
import useArtistInvolvement from '@/components/dashboard/artist/home/useArtistInvolvement';
import { InvolvementList } from '@/components/dashboard/artist/home/InvolvementList';

type EventSub = 'registered' | 'saved' | 'past';

export default function SavedEventsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sub?: string }>();
  const initial: EventSub = params.sub === 'saved' || params.sub === 'past' ? params.sub : 'registered';
  const [sub, setSub] = useState<EventSub>(initial);
  const inv = useArtistInvolvement();
  const tabBarHeight = useMobileTabBarHeight();

  return (
    <View style={{ flex: 1, backgroundColor: HC.canvas }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <AppScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <View style={styles.head}>
              <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back} accessibilityLabel="Back">
                <ChevronLeft size={22} color={HC.t1} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>YOUR EVENTS</Text>
                <Text style={styles.title}>Saved & going</Text>
              </View>
            </View>

            <SubTabs
              value={sub}
              onChange={setSub}
              options={[
                { key: 'registered', label: 'Going', count: inv.registered.length },
                { key: 'saved', label: 'Saved', count: inv.savedEvents.length },
                { key: 'past', label: 'Past', count: inv.past.length },
              ]}
            />

            <InvolvementList inv={inv} primary="events" sub={sub} />
          </View>
        </AppScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 12, maxWidth: 680, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, marginBottom: 12 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  eyebrow: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 2, color: HC.t3 },
  title: { fontFamily: HF.serif, fontSize: 26, letterSpacing: -0.4, color: HC.cream, marginTop: 5 },
});
