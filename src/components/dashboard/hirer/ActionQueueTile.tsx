/**
 * ActionQueueTile — "Today" consolidated action queue.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (Today / Action queue section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.3.
 *
 * Consolidates these existing surfaces into a single priority-sorted list:
 *   - ApplicantsInbox (new applicants)
 *   - PaymentsStrip (balance due, refund decisions)
 *   - (future) booking confirmations, venue changes, sub-artist payments, messages
 *
 * Categories with color coding:
 *   - applicants_new       → red (urgent)
 *   - booking_confirm      → gold
 *   - balance_due          → gold
 *   - refund_decision      → purple
 *   - venue_change         → gold
 *   - subartist_payment    → gold
 *   - message_pending      → purple
 *
 * Empty state: dashed-border tile with green check + "All clear" + "Post your first gig" CTA.
 *
 * TODO §6.3 — build unified useActionQueue() hook that aggregates the categories
 * and returns sorted, typed actions.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
// TODO §4: import Animated for live-dot pulse + reveal entry.

type ActionCategory =
  | 'applicants_new'
  | 'booking_confirm'
  | 'balance_due'
  | 'refund_decision'
  | 'venue_change'
  | 'subartist_payment'
  | 'message_pending';

interface ActionItem {
  id: string;
  category: ActionCategory;
  title: string;       // "5 new applicants · Bharatanatyam"
  subtitle: string;    // "Pune wedding · Dec 4 · ₹35K"
  /** Route to navigate when pressed. Use Expo Router href shape. */
  href: string;
  /** Optional overdue / urgency flag. */
  overdue?: boolean;
}

interface Props {
  items?: ActionItem[];
  totalCount?: number;
  /** Max items to render before showing "See N more →". */
  displayLimit?: number;
  isLoading?: boolean;
}

const CATEGORY_COLOR: Record<ActionCategory, { tint: string; bg: string; chevron: string }> = {
  applicants_new:    { tint: '#EF4444', bg: 'rgba(239,68,68,0.12)',  chevron: '#FF6B35' },
  booking_confirm:   { tint: '#F59E0B', bg: 'rgba(245,158,11,0.12)', chevron: '#F59E0B' },
  balance_due:       { tint: '#F59E0B', bg: 'rgba(245,158,11,0.12)', chevron: '#F59E0B' },
  refund_decision:   { tint: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', chevron: '#8B5CF6' },
  venue_change:      { tint: '#F59E0B', bg: 'rgba(245,158,11,0.12)', chevron: '#F59E0B' },
  subartist_payment: { tint: '#F59E0B', bg: 'rgba(245,158,11,0.12)', chevron: '#F59E0B' },
  message_pending:   { tint: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', chevron: '#8B5CF6' },
};

export default function ActionQueueTile({
  items = [],
  totalCount,
  displayLimit = 4,
  isLoading,
}: Props) {
  const router = useRouter();

  if (isLoading) {
    // TODO §8: skeleton matching the tile height (~280-360px depending on row count).
    return <View style={styles.skeleton} />;
  }

  if (!items.length) {
    return <EmptyAllClear />;
  }

  const total = totalCount ?? items.length;
  const visible = items.slice(0, displayLimit);
  const moreCount = Math.max(0, total - visible.length);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.h2}>Today</Text>
        <Text style={styles.mono}>{String(total).padStart(2, '0')} · open</Text>
      </View>
      <Text style={styles.eyebrow}>The matters you began. Each waiting on a decision only you can make.</Text>

      <View style={styles.tile}>
        <View style={styles.tileHead}>
          {/* TODO §4: animated pulse on dot (Animated.loop) */}
          <View style={styles.tileHeadLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.tileLabel}>ACTION QUEUE</Text>
          </View>
          <View style={styles.pillUrgent}>
            <Text style={styles.pillUrgentText}>{total} OPEN</Text>
          </View>
        </View>

        {visible.map((item, idx) => {
          const colors = CATEGORY_COLOR[item.category];
          const isLast = idx === visible.length - 1 && moreCount === 0;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push(item.href as any)}
              style={[styles.row, isLast && styles.rowLast]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.subtitle}`}
            >
              <View style={[styles.iconChip, { backgroundColor: colors.bg }]}>
                {/* TODO §6.3: per-category icon SVG */}
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
      </View>

      {moreCount > 0 && (
        <Pressable
          style={styles.seeMore}
          onPress={() => router.push('/dashboard/actions' as any)}
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
          Once you post a gig or event, applicant decisions, confirmations, and payment matters will surface here.
        </Text>
        <Pressable
          style={styles.emptyCta}
          onPress={() => router.push('/gigs/new' as any)}
          accessibilityRole="button"
        >
          <Text style={styles.emptyCtaText}>+ Post your first gig</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, paddingBottom: 32 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h2: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, letterSpacing: -0.8, color: '#F3EFE8' },
  mono: { fontSize: 10, color: '#6B6878', fontFamily: 'Outfit_500Medium', letterSpacing: 1.5 },
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
  tileLabel: { fontSize: 13, fontWeight: '600', color: '#F3EFE8', letterSpacing: 0.3 },

  pillUrgent: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillUrgentText: { color: '#EF4444', fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(243,239,232,0.05)',
  },
  rowLast: { borderBottomWidth: 0 },
  iconChip: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  iconDot: { width: 12, height: 12, borderRadius: 6 }, // TODO: real svg
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#F3EFE8', lineHeight: 18 },
  rowSubtitle: { fontSize: 11, color: '#6B6878', marginTop: 2 },
  chevron: { fontSize: 18, fontWeight: '700' },

  seeMore: {
    marginTop: 12, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(243,239,232,0.09)', borderWidth: 1, borderStyle: 'dashed',
    borderRadius: 14, alignItems: 'center',
  },
  seeMoreText: { color: '#FF6B35', fontSize: 12, fontWeight: '700' },

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
  emptyCheck: { color: '#22C55E', fontSize: 22, fontWeight: '700' },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: '#F3EFE8', letterSpacing: -0.5, marginBottom: 8 },
  emptyBody: { textAlign: 'center', fontSize: 12, color: '#B8B1A6', lineHeight: 18, maxWidth: 280, marginBottom: 20 },
  emptyCta: {
    backgroundColor: '#F3EFE8', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12,
  },
  emptyCtaText: { color: '#0A0A0F', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },

  skeleton: { height: 320, marginHorizontal: 24, marginBottom: 32, borderRadius: 22, backgroundColor: '#0D0B12' },
});
