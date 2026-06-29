/**
 * OverviewStatsGrid — the O4 mockup's 2×2 stat grid:
 *   Registered · Waitlist · Earnings · Discussion
 *
 * Matches the organizer mockup (event-flow-mockups-organizer.html · O4):
 * a single rounded frame with 1px hairline gridlines between four tiles
 * (mono label · DM-Serif value · caption). All four are live:
 *   - Registered = registeredCount / capacity.total
 *   - Waitlist   = waitlistCount (backend overlay)
 *   - Earnings   = registered × organizer-net per ticket (paid only)
 *   - Discussion = discussionCount (backend overlay)
 *
 * Where the mockup shows illustrative deltas we don't track ("↑ 3 this week",
 * "/ 4 unread", "new this morning") we render the real equivalent we DO have
 * (spots left, comment count) rather than fabricate numbers.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import { formatRupees } from '@/lib/eventPricing';

const NETSA_FEE = 0.005; // 0.5% — mirrors eventPricing

export default function OverviewStatsGrid({ event }: { event: EventDoc }) {
  const total = event.capacity?.total ?? 0;
  const registered = event.capacity?.registeredCount ?? 0;
  const slotsLeft = Math.max(0, total - registered);
  const isPaid = event.registrationMode === 'paid_ticket';
  const ticketPrice = (event as any).pricing?.amount ?? (event as any).ticketPrice ?? 0;
  const organizerNet = isPaid ? Math.round(registered * ticketPrice * (1 - NETSA_FEE)) : 0;
  const waitlist = (event as any).waitlistCount ?? 0;
  const discussion = event.discussionCount ?? 0;

  return (
    <View style={styles.grid}>
      <View style={styles.gridRow}>
        <Stat
          label="REGISTERED"
          value={String(registered)}
          unit={total ? ` / ${total}` : ''}
          sub={`${slotsLeft} ${slotsLeft === 1 ? 'spot' : 'spots'} left`}
        />
        <Stat
          label="WAITLIST"
          value={String(waitlist)}
          sub={event.waitlistAutoPromote ? 'auto-promote on' : 'manual approve'}
        />
      </View>
      <View style={styles.gridRow}>
        <Stat
          label="EARNINGS"
          value={isPaid ? formatRupees(organizerNet) : 'Free'}
          sub={isPaid ? 'after NETSA fee' : 'no ticket charge'}
        />
        <Stat
          label="DISCUSSION"
          value={String(discussion)}
          sub={discussion === 1 ? 'comment' : 'comments'}
        />
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.k}>{label}</Text>
      <Text style={styles.v} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </Text>
      <Text style={styles.d}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // The frame background shows through the 1px gaps as hairline gridlines.
  grid: {
    backgroundColor: 'rgba(243,239,232,0.10)',
    borderColor: 'rgba(243,239,232,0.12)',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    gap: 1,
  },
  gridRow: { flexDirection: 'row', gap: 1 },
  tile: {
    flex: 1,
    backgroundColor: '#11111A',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  k: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9.5,
    letterSpacing: 1.3,
    color: '#6B6878',
    marginBottom: 8,
  },
  v: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: '#F3EFE8',
    lineHeight: 26,
  },
  unit: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: '#6B6878',
  },
  d: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: '#6B6878',
    marginTop: 5,
  },
});
