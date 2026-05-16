/**
 * ActionQueueTile — "Today" consolidated action queue.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Today / Action queue section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.3.
 *
 * Consolidates these surfaces into one priority-sorted tile:
 *   - ApplicantsInbox (new applicants) — live via useActionQueue
 *   - PaymentsStrip (balance due, refund decisions) — stubbed, returns when
 *     payment hooks ship (PAYMENTS-DISABLED on PaymentsStrip today)
 *   - Future categories (booking confirm, venue change, etc.) — empty until
 *     their backends ship per §6.3
 *
 * Categories with color coding match the finalized HTML mock:
 *   applicants_new       → red (urgent)
 *   booking_confirm      → gold
 *   balance_due          → gold
 *   refund_decision      → purple
 *   venue_change         → gold
 *   subartist_payment    → gold
 *   message_pending      → purple
 */
import React, { useEffect, useState } from 'react';
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
  useActionQueue,
  type ActionCategory,
} from '@/hooks/useActionQueue';

const CATEGORY_COLOR: Record<ActionCategory, { tint: string; bg: string; chevron: string }> = {
  applicants_new:    { tint: '#EF4444', bg: 'rgba(239,68,68,0.12)',  chevron: '#FF6B35' },
  booking_confirm:   { tint: '#F59E0B', bg: 'rgba(245,158,11,0.12)', chevron: '#F59E0B' },
  balance_due:       { tint: '#F59E0B', bg: 'rgba(245,158,11,0.12)', chevron: '#F59E0B' },
  refund_decision:   { tint: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', chevron: '#8B5CF6' },
  venue_change:      { tint: '#F59E0B', bg: 'rgba(245,158,11,0.12)', chevron: '#F59E0B' },
  subartist_payment: { tint: '#F59E0B', bg: 'rgba(245,158,11,0.12)', chevron: '#F59E0B' },
  message_pending:   { tint: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', chevron: '#8B5CF6' },
};

interface Props {
  /** Max items to render before showing "See N more →". Default 4. */
  displayLimit?: number;
}

export default function ActionQueueTile({ displayLimit = 4 }: Props) {
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);
  const { items, totalCount, isLoading } = useActionQueue(displayLimit);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  if (isLoading) {
    return <View style={styles.skeleton} accessibilityElementsHidden />;
  }

  if (!items.length) {
    return <EmptyAllClear />;
  }

  const moreCount = Math.max(0, totalCount - items.length);

  const Container = reduceMotion ? View : Animated.View;
  const tileEntering = reduceMotion ? undefined : FadeInUp.delay(120).duration(700);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.h2}>Today</Text>
        <Text style={styles.mono}>{String(totalCount).padStart(2, '0')} · open</Text>
      </View>
      <Text style={styles.eyebrow}>The matters you began. Each waiting on a decision only you can make.</Text>

      <Container style={styles.tile} entering={tileEntering as any}>
        <View style={styles.tileHead}>
          <View style={styles.tileHeadLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.tileLabel}>ACTION QUEUE</Text>
          </View>
          <View style={styles.pillUrgent}>
            <Text style={styles.pillUrgentText}>{totalCount} OPEN</Text>
          </View>
        </View>

        {items.map((item, idx) => {
          const colors = CATEGORY_COLOR[item.category];
          const isLast = idx === items.length - 1 && moreCount === 0;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.href as any)}
              style={[styles.row, isLast && styles.rowLast]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.subtitle}`}
            >
              <View style={[styles.iconChip, { backgroundColor: colors.bg }]}>
                <View style={[styles.iconDot, { backgroundColor: colors.tint }]} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.chevron }]}>›</Text>
            </Pressable>
          );
        })}
      </Container>

      {moreCount > 0 && (
        <Pressable
          style={styles.seeMore}
          onPress={() => router.push('/gigs?mine=1&tab=applicants' as any)}
          accessibilityRole="button"
        >
          <Text style={styles.seeMoreText}>See {moreCount} more →</Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyAllClear() {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.h2}>Today</Text>
        <Text style={styles.mono}>00 · open</Text>
      </View>
      <Text style={styles.eyebrow}>A quiet morning. Nothing yet pulls at your attention.</Text>

      <View style={styles.emptyTile}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyCheck}>✓</Text>
        </View>
        <Text style={styles.emptyTitle}>All clear</Text>
        <Text style={styles.emptyBody}>
          Once applicants land or a booking needs confirming, it'll surface here.
        </Text>
        <Pressable
          style={styles.emptyCta}
          onPress={() => router.push('/gigs/new' as any)}
          accessibilityRole="button"
        >
          <Text style={styles.emptyCtaText}>+ Post a gig</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, paddingBottom: 32 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h2: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, letterSpacing: -0.8, color: '#F3EFE8' },
  mono: { fontSize: 10, color: '#6B6878', fontFamily: 'Outfit-Medium', letterSpacing: 1.5 },
  eyebrow: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 12,
    color: '#6B6878',
    marginVertical: 16,
  },

  tile: {
    backgroundColor: '#11111A',
    borderColor: 'rgba(255,107,53,0.20)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tileHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: '#EF4444' },
  tileLabel: { fontSize: 13, fontFamily: 'Outfit-SemiBold', color: '#F3EFE8', letterSpacing: 0.3 },

  pillUrgent: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillUrgentText: { color: '#EF4444', fontSize: 9, fontFamily: 'Outfit-Bold', letterSpacing: 1 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(243,239,232,0.05)',
  },
  rowLast: { borderBottomWidth: 0 },
  iconChip: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  iconDot: { width: 12, height: 12, borderRadius: 6 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontFamily: 'Outfit-SemiBold', color: '#F3EFE8', lineHeight: 18 },
  rowSubtitle: { fontSize: 11, color: '#6B6878', marginTop: 2 },
  chevron: { fontSize: 18, fontFamily: 'Outfit-Bold' },

  seeMore: {
    marginTop: 12, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(243,239,232,0.09)', borderWidth: 1, borderStyle: 'dashed',
    borderRadius: 14, alignItems: 'center',
  },
  seeMoreText: { color: '#FF6B35', fontSize: 12, fontFamily: 'Outfit-Bold' },

  emptyTile: {
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.14)',
    borderWidth: 1, borderStyle: 'dashed',
    borderRadius: 22, paddingVertical: 32, paddingHorizontal: 22,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(34,197,94,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  emptyCheck: { color: '#22C55E', fontSize: 22, fontFamily: 'Outfit-Bold' },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: '#F3EFE8', letterSpacing: -0.5, marginBottom: 8 },
  emptyBody: { textAlign: 'center', fontSize: 12, color: '#B8B1A6', lineHeight: 18, maxWidth: 280, marginBottom: 20 },
  emptyCta: {
    backgroundColor: '#F3EFE8', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12,
  },
  emptyCtaText: { color: '#0A0A0F', fontFamily: 'Outfit-Bold', fontSize: 12, letterSpacing: 0.3 },

  skeleton: {
    height: 320,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 22,
    backgroundColor: '#0D0B12',
  },
});
