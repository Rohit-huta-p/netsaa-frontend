/**
 * BarChartMini — 7-bar histogram used inside ByTheNumbersSection (Apps/day tile).
 *
 * Plan: DOCS/02-engineering/NETSA_Hirer_Home_RN_Translation.md §6.5 + §4.
 *
 * Animation (TODO §4):
 *   - Each bar's scaleY animates from 0 to target on mount, staggered 60ms each.
 *   - Native driver = true.
 *
 * Bars 0-2 use muted grey, bars 3-6 use orange. (Reference: HTML Apps/day tile.)
 *
 * Locked state: all bars muted, no animation.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
// TODO §4: import Animated, useSharedValue, useAnimatedStyle, withTiming, withDelay from 'react-native-reanimated';

interface Props {
  values?: number[];  // expected 7 entries, range 0-100
  color?: string;
  mutedColor?: string;
  /** Number of trailing entries to color with `color`. Earlier are mutedColor. */
  emphasizeLast?: number;
  height?: number;
  locked?: boolean;
}

export default function BarChartMini({
  values = [30, 50, 40, 65, 75, 85, 100],
  color = '#FF6B35',
  mutedColor = 'rgba(243,239,232,0.14)',
  emphasizeLast = 4,
  height = 32,
  locked = false,
}: Props) {
  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => {
        const isEmphasized = !locked && i >= values.length - emphasizeLast;
        const barColor = locked
          ? 'rgba(243,239,232,0.06)'
          : isEmphasized ? color : mutedColor;
        const pct = Math.max(0, Math.min(100, v));

        // TODO §4: wrap with Animated.View. shared value `scale` animates from 0 to 1
        // over 600ms easeOut, delayed by i*60ms. transformOrigin: 'bottom center'.

        return (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: barColor, height: `${pct}%` },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 10 },
  bar: { width: 7, borderRadius: 2 },
});
