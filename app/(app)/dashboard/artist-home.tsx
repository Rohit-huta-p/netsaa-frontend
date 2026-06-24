// netsa-mobile/app/(app)/dashboard/artist-home.tsx
//
// Final assembly for the redesigned artist home (DOCS/designs/artist-home-v1.html,
// locked 2026-05-18). Mirrors the hirer-home editorial pattern with artist-side
// lenses + a floating inbox FAB.
//
// Section order:
//   1. HeroGreetingArtistV2  — slim hero (avatar + greeting + name + trust pill)
//   2. ByTheNumbersArtist    — KPI grid (earnings / views / applications / delivered / endorsements)
//   3. TodayQueueArtist      — action queue (hidden when empty)
//   4. YourStageArtist       — GIGS / EVENTS toggle with sub-tabs
//   5. ForYouMatchStrip      — horizontal carousel, mixed gigs+events
//   6. DiscoverHirersStrip   — curated hirers near you
//   7. Editorial footer
//   FAB. FloatingInboxFab    — rendered outside ScrollView so it floats
//
// Pull-to-refresh invalidates every queryKeys.artist.* key plus the shared
// hero / conversations / contracts keys also touched by the hirer dashboard,
// so a mode switch shows fresh data on either side.
//
// Replaces the Plan-2 era assembly (HeroGreeting + UpcomingSection +
// AppliedSection + SavedSection + DraftsSection + TrustTierProgress +
// MessagesPreview + PlaceholderCards). The old components remain in
// src/components/dashboard/artist/ for fast revert during rollout.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, Mail } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../src/stores/authStore';
import { inviteService } from '../../../src/services/inviteService';

import ScreenTooltip from '../../../src/components/mode/ScreenTooltip';
import { queryKeys } from '../../../src/constants/queryKeys';

import HeroGreetingArtistV2 from '../../../src/components/dashboard/artist/HeroGreetingArtistV2';
import ByTheNumbersArtist from '../../../src/components/dashboard/artist/ByTheNumbersArtist';
import TodayQueueArtist from '../../../src/components/dashboard/artist/TodayQueueArtist';
import YourStageArtist from '../../../src/components/dashboard/artist/YourStageArtist';
import ForYouMatchStrip from '../../../src/components/dashboard/artist/ForYouMatchStrip';
import DiscoverMatchesStrip from '../../../src/components/dashboard/artist/DiscoverMatchesStrip';
import FloatingInboxFab from '../../../src/components/dashboard/artist/FloatingInboxFab';

export default function ArtistHome() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [refreshing, setRefreshing] = useState(false);

  // Invites badge — count pending (sent|viewed) invites
  const { data: receivedInvites = [] } = useQuery({
    queryKey: ['invites', 'received'],
    queryFn: inviteService.received,
  });
  const pendingInviteCount = (receivedInvites as any[]).filter(
    (inv) => inv.status === 'sent' || inv.status === 'viewed',
  ).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        // Artist namespace
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.hero() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.applications() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.upcoming() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedGigs() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.savedEvents() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.conversations() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artist.contracts() }),
        // Shared reads — hirer home consumes the same hero / contracts cache.
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
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
      >
        <HeroGreetingArtistV2 />

        <ByTheNumbersArtist />

        <TodayQueueArtist />

        {/* Invites entry card — visible for artists and CLs who can receive client invites */}
        <Pressable
          onPress={() => router.push('/(app)/invites' as any)}
          style={styles.invitesCard}
        >
          <View style={styles.invitesIconWrap}>
            <Mail size={18} color="#A78BFA" />
          </View>
          <View style={styles.clCardText}>
            <Text style={styles.invitesCardTitle}>Invites</Text>
            <Text style={styles.clCardSub}>See clients who want to work with you</Text>
          </View>
          {pendingInviteCount > 0 && (
            <View style={styles.invitesBadge}>
              <Text style={styles.invitesBadgeText}>{pendingInviteCount}</Text>
            </View>
          )}
        </Pressable>

        <YourStageArtist />

        {/* CL-only: entry card to the client requirements feed.
            Artists must not see this — server 403s them anyway, but we
            hide the door so the home stays clean for pure Artists. */}
        {role === 'creative_lead' && (
          <Pressable
            onPress={() => router.push('/(app)/requirements' as any)}
            style={styles.clCard}
          >
            <View style={styles.clCardIconWrap}>
              <Briefcase size={18} color="#FF6B35" />
            </View>
            <View style={styles.clCardText}>
              <Text style={styles.clCardTitle}>Client requirements</Text>
              <Text style={styles.clCardSub}>Win client work — see what clients are looking for</Text>
            </View>
          </Pressable>
        )}

        <ForYouMatchStrip />

        <DiscoverMatchesStrip />

        {/* Editorial footer */}
        <View style={styles.footer}>
          <View style={styles.footerRule} />
          <Text style={styles.footerCaption}>THE STAGE IS YOURS</Text>
        </View>
      </ScrollView>

      <FloatingInboxFab />

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
  // Invites entry card — both artists and CLs
  invitesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    backgroundColor: 'rgba(167,139,250,0.06)',
  },
  invitesIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(167,139,250,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invitesCardTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F4F4F5',
    marginBottom: 2,
  },
  invitesBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  invitesBadgeText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: '#1A0D06',
  },
  // CL requirements entry card — only rendered when role === 'creative_lead'
  clCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    backgroundColor: 'rgba(255,107,53,0.06)',
  },
  clCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clCardText: { flex: 1 },
  clCardTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F4F4F5',
    marginBottom: 2,
  },
  clCardSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#71717a',
    lineHeight: 16,
  },
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
