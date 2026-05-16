/**
 * OverviewKpis — secondary metrics for the event manage overview.
 *
 * After the editorial redesign, capacity (registered / fill / slots_left)
 * lives in EventCapacityBar, and revenue lives in EventMoneyBlock. This
 * tile row now focuses on time + reach signals: time-to-event, view count,
 * and share count.
 *
 * Editorial styling matches the hirer home tiles (DM Serif numbers,
 * Outfit-Bold uppercase labels, near-black tile background).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { EventDoc } from '@/services/eventService';

function timeToEvent(startsAt?: string): { value: string; sub: string } {
  if (!startsAt) return { value: '—', sub: 'no date' };
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return { value: '—', sub: 'no date' };
  const ms = d.getTime() - Date.now();
  if (ms <= 0) {
    const hoursPast = Math.floor((Date.now() - d.getTime()) / 3_600_000);
    return { value: hoursPast < 24 ? `${hoursPast}h` : `${Math.floor(hoursPast / 24)}d`, sub: 'past' };
  }
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days >= 1) return { value: `${days}d`, sub: `${hours % 24}h` };
  return { value: `${hours}h`, sub: 'today' };
}

export default function OverviewKpis({ event }: { event: EventDoc }) {
  const ttg = timeToEvent(event.startsAt);
  const views = event.stats?.views ?? 0;
  const shares = event.stats?.sharesCount ?? 0;
  const saves = event.stats?.saves ?? 0;

  return (
    <View style={styles.grid}>
      <Kpi label="TIME TO EVENT" value={ttg.value} sub={ttg.sub} />
      <Kpi label="VIEWS" value={`${views.toLocaleString('en-IN')}`} sub={shares > 0 ? `${shares} shares` : 'all-time'} />
      <Kpi label="SAVES" value={`${saves.toLocaleString('en-IN')}`} sub={saves === 0 ? 'no saves yet' : 'wishlisted'} />
    </View>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  label: {
    fontFamily: 'Outfit-Bold',
    fontSize: 9,
    letterSpacing: 1.4,
    color: '#6B6878',
  },
  value: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    letterSpacing: -0.5,
    color: '#F3EFE8',
  },
  sub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: '#6B6878',
  },
});
