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

// HeroGreetingHirer replaced by EditorialHeroHirer (plan §6.1, §7 step 2).
// Old import retained commented for fast revert during the redesign rollout.
// import HeroGreetingHirer from '../../../src/components/dashboard/hirer/HeroGreetingHirer';
import EditorialHeroHirer from '../../../src/components/dashboard/hirer/EditorialHeroHirer';
import DispatchSection from '../../../src/components/dashboard/hirer/DispatchSection';
import MatchForYourGigsStrip from '../../../src/components/dashboard/hirer/MatchForYourGigsStrip';
import TrustAnchorCard from '../../../src/components/dashboard/hirer/TrustAnchorCard';
// CONTRACTS-DISABLED: NextUpCardHirer + ContractsYouSentStrip pull from
// the contracts collection which we no longer write to. Imports retained
// for fast revert when the contract artifact is restored.
// import NextUpCardHirer from '../../../src/components/dashboard/hirer/NextUpCardHirer';
// PostedGigsSection replaced by YourPostsSection on the hirer home.
// Old import retained commented for fast revert during rollout.
// import PostedGigsSection from '../../../src/components/dashboard/hirer/PostedGigsSection';
import YourPostsSection from '../../../src/components/dashboard/hirer/YourPostsSection';
// ApplicantsInbox + PaymentsStrip consolidated into ActionQueueTile on the
// hirer home (plan §6.3). Old imports retained commented for fast revert.
// import ApplicantsInbox from '../../../src/components/dashboard/hirer/ApplicantsInbox';
import ActionQueueTile from '../../../src/components/dashboard/hirer/ActionQueueTile';
// Apr 30: HiredArtistsSection removed from hirer home — team management
// lives on the per-gig Hub now (Your team section). Import retained for
// fast revert.
// import HiredArtistsSection from '../../../src/components/dashboard/hirer/HiredArtistsSection';
// import ContractsYouSentStrip from '../../../src/components/dashboard/hirer/ContractsYouSentStrip';
// import PaymentsStrip from '../../../src/components/dashboard/hirer/PaymentsStrip';
// TrustTierProgress replaced by TrustAnchorCard on the hirer home only.
// Artist home still uses TrustTierProgress directly; this import retained
// commented for fast revert during the redesign rollout.
// import TrustTierProgress from '../../../src/components/dashboard/artist/TrustTierProgress';
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

        <EditorialHeroHirer />

        {/* CONTRACTS-DISABLED: NextUpCardHirer + ContractsYouSentStrip hidden
            until contract artifact restored. */}
        {/* <NextUpCardHirer /> */}

        <YourPostsSection />

        <ActionQueueTile />

        {/* Apr 30: <HiredArtistsSection /> removed — team is per-gig on the Hub now. */}
        {/* <ContractsYouSentStrip /> */}
        {/* PaymentsStrip moved into ActionQueueTile (balance_due + refund_decision
            categories) once payment hooks ship. Stub PaymentsStrip currently
            renders nothing visible. */}

        <TrustAnchorCard />

        {/* Match strip — plan §6.6. Mock data v1 until Visibility Engine ships
            useRecommendedArtists. Will eventually live inside ByTheNumbersSection
            (plan §6.5) but stands alone for now. */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <MatchForYourGigsStrip />
        </View>

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

        {/* Dispatch — editorial city pulse, plan §6.7. Static content for v1
            until useCityPulse(city) hook ships. */}
        <DispatchSection />
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
