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
import { useOrganizerPosts } from '@/hooks/useOrganizerPosts';
import PostCard from '@/components/posts/PostCard';

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
          onPress={() => router.push('/posts' as any)}
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
        items.map((row, i) => (
          <PostCard
            key={row.id}
            row={row}
            index={i}
            reduceMotion={reduceMotion}
            onPress={() => router.push(row.href as any)}
          />
        ))
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
