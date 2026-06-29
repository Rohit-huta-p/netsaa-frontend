/**
 * RosterRow — one attendee row in the O5 roster (organizer mockup).
 *
 * Avatar (initial) · name · "phone · N seats" · trailing relative time.
 * Waitlist rows show a "#position" pill; cancelled rows are dimmed.
 *
 * No VIP pill — there's no VIP field in the data model yet, so we don't
 * fabricate one (mockup shows it illustratively). Avatars are initials, not
 * photos — the roster API doesn't return avatar URLs.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RosterRow } from '@/hooks/useEventRoster';

function relativeTime(iso?: string): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function RosterRowComponent({ row }: { row: RosterRow }) {
  const cancelled = row.status === 'cancelled';
  const isWaitlist = typeof row.position === 'number';
  const seatLabel = `${row.seats} ${row.seats === 1 ? 'seat' : 'seats'}`;
  const sub = [row.phone, seatLabel].filter(Boolean).join(' · ');
  const stamp = relativeTime(row.joinedAt ?? row.registeredAt);

  return (
    <View style={[styles.row, cancelled && styles.rowDim]}>
      <View style={styles.av}>
        <Text style={styles.avText}>{row.name?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{row.name}</Text>
        <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
      </View>
      <View style={styles.trail}>
        {isWaitlist ? <Text style={styles.posPill}>#{row.position}</Text> : null}
        {stamp ? <Text style={styles.stamp}>{stamp}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(243,239,232,0.06)',
  },
  rowDim: { opacity: 0.55 },
  av: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avText: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 16, color: '#FF6B35' },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'Outfit-SemiBold', fontSize: 13.5, color: '#F3EFE8', lineHeight: 18 },
  sub: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: '#9C99A6', marginTop: 2 },
  trail: { alignItems: 'flex-end', gap: 4 },
  posPill: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: '#FF6B35',
    backgroundColor: 'rgba(255,107,53,0.16)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: 'hidden',
  },
  stamp: { fontFamily: 'SpaceMono-Regular', fontSize: 9.5, color: '#6B6878' },
});
