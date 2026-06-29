/**
 * OverviewStatsGrid — the O4 mockup's 2×2 stat grid:
 *   Registered · Waitlist · Earnings · Discussion
 *
 * Waitlist + Discussion show "—" until Sprint 4 (waitlist) and Sprint 5
 * (discussion) land. Registered + Earnings are live (capacity is derived on
 * read; earnings = registered seats × organizer-net per ticket).
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

  return (
    <View style={styles.grid}>
      <Stat
        label="REGISTERED"
        value={String(registered)}
        unit={total ? ` / ${total}` : ''}
        sub={`${slotsLeft} ${slotsLeft === 1 ? 'spot' : 'spots'} left`}
      />
      <Stat
        label="WAITLIST"
        value={String((event as any).waitlistCount ?? 0)}
        sub={event.waitlistAutoPromote ? 'auto-promote on' : 'manual approve'}
      />
      <Stat
        label="EARNINGS"
        value={isPaid ? formatRupees(organizerNet) : 'Free'}
        sub={isPaid ? 'after NETSA fee' : 'no ticket charge'}
      />
      <Stat
        label="DISCUSSION"
        value={String(event.discussionCount ?? 0)}
        sub={(event.discussionCount ?? 0) === 1 ? 'comment' : 'comments'}
      />
    </View>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
  muted,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.k}>{label}</Text>
      <Text style={[styles.v, muted && styles.vMuted]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </Text>
      <Text style={styles.d}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  k: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 9.5,
    letterSpacing: 1.4,
    color: '#6B6878',
    marginBottom: 8,
  },
  v: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: '#F3EFE8',
    lineHeight: 26,
  },
  vMuted: { color: '#4A4854' },
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
