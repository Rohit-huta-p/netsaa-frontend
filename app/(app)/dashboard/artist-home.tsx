// netsa-frontend/app/(app)/dashboard/artist-home.tsx
//
// Artist home — Design System v3 / "Event-detail" language
// (DOCS/04-design/mockups/artist-home-redesign.html). Near-black canvas, warm
// cream ink, one held-back orange accent, gridlined stat grid, eyebrow-labelled
// sections. No dark-on-dark camouflage (v3 P9).
//
// Section order:
//   1. HeroGreetingArtistV2  — slim hero (avatar + greeting + name)
//   2. ByTheNumbersArtist    — gridlined Earnings + Profile Views
//   3. YourStageArtist       — "What you're in" — gigs/events toggle + sub-tabs
//   4. DiscoverMatchesStrip  — curated gigs/events near you
//   5. Editorial footer
//
// Removed in this redesign: the "New" trust tag, the "BY THE NUMBERS" header,
// and the "For Creative Leads", "For You", "Invitations", and "How it works"
// sections.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import ScreenTooltip from '../../../src/components/mode/ScreenTooltip';
import { queryKeys } from '../../../src/constants/queryKeys';

import HeroGreetingArtistV2 from '../../../src/components/dashboard/artist/HeroGreetingArtistV2';
import ByTheNumbersArtist from '../../../src/components/dashboard/artist/ByTheNumbersArtist';
import YourStageArtist from '../../../src/components/dashboard/artist/YourStageArtist';
import DiscoverMatchesStrip from '../../../src/components/dashboard/artist/DiscoverMatchesStrip';

export default function ArtistHome() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.hero() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.earnings() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.profileViews() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.applications() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.upcoming() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedGigs() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedEvents() }),
        // Shared read — hirer home consumes the same hero cache.
        queryClient.invalidateQueries({ queryKey: queryKeys.hirer.hero() }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        }
      >
        <HeroGreetingArtistV2 />

        <ByTheNumbersArtist />

        <YourStageArtist />

        <DiscoverMatchesStrip />

        {/* Editorial footer */}
        <View style={styles.footer}>
          <View style={styles.footerRule} />
          <Text style={styles.footerCaption}>THE STAGE IS YOURS</Text>
        </View>
      </ScrollView>

      <ScreenTooltip
        screenId="home-toggle"
        anchorTop={110}
        anchorRight={80}
        copy="NETSA has two modes. Tap the pill above to switch between Artist and Hirer."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0A0F' },
  scroll: { paddingTop: 8, paddingBottom: 140 },

  footer: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  footerRule: {
    height: 1,
    width: '38%',
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginBottom: 13,
  },
  footerCaption: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#57524C',
    fontFamily: 'Outfit-Bold',
  },
});
