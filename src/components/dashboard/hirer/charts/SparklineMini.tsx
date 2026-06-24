/**
 * SparklineMini — small line chart used inside ByTheNumbersSection (Views tile).
 *
 * Plan: DOCS/NETSA_Hirer_Home_RN_Translation.md §6.5 + §4.
 *
 * Implementation choice (TODO §4):
 *   - Default path: react-native-svg <Path> with strokeDasharray animated via Reanimated.
 *   - Alternative: @shopify/react-native-skia for smoother subpixel rendering.
 *
 * Data:
 *   - `data`: 7 daily values (any numeric range — normalized inside).
 *   - `color`: stroke color, defaults to NETSA orange.
 *   - `locked`: render dashed baseline only.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
// TODO §4: import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
// TODO §4: import Animated, useSharedValue, useAnimatedProps, withTiming from 'react-native-reanimated';

interface Props {
  data?: number[];
  color?: string;
  height?: number;
  locked?: boolean;
}

export default function SparklineMini({
  data = [22, 18, 20, 14, 16, 10, 12, 7, 4],
  color = '#FF6B35',
  height = 32,
  locked = false,
}: Props) {
  if (locked) {
    return (
      <View style={[styles.locked, { height }]}>
        {/* TODO §4: render dashed horizontal baseline via react-native-svg <Line strokeDasharray="3 3" /> */}
        <View style={styles.lockedLine} />
      </View>
    );
  }

  // TODO §4: convert `data` array into SVG path d-string and animate strokeDashoffset.
  // Reference (HTML): path d="M0,22 L12,18 L24,20 L36,14 L48,16 L60,10 L72,12 L84,7 L100,4"
  // Steps:
  //   1. min/max normalize data into y-coords within [0, height].
  //   2. evenly distribute x-coords across viewBox width (100).
  //   3. assemble 'M{x0},{y0} L{x1},{y1} ...' string.
  //   4. on mount, animate stroke-dashoffset from total-length to 0 over ~1400ms easeOut.
  //   5. fill area below with linear-gradient (orange 50% → transparent), opacity 0.4.

  return (
    <View style={[styles.shell, { height }]}>
      {/* TODO §4: replace with SVG + animated path */}
      <View style={[styles.placeholderLine, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { width: '100%', marginTop: 8, justifyContent: 'flex-end' },
  placeholderLine: {
    height: 1.5,
    width: '100%',
    opacity: 0.6,
    borderRadius: 1,
  },
  locked: { width: '100%', marginTop: 8, justifyContent: 'center' },
  lockedLine: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(243,239,232,0.10)',
  },
});
