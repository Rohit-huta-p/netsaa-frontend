// src/components/search/board/SearchSkeleton.tsx
//
// Loading skeleton for the active search body: an eyebrow + shimmer rows that
// mirror the result-row anatomy (avatar/tile + two text lines). A single
// Reanimated pulse drives every block's opacity. A·Minimal (search mockup,
// frame 02).

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { C, F } from './theme';

const SKELETON = 'rgba(255,255,255,0.06)';

export function SearchSkeleton({ rows = 7 }: { rows?: number }) {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const shimmer = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View>
      <View style={s.grp}>
        <Text style={s.eyebrow}>Searching…</Text>
      </View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={s.row}>
          <Animated.View style={[s.thumb, i < 3 ? s.circle : s.square, shimmer]} />
          <View style={s.lines}>
            <Animated.View style={[s.block, s.lineA, shimmer]} />
            <Animated.View style={[s.block, s.lineB, shimmer]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grp: { paddingTop: 16, paddingBottom: 8 },
  eyebrow: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.7, color: C.t4, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.hairSoft,
  },
  thumb: { width: 46, height: 46, backgroundColor: SKELETON },
  circle: { borderRadius: 23 },
  square: { borderRadius: 13 },
  lines: { flex: 1 },
  block: { backgroundColor: SKELETON, borderRadius: 7 },
  lineA: { height: 13, width: '62%', marginBottom: 9 },
  lineB: { height: 11, width: '40%' },
});
