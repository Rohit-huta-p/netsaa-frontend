// netsa-mobile/app/(app)/dashboard/hirer-home.tsx
//
// Plan §7 step 9 — final assembly. Section order matches
// DOCS/designs/hirer-home-v1.html. Pull-to-refresh invalidates every
// queryKeys.hirer.* key plus the shared artist.hero / artist.conversations
// / artist.contracts keys that hirer hooks piggyback on.

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

// ─── Active sections ───
import EditorialHeroHirer from '../../../src/components/dashboard/hirer/EditorialHeroHirer';
import TrustAnchorCard from '../../../src/components/dashboard/hirer/TrustAnchorCard';
import ActionQueueTile from '../../../src/components/dashboard/hirer/ActionQueueTile';
import YourPostsSection from '../../../src/components/dashboard/hirer/YourPostsSection';
import MatchForYourGigsStrip from '../../../src/components/dashboard/hirer/MatchForYourGigsStrip';

// ─── Replaced / removed (kept commented for fast revert during rollout) ───
// import DispatchSection from '../../../src/components/dashboard/hirer/DispatchSection';
// import HeroGreetingHirer from '../../../src/components/dashboard/hirer/HeroGreetingHirer';
// import PostedGigsSection from '../../../src/components/dashboard/hirer/PostedGigsSection';
// import ApplicantsInbox from '../../../src/components/dashboard/hirer/ApplicantsInbox';
// import PaymentsStrip from '../../../src/components/dashboard/hirer/PaymentsStrip';
// import TrustTierProgress from '../../../src/components/dashboard/artist/TrustTierProgress';
// import MessagesPreview from '../../../src/components/dashboard/artist/MessagesPreview';
// import PlaceholderCard from '../../../src/components/dashboard/PlaceholderCard';
// import NextUpCardHirer from '../../../src/components/dashboard/hirer/NextUpCardHirer';
// import HiredArtistsSection from '../../../src/components/dashboard/hirer/HiredArtistsSection';
// import ContractsYouSentStrip from '../../../src/components/dashboard/hirer/ContractsYouSentStrip';

export default function HirerHome() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        // Hirer namespace
        queryClient.invalidateQueries({ queryKey: queryKeys.hirer.hero() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hirer.postedGigs() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hirer.applicants() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hirer.hiredArtists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hirer.contracts() }),
        // Shared reads — same hero + conversations + contracts cache used by
        // the artist dashboard. Refresh both so a mode switch shows current data.
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.hero() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.conversations() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.contracts() }),
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
        {/* Order matches DOCS/designs/hirer-home-v1.html.
            Sections own their own gutter (paddingHorizontal: 24) so the
            scroll container stays flush at 0. */}

        <EditorialHeroHirer />

        <TrustAnchorCard />

        <ActionQueueTile />

        <YourPostsSection />

        {/* Match strip — plan §6.6. Standalone for now; folds into
            ByTheNumbersSection (§6.5) when that section ships. */}
        <View style={styles.matchWrap}>
          <MatchForYourGigsStrip />
        </View>

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
  root: { flex: 1, backgroundColor: '#060509' },
  scroll: { paddingTop: 8, paddingBottom: 140 },
  matchWrap: { paddingHorizontal: 24, paddingBottom: 32 },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  footerRule: {
    height: 1,
    width: '40%',
    backgroundColor: 'rgba(243,239,232,0.14)',
    marginBottom: 16,
  },
  footerCaption: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#3F3D4A',
    fontFamily: 'Outfit-Bold',
  },
});
