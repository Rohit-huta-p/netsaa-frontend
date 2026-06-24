/**
 * ByTheNumbersSection — Views + Apps/day + Match strip.
 *
 * Design source: DOCS/designs/hirer-home-v1.html (By the numbers section).
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.5.
 *
 * Layout:
 *   1. Section header "By the numbers" + mono "7 DAY" stamp.
 *   2. Italic eyebrow.
 *   3. Two-column grid: SparklineMini (left) + BarChartMini (right).
 *   4. MatchForYourGigsStrip (full-width tile).
 *
 * Data: new useHirerInsights() hook returning:
 *   { views7d, viewsWoW, appsPerDay, appsHistogram, ttlAvg, ttlPuneAvg, mtdSpent }
 *
 * Empty state: locked placeholders with em-dash and dashed sparkline (see hirer-home-empty-v1.html §5).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SparklineMini from './charts/SparklineMini';
import BarChartMini from './charts/BarChartMini';
import MatchForYourGigsStrip from './MatchForYourGigsStrip';
// TODO §5: import { useHirerInsights } from '@/hooks/useHirerInsights' once built.

interface Props {
  views7d?: number;
  viewsWoW?: number;      // percent change, signed
  viewsSeries?: number[]; // 7 daily values for sparkline
  appsPerDay?: number;
  appsHistogram?: number[]; // 7 daily values for bar chart
  /** When true, render locked placeholders (new hirer). */
  locked?: boolean;
}

export default function ByTheNumbersSection({
  views7d,
  viewsWoW,
  viewsSeries,
  appsPerDay,
  appsHistogram,
  locked = false,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headRow}>
        <Text style={styles.h2}>By the numbers</Text>
        <Text style={styles.mono}>{locked ? 'UNLOCK' : '7 DAY'}</Text>
      </View>
      <Text style={styles.eyebrow}>
        {locked
          ? 'These wake up once your first post goes live.'
          : 'How your posts are landing this week.'}
      </Text>

      <View style={styles.grid}>
        <View style={[styles.tile, locked && styles.tileLocked]}>
          <Text style={styles.tileLabel}>VIEWS · 7d</Text>
          <Text style={styles.tileNum}>
            {locked ? '—' : (views7d ?? 0).toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.tileTrend, locked && styles.tileTrendLocked]}>
            {locked
              ? 'awaiting first post'
              : `${viewsWoW! >= 0 ? '↑' : '↓'} ${Math.abs(viewsWoW ?? 0)}% WoW`}
          </Text>
          {/* TODO §4: SparklineMini animates strokeDashoffset on viewport enter */}
          <SparklineMini
            data={viewsSeries ?? [22, 18, 20, 14, 16, 10, 12]}
            color="#FF6B35"
            locked={locked}
          />
        </View>

        <View style={[styles.tile, locked && styles.tileLocked]}>
          <Text style={styles.tileLabel}>APPS · day</Text>
          <Text style={styles.tileNum}>
            {locked ? '—' : (appsPerDay ?? 0).toFixed(1)}
          </Text>
          <Text style={[styles.tileTrend, locked && styles.tileTrendLocked]}>
            {locked ? 'awaiting first post' : 'across 5 posts'}
          </Text>
          {/* TODO §4: BarChartMini animates each bar's scaleY staggered on mount */}
          <BarChartMini
            values={appsHistogram ?? [30, 50, 40, 65, 75, 85, 100]}
            color="#FF6B35"
            locked={locked}
          />
        </View>
      </View>

      <MatchForYourGigsStrip preview={locked} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 24, paddingBottom: 32 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  h2: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, letterSpacing: -0.8, color: '#F3EFE8' },
  mono: { fontSize: 10, color: '#6B6878', fontFamily: 'Outfit_500Medium', letterSpacing: 1.5 },
  eyebrow: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontStyle: 'italic',
    fontSize: 12,
    color: '#6B6878',
    marginVertical: 16,
  },

  grid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tile: {
    flex: 1,
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  tileLocked: { opacity: 0.6 },
  tileLabel: { fontSize: 9, color: '#6B6878', fontFamily: 'Outfit_700Bold', letterSpacing: 1.6, marginBottom: 4 },
  tileNum: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, letterSpacing: -0.8, color: '#F3EFE8' },
  tileTrend: { fontSize: 10, marginTop: 2, color: '#22C55E', fontWeight: '600' },
  tileTrendLocked: { color: '#3F3D4A', fontWeight: '400' },
});
