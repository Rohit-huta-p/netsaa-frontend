// netsa-frontend/app/(app)/dashboard/artist-home.tsx
//
// Artist home — simplified, A·Minimal skin "A"
// (DOCS/04-design/mockups/artist-home-final.html, locked 2026-10-18).
// Three sections on the #121216 canvas:
//   1. ArtistGreet        — avatar + greeting + name + notifications
//   2. ArtistDiscover     — Gigs / Events swipeable card rail (4 + See all)
//   3. ArtistWhatYoureIn  — Gigs (Applied/Hired/Saved) · Events (Registered/Saved/Past)
//
// Dropped from the old v3 home: the By-the-numbers stat grid, the "next up"
// hero card, and the stale "switch between Artist and Hirer" tooltip (there is
// no mode toggle under the three-role model).

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useBottomNavScroll, NAV_SCROLL_EVENT_THROTTLE } from '@/components/nav/navVisibility';
import { useQueryClient } from '@tanstack/react-query';

import ArtistGreet from '../../../src/components/dashboard/artist/home/ArtistGreet';
import ArtistDiscover from '../../../src/components/dashboard/artist/home/ArtistDiscover';
import ArtistWhatYoureIn from '../../../src/components/dashboard/artist/home/ArtistWhatYoureIn';
import { HC, HF } from '../../../src/components/dashboard/artist/home/ui';

export default function ArtistHome() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refetch the home's active queries (hero, discover, applications,
      // upcoming, saved). Broad invalidate keeps this resilient to the exact
      // query keys each hook uses.
      await queryClient.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const onNavScroll = useBottomNavScroll();

  return (
    <SafeAreaView style={styles.root}>
      <Animated.ScrollView
        onScroll={onNavScroll}
        scrollEventThrottle={NAV_SCROLL_EVENT_THROTTLE}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={HC.orange} colors={[HC.orange]} />
        }
      >
        <ArtistGreet />
        <ArtistDiscover />

        <View style={styles.divider} />

        <ArtistWhatYoureIn />

        <View style={styles.footer}>
          <View style={styles.footerRule} />
          <Text style={styles.footerCaption}>THE STAGE IS YOURS</Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HC.canvas },
  scroll: { paddingBottom: 140 },
  divider: { height: 1, backgroundColor: HC.hair, marginHorizontal: 20, marginTop: 28 },
  footer: { alignItems: 'center', paddingTop: 30, paddingBottom: 40, paddingHorizontal: 24 },
  footerRule: { height: 1, width: '34%', backgroundColor: HC.hair, marginBottom: 13 },
  footerCaption: { fontSize: 9, letterSpacing: 2, color: HC.t4, fontFamily: HF.bold },
});
