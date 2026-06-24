/**
 * /posts — "Manage all" full posts listing for the hirer.
 *
 * Read-only: a full merged list of the organizer's gigs + events (the dashboard
 * "Your posts" container shows only the top 5). Tapping a card routes to that
 * gig/event's own screen, which owns all per-item operations.
 *
 * Data: useOrganizerPosts(tab, 50) — fans out gigs + events, merges, sorts
 * createdAt DESC. Type filter (All/Gigs/Events) and sort (Newest/Oldest) are
 * applied client-side over the merged list. Cap: up to ~50 active posts/tab
 * (fetch headroom); real server pagination is a future optimization.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, AccessibilityInfo, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useOrganizerPosts } from '@/hooks/useOrganizerPosts';
import PostCard from '@/components/posts/PostCard';
import PostsFilterBar, { type TypeFilter, type SortOrder } from '@/components/posts/PostsFilterBar';

type TabKey = 'active' | 'draft' | 'past';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Drafts' },
  { key: 'past', label: 'Past' },
];

function eyebrowForCount(n: number): string {
  if (n === 0) return 'Your stage is open. What do you want to bring to it?';
  if (n === 1) return 'One posting, alive in the world.';
  const words = [
    'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
    'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  return `${n < 20 ? words[n] : n} postings, alive in the world.`;
}

export default function AllPostsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('active');
  const [type, setType] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const { allItems, isLoading, sourceErrors, refetch } = useOrganizerPosts(tab, 50);

  const visible = useMemo(() => {
    let rows = allItems;
    if (type !== 'all') rows = rows.filter((r) => r.kind === type);
    // Hook returns createdAt DESC (newest first); reverse for oldest.
    if (sort === 'oldest') rows = [...rows].reverse();
    return rows;
  }, [allItems, type, sort]);

  const bothFailed = !!sourceErrors.gigs && !!sourceErrors.events;
  const partialFailure = (!!sourceErrors.gigs || !!sourceErrors.events) && !bothFailed;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back" style={styles.back}>
          <ChevronLeft size={22} color="#B8B1A6" />
        </Pressable>
        <Text style={styles.h1}>Your posts</Text>
      </View>

      <FlatList
        data={isLoading ? [] : visible}
        keyExtractor={(row) => row.id}
        renderItem={({ item, index }) => (
          <PostCard
            row={item}
            index={index}
            reduceMotion={reduceMotion}
            footer="status"
            onPress={() => router.push(item.href as any)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>{eyebrowForCount(allItems.length)}</Text>

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

            <PostsFilterBar
              type={type}
              onTypeChange={setType}
              sort={sort}
              onSortToggle={() => setSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
              count={visible.length}
            />
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#FF6B35" />
            </View>
          ) : bothFailed ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Couldn't load your posts.</Text>
              <Pressable onPress={() => refetch()} accessibilityRole="button">
                <Text style={styles.errorRetry}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No {TABS.find((t) => t.key === tab)?.label.toLowerCase()}{type !== 'all' ? ` ${type}` : ''} posts
              </Text>
              <Text style={styles.emptyBody}>
                {tab === 'draft'
                  ? 'Drafts you save while composing land here.'
                  : tab === 'past'
                  ? 'Posts move here once closed or completed.'
                  : 'Post a gig or host an event to start receiving applicants and RSVPs.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060509' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 8 },
  back: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(243,239,232,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 27, letterSpacing: -0.8, color: '#F3EFE8' },
  listContent: { paddingHorizontal: 22, paddingBottom: 140 },
  eyebrow: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 12,
    color: '#6B6878',
    marginTop: 2,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243,239,232,0.05)',
    marginBottom: 14,
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
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  errorBox: { paddingVertical: 32, alignItems: 'center' },
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
