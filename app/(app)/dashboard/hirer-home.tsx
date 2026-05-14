// netsa-mobile/app/(app)/dashboard/hirer-home.tsx
//
// Plan 3 assembly point. Renders 9 real sections + 3 placeholder cards in
// spec §5.1 order. Pull-to-refresh invalidates every queryKeys.hirer.* key
// plus the shared artist.hero / artist.conversations / artist.contracts
// keys that hirer hooks piggyback on.

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

// ModeToggle moved into Navbar profile dropdown — no longer rendered on dashboard.
import ScreenTooltip from '../../../src/components/mode/ScreenTooltip';

import { queryKeys } from '../../../src/constants/queryKeys';

import HeroGreetingHirer from '../../../src/components/dashboard/hirer/HeroGreetingHirer';
// CONTRACTS-DISABLED: NextUpCardHirer + ContractsYouSentStrip pull from
// the contracts collection which we no longer write to. Imports retained
// for fast revert when the contract artifact is restored.
// import NextUpCardHirer from '../../../src/components/dashboard/hirer/NextUpCardHirer';
import PostedGigsSection from '../../../src/components/dashboard/hirer/PostedGigsSection';
import ApplicantsInbox from '../../../src/components/dashboard/hirer/ApplicantsInbox';
// Apr 30: HiredArtistsSection removed from hirer home — team management
// lives on the per-gig Hub now (Your team section). Import retained for
// fast revert.
// import HiredArtistsSection from '../../../src/components/dashboard/hirer/HiredArtistsSection';
// import ContractsYouSentStrip from '../../../src/components/dashboard/hirer/ContractsYouSentStrip';
import PaymentsStrip from '../../../src/components/dashboard/hirer/PaymentsStrip';
import TrustTierProgress from '../../../src/components/dashboard/artist/TrustTierProgress';
import MessagesPreview from '../../../src/components/dashboard/artist/MessagesPreview';
import PlaceholderCard from '../../../src/components/dashboard/PlaceholderCard';

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
        // the artist dashboard. useContractsArtist reads artist.contracts() while
        // useContractsHirer reads hirer.contracts(); both should refresh here so
        // switching modes after a pull shows up-to-date data on either side.
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
        {/* Spec §5.1 order. NextUpCardHirer returns null when no contract
            and no pending applicant. ContractsYouSentStrip returns null
            when total=0. Both suppress their own empty chrome so layout
            stays tight. */}

        <HeroGreetingHirer />

        {/* CONTRACTS-DISABLED: NextUpCardHirer + ContractsYouSentStrip hidden
            until contract artifact restored. */}
        {/* <NextUpCardHirer /> */}

        <PostedGigsSection />

        <ApplicantsInbox />

        {/* Apr 30: <HiredArtistsSection /> removed — team is per-gig on the Hub now. */}

        {/* <ContractsYouSentStrip /> */}

        <PaymentsStrip />

        <TrustTierProgress />

        <PlaceholderCard
          title="Reviews given"
          subtitle="Post-gig review prompts land after your first completed hire"
        />

        <PlaceholderCard
          title="Hiring analytics"
          subtitle="Time-to-fill, conversion, and trend charts coming in the analytics sprint"
        />

        <PlaceholderCard
          title="Team management"
          subtitle="Saved artists, rehire shortcuts, and My Team shortcuts coming in a later pass"
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
});
