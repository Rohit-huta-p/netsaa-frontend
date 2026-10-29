// netsa-frontend/app/(app)/dashboard/cl-home.tsx
//
// Creative Lead home — the "Call Sheet", A·Minimal skin
// (DOCS/04-design/mockups/creative-lead-home-v2.html, locked 2026-10-29).
// The CL is the inverse of an artist (it posts and is applied to), so the
// sections mirror the artist home's grammar over organizer data:
//   1. CreativeLeadGreet      — company monogram + greeting + name + bell
//   2. CreativeLeadFocusCard  — "NEEDS YOU FIRST" (applicants nudge / all-clear)
//   3. CreativeLeadWork       — Hiring · Hosting · Pitching (tabbed)
// (Discover rail, company-completeness card and the ＋Post dial land in a
// follow-up; create today still runs through the existing Post FAB.)

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useBottomNavScroll, NAV_SCROLL_EVENT_THROTTLE } from '@/components/nav/navVisibility';

import CreativeLeadGreet from '@/components/dashboard/creativeLead/home/CreativeLeadGreet';
import CreativeLeadFocusCard from '@/components/dashboard/creativeLead/home/CreativeLeadFocusCard';
import CreativeLeadWork from '@/components/dashboard/creativeLead/home/CreativeLeadWork';
import { HC, HF } from '@/components/dashboard/artist/home/ui';

export default function CreativeLeadHome() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
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
        <CreativeLeadGreet />
        <CreativeLeadFocusCard />

        <View style={styles.divider} />

        <CreativeLeadWork />

        <View style={styles.footer}>
          <View style={styles.footerRule} />
          <Text style={styles.footerCaption}>THAT’S THE CALL</Text>
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
