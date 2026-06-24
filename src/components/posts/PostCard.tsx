/**
 * PostCard — shared organizer post card (gig | event).
 *
 * Single source of truth for the "Your posts" card, used by both the hirer
 * dashboard preview (YourPostsSection) and the full /posts screen.
 *
 * `footer` controls the bottom row:
 *   'meta'   → "8 applicants · 142 views" / "1 / 50 seats"  (dashboard preview)
 *   'status' → "● LIVE · 8 APPLICANTS"                       (Variant B, /posts)
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { PostRow } from '@/hooks/useOrganizerPosts';

export type PostCardFooter = 'meta' | 'status';

export interface PostCardProps {
  row: PostRow;
  onPress: () => void;
  index?: number;
  reduceMotion?: boolean;
  footer?: PostCardFooter;
}

function metaLine(row: PostRow): React.ReactNode {
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

function statusDot(row: PostRow): { label: string; dot: string } {
  const s = row.status;
  if (s === 'live' || s === 'published') return { label: 'LIVE', dot: '#22C55E' };
  if (s === 'draft') return { label: 'DRAFT', dot: '#F59E0B' };
  return { label: (s || 'UNKNOWN').toUpperCase(), dot: '#6B6878' };
}

function countPart(row: PostRow): string {
  if (row.kind === 'event' && row.seats) return `${row.seats.taken}/${row.seats.total} seats`;
  const a = row.applicants ?? 0;
  return `${a} ${a === 1 ? 'applicant' : 'applicants'}`;
}

function StatusLine({ row }: { row: PostRow }) {
  const meta = statusDot(row);
  return (
    <View style={styles.statusLine}>
      <View style={[styles.dot, { backgroundColor: meta.dot }]} />
      <Text style={styles.statusText}>{meta.label} · {countPart(row).toUpperCase()}</Text>
    </View>
  );
}

export default function PostCard({ row, onPress, index = 0, reduceMotion = false, footer = 'meta' }: PostCardProps) {
  const Card = reduceMotion ? View : Animated.View;
  const entering = reduceMotion ? undefined : FadeInUp.delay(80 + index * 60).duration(600);
  const isEvent = row.kind === 'event';
  return (
    <Pressable
      onPress={onPress}
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
          <View style={styles.cardFootLeft}>
            {footer === 'status' ? <StatusLine row={row} /> : metaLine(row)}
          </View>
          <Text style={styles.openLink}>Open →</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  cardTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#F3EFE8', lineHeight: 20 },
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
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, letterSpacing: 1, fontFamily: 'Outfit-Bold', color: '#6B6878' },
});
