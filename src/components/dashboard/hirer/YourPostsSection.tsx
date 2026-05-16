/**
 * YourPostsSection — evolves PostedGigsSection into the editorial card layout.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Your posts section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.4.
 *
 * Uses the same data source (usePostedGigs + POSTED_GIGS_FILTERS) so the
 * underlying contract is unchanged. New presentation only:
 *   - Section header + italic eyebrow ("X postings, alive in the world.")
 *   - Tab row (Draft / Live / Closed) instead of chip carousel
 *   - Card rows: pill + category micro + price (right) + serif title +
 *     date + footer with applicants/views + Open → button
 *   - Reanimated FadeInUp stagger on each card
 *
 * Price + date pulled from the real Gig type when present; rendered as
 * em-dash placeholders when missing (mirrors the empty-state HTML
 * treatment for fields the backend hasn't shipped yet).
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
import { usePostedGigs } from '@/hooks/usePostedGigs';
import {
  POSTED_GIGS_FILTERS,
  type PostedGigFilter,
} from '@/constants/postedGigsStatus';

interface GigRow {
  _id?: string;
  id?: string;
  title?: string;
  status?: string;
  category?: string;
  stats?: { applicationsCount?: number; viewsCount?: number };
  createdAt?: string;
  /** Best-effort price fields — backend may use different names. */
  price?: number | { amount?: number; currency?: string };
  budget?: number;
  /** Best-effort date fields. */
  startsAt?: string;
  gigDate?: string;
  dates?: { start?: string };
}

function unwrapGigs(data: any): GigRow[] {
  if (!data) return [];
  if (Array.isArray(data.gigs)) return data.gigs;
  if (Array.isArray(data?.data?.gigs)) return data.data.gigs;
  if (Array.isArray(data)) return data;
  return [];
}

function readPrice(g: GigRow): string {
  if (typeof g.price === 'number') return `₹${g.price.toLocaleString('en-IN')}`;
  if (g.price && typeof g.price === 'object' && typeof g.price.amount === 'number') {
    return `₹${g.price.amount.toLocaleString('en-IN')}`;
  }
  if (typeof g.budget === 'number') return `₹${g.budget.toLocaleString('en-IN')}`;
  return '—';
}

function readDate(g: GigRow): string {
  const raw = g.startsAt ?? g.gigDate ?? g.dates?.start ?? g.createdAt;
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function readCategory(g: GigRow): string {
  if (typeof g.category === 'string' && g.category.length > 0) {
    return g.category.replace(/_/g, ' ');
  }
  return 'General';
}

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
  const [selected, setSelected] = useState<PostedGigFilter>(
    // Default to Live so the user sees their active posts on landing.
    POSTED_GIGS_FILTERS.find((f) => f.backendStatus === 'published') ??
      POSTED_GIGS_FILTERS[0]
  );
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const { data, isLoading, error, refetch } = usePostedGigs(selected.backendStatus, 5);
  const gigs = useMemo(() => unwrapGigs(data), [data]);
  const eyebrow = eyebrowForCount(gigs.length);

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
        {POSTED_GIGS_FILTERS.map((f) => {
          const active = f.backendStatus === selected.backendStatus;
          return (
            <Pressable
              key={f.backendStatus}
              onPress={() => setSelected(f)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
              hitSlop={6}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.cardSkeleton} accessibilityElementsHidden />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Couldn't load your posts.</Text>
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.errorRetry}>Retry</Text>
          </Pressable>
        </View>
      ) : gigs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No {selected.label.toLowerCase()} posts</Text>
          <Text style={styles.emptyBody}>
            {selected.backendStatus === 'draft'
              ? 'Drafts you save while composing a gig land here.'
              : selected.backendStatus === 'closed'
              ? 'Closed gigs move here when applications stop.'
              : 'Post a gig to start receiving applicants.'}
          </Text>
        </View>
      ) : (
        gigs.map((g, i) => {
          const id = g._id ?? g.id ?? `row-${i}`;
          const Card = reduceMotion ? View : Animated.View;
          const entering = reduceMotion ? undefined : FadeInUp.delay(80 + i * 60).duration(600);
          const title = g.title ?? 'Untitled gig';
          const applicants = g.stats?.applicationsCount ?? 0;
          const views = g.stats?.viewsCount ?? 0;
          return (
            <Pressable
              key={id}
              onPress={() => router.push({ pathname: '/(app)/gigs/[id]', params: { id } })}
              accessibilityRole="button"
              accessibilityLabel={`Open post ${title}`}
            >
              <Card style={styles.card} entering={entering as any}>
                <View style={styles.cardHead}>
                  <View style={styles.pillRow}>
                    <View style={styles.pillGig}>
                      <Text style={styles.pillGigText}>GIG</Text>
                    </View>
                    <Text style={styles.micro}>{readCategory(g).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.price}>{readPrice(g)}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.cardDate}>Pune · {readDate(g)}</Text>
                <View style={styles.cardFoot}>
                  <View style={styles.cardFootLeft}>
                    <Text style={styles.statText}>
                      {applicants} {applicants === 1 ? 'applicant' : 'applicants'}
                    </Text>
                    <Text style={styles.statTextMuted}> · {views} {views === 1 ? 'view' : 'views'}</Text>
                  </View>
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
  tab: {
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#FF6B35' },
  tabText: { fontFamily: 'Outfit-Medium', fontSize: 14, color: '#6B6878' },
  tabTextActive: { fontFamily: 'Outfit-SemiBold', color: '#F3EFE8' },

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
  pillGig: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillGigText: {
    color: '#FF6B35',
    fontFamily: 'Outfit-Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  micro: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontFamily: 'Outfit-Bold',
    color: '#6B6878',
  },
  price: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 11,
    color: '#F59E0B',
  },
  cardTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: '#F3EFE8',
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 12,
    color: '#B8B1A6',
    marginTop: 4,
  },
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
  statTextMuted: { fontSize: 12, color: '#B8B1A6' },
  openLink: { color: '#FF6B35', fontFamily: 'Outfit-Bold', fontSize: 12 },

  cardSkeleton: {
    height: 120,
    borderRadius: 14,
    backgroundColor: '#0D0B12',
  },
  errorBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
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
  emptyBody: {
    fontSize: 12,
    color: '#B8B1A6',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
