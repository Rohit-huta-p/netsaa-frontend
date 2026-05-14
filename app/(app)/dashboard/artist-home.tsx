// netsa-mobile/app/(app)/dashboard/artist-home.tsx
//
// Plan 2 assembly point. Renders 9 real sections + 3 placeholder cards in
// spec §4.1 order. Pull-to-refresh invalidates every queryKeys.artist.* key.
//
// Sections are self-sufficient (each owns its data hook) except HeroGreeting
// which takes `user` + `isLoading` as props so the header and trust-tier card
// can both consume the same cached query without re-rendering gymnastics.

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

// ModeToggle moved into Navbar profile dropdown — no longer rendered on dashboard.
import ScreenTooltip from '../../../src/components/mode/ScreenTooltip';

import useHeroData from '../../../src/hooks/useHeroData';
import { queryKeys } from '../../../src/constants/queryKeys';

import HeroGreeting from '../../../src/components/dashboard/artist/HeroGreeting';
// CONTRACTS-DISABLED: NextUpCard's primary "open contract" CTA is moot
// without contract artifacts. ContractsStrip shows nothing when total=0
// (which it always will be while contract creation is rolled back).
// Imports retained for fast revert.
// import NextUpCard from '../../../src/components/dashboard/artist/NextUpCard';
import UpcomingSection from '../../../src/components/dashboard/artist/UpcomingSection';
import AppliedSection from '../../../src/components/dashboard/artist/AppliedSection';
import SavedSection from '../../../src/components/dashboard/artist/SavedSection';
import DraftsSection from '../../../src/components/dashboard/artist/DraftsSection';
// import ContractsStrip from '../../../src/components/dashboard/artist/ContractsStrip';
// PAYMENTS-DISABLED: PaymentsToConfirmStrip hidden until on-platform Razorpay ships.
// Restore by uncommenting this import + the mount below.
// import PaymentsToConfirmStrip from '../../../src/components/dashboard/artist/PaymentsToConfirmStrip';
import TrustTierProgress from '../../../src/components/dashboard/artist/TrustTierProgress';
import MessagesPreview from '../../../src/components/dashboard/artist/MessagesPreview';
import PlaceholderCard from '../../../src/components/dashboard/PlaceholderCard';

export default function ArtistHome() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useHeroData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Invalidate every artist-home query key. Individual hooks refetch in parallel.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.hero() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.applications() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.upcoming() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedGigs() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedEvents() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.contracts() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.conversations() }),
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
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
      >

        {/* Spec §4.1 order. NextUpCard returns null when neither a pending
            contract nor a hired gig exists. ContractsStrip returns null when
            total=0. Both suppress their own placeholder so layout stays tight. */}

        <HeroGreeting user={user} isLoading={isUserLoading} />

        {/* CONTRACTS-DISABLED: NextUpCard + ContractsStrip hidden until contract artifact restored. */}
        {/* <NextUpCard /> */}

        <UpcomingSection />

        {/* PAYMENTS-DISABLED: <PaymentsToConfirmStrip /> */}

        <AppliedSection />

        <SavedSection />

        <DraftsSection />

        {/* <ContractsStrip /> */}

        <TrustTierProgress />

        <PlaceholderCard
          title="Sub-artist offers"
          subtitle="Lead-artist team features coming in Plan 4"
        />

        <PlaceholderCard
          title="Reviews received"
          subtitle="Reviews from hirers will appear here after your first completed gig"
        />

        <PlaceholderCard
          title="Profile views"
          subtitle="Analytics coming soon"
        />

        <MessagesPreview />
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
  root: { flex: 1, backgroundColor: '#050505' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 140 },
  header: { marginBottom: 16, paddingHorizontal: 4 },
  wordmark: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#F5F0EB',
    letterSpacing: 2,
  },
});
