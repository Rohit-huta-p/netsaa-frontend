/**
 * YourPostsSection — editorial card layout for the hirer home "Your posts" feed.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Your posts section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.4.
 * Architecture plan: ~/.gstack/projects/NETSA-React/ceo-plans/2026-05-16-your-posts-redesign.md.
 *
 * Now reads from useOrganizerPosts, which fans out parallel queries to
 * gigService.getOrganizerGigs and eventService.getOrganizerEvents,
 * normalizes both into PostRow[], and slices the top 5 by createdAt DESC.
 *
 * The pill color discriminates gig (orange) from event (purple). Tap routes
 * to the appropriate detail screen. Per-source error pill renders above the
 * card list when one source fails — the other source still renders cards.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  useOrganizerPosts,
  type PostRow,
} from '@/hooks/useOrganizerPosts';

type TabKey = 'active' | 'draft' | 'past';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Drafts' },
  { key: 'past', label: 'Past' },
];

function eyebrowForCount(n: number): string {
  if (n === 0) return 'Your stage is open. What do you want to bring to it?';
  if (n === 1) return 'One posting, alive in the world.';
  if (n < 20) {
    const words = [
      'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
      'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ];
    return `${words[n]} postings, alive in the world.`;
  }
  return `${n} postings, alive in the world.`;
}

function metaLineForRow(row: PostRow): React.ReactNode {
  if (row.kind === 'event' && row.seats) {
    const { taken, total } = row.seats;
    return (
      <Text style={styles.statText}>
        <Text style={styles.statText}>{taken} / {total}</Text>
        <Text style={styles.statTextMuted}> seats</Text>
      </Text>
    );
  }
  const applicants = row.applicants ?? 0;
  const views = row.views ?? 0;
  return (
    <Text style={styles.statText}>
      <Text style={styles.statText}>{applicants} {applicants === 1 ? 'applicant' : 'applicants'}</Text>
      <Text style={styles.statTextMuted}> · {views} {views === 1 ? 'view' : 'views'}</Text>
    </Text>
  );
}

export default function YourPostsSection() {
  const [tab, setTab] = useState<TabKey>('active');
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const { items, totalCount, isLoading, sourceErrors, refetch } = useOrganizerPosts(tab, 5);

  const eyebrow = useMemo(() => eyebrowForCount(items.length), [items.length]);
  const bothFailed = sourceErrors.gigs && sourceErrors.events;
  const partialFailure = (sourceErrors.gigs || sourceErrors.events) && !bothFailed;

  return (
    <View style={styles.section}>
      <View style={styles.headRow}>
        <Text style={styles.h2}>Your posts</Text>
        <Pressable
          onPress={() => router.push('/gigs?mine=1' as any)}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.manageLink}>Manage all →</Text>
        </Pressable>
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>

      <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel="Post status filter">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
              hitSlop={6}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {partialFailure && (
        <View style={styles.partialBanner}>
          <Text style={styles.partialBannerText}>
            Couldn't load {sourceErrors.gigs ? 'gigs' : 'events'}.{' '}
            <Text style={styles.partialBannerLink} onPress={() => refetch()}>Retry</Text>
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.cardSkeleton} accessibilityElementsHidden />
      ) : bothFailed ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Couldn't load your posts.</Text>
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.errorRetry}>Retry</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No {TABS.find((t) => t.key === tab)?.label.toLowerCase()} posts</Text>
          <Text style={styles.emptyBody}>
            {tab === 'draft'
              ? 'Drafts you save while composing land here.'
              : tab === 'past'
              ? 'Posts move here once closed or completed.'
              : 'Post a gig or host an event to start receiving applicants and RSVPs.'}
          </Text>
        </View>
      ) : (
        items.map((row, i) => {
          const Card = reduceMotion ? View : Animated.View;
          const entering = reduceMotion ? undefined : FadeInUp.delay(80 + i * 60).duration(600);
          const isEvent = row.kind === 'event';
          return (
            <Pressable
              key={row.id}
              onPress={() => router.push(row.href as any)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${row.kind} ${row.title}`}
            >
              <Card style={styles.card} entering={entering as any}>
                <View style={styles.cardHead}>
                  <View style={styles.pillRow}>
                    <View style={[styles.pill, isEvent ? styles.pillEvent : styles.pillGig]}>
                      <Text style={[styles.pillText, isEvent ? styles.pillTextEvent : styles.pillTextGig]}>
                        {isEvent ? 'EVENT' : 'GIG'}
                      </Text>
                    </View>
                    {row.category ? (
                      <Text style={styles.micro}>{row.category.toUpperCase()}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.price}>{row.price}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{row.title}</Text>
                <Text style={styles.cardDate}>{row.date === '—' ? '' : `Pune · ${row.date}`}</Text>
                <View style={styles.cardFoot}>
                  <View style={styles.cardFootLeft}>{metaLineForRow(row)}</View>
                  <Text style={styles.openLink}>Open →</Text>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, paddingBottom: 32 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h2: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, letterSpacing: -0.8, color: '#F3EFE8' },
  manageLink: { color: '#FF6B35', fontFamily: 'Outfit-Bold', fontSize: 12 },
  eyebrow: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 12,
    color: '#6B6878',
    marginTop: 4,
    marginBottom: 16,
  },

  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243,239,232,0.05)',
    marginBottom: 16,
  },
  tab: { paddingTop: 8, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#FF6B35' },
  tabText: { fontFamily: 'Outfit-Medium', fontSize: 14, color: '#6B6878' },
  tabTextActive: { fontFamily: 'Outfit-SemiBold', color: '#F3EFE8' },

  partialBanner: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  partialBannerText: { color: '#F59E0B', fontSize: 12 },
  partialBannerLink: { fontFamily: 'Outfit-Bold' },

  card: {
    backgroundColor: '#0D0B12',
    borderColor: 'rgba(243,239,232,0.05)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  pillGig: { backgroundColor: 'rgba(255,107,53,0.12)' },
  pillEvent: { backgroundColor: 'rgba(139,92,246,0.12)' },
  pillText: { fontFamily: 'Outfit-Bold', fontSize: 9, letterSpacing: 1 },
  pillTextGig: { color: '#FF6B35' },
  pillTextEvent: { color: '#8B5CF6' },
  micro: { fontSize: 9, letterSpacing: 1.6, fontFamily: 'Outfit-Bold', color: '#6B6878' },
  price: { fontFamily: 'SpaceMono-Bold', fontSize: 11, color: '#F59E0B' },
  cardTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#F3EFE8',
    lineHeight: 20,
  },
  cardDate: { fontSize: 12, color: '#B8B1A6', marginTop: 4, minHeight: 14 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(243,239,232,0.05)',
  },
  cardFootLeft: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 12, fontFamily: 'Outfit-SemiBold', color: '#F3EFE8' },
  statTextMuted: { fontSize: 12, color: '#B8B1A6', fontFamily: 'Outfit-Regular' },
  openLink: { color: '#FF6B35', fontFamily: 'Outfit-Bold', fontSize: 12 },

  cardSkeleton: { height: 120, borderRadius: 14, backgroundColor: '#0D0B12' },
  errorBox: { paddingVertical: 16, alignItems: 'center' },
  errorText: { color: '#B8B1A6', fontSize: 13, marginBottom: 4 },
  errorRetry: { color: '#FF6B35', fontFamily: 'Outfit-Bold', fontSize: 12 },

  emptyCard: {
    backgroundColor: '#0D0B12',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 18,
    color: '#F3EFE8',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  emptyBody: { fontSize: 12, color: '#B8B1A6', textAlign: 'center', lineHeight: 18, maxWidth: 280 },
});
