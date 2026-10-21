// src/components/gigs/board/MoreFiltersPill.tsx
//
// The sole entry into the Filters sheet — a "More filters · N" pill pinned to
// the right of the craft-tabs row (the craft tabs scroll behind it). Filled
// chip background distinguishes it from the transparent craft tabs; the orange
// badge shows the active facet count.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { C, F, INK } from './theme';

export function MoreFiltersPill({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.pill} accessibilityLabel="More filters">
      <SlidersHorizontal size={13} color={C.t2} />
      <Text style={s.txt}>MORE FILTERS</Text>
      {count > 0 ? (
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: {
    height: 33,
    paddingHorizontal: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.hair,
    backgroundColor: C.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  txt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.t1 },
  badge: {
    minWidth: 15,
    height: 15,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: { fontFamily: F.bold, fontSize: 9, color: INK },
});
