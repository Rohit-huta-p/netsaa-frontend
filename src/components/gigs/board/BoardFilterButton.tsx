// src/components/gigs/board/BoardFilterButton.tsx
//
// Board-level filter entry: a 46×46 icon button that sits beside the sort button
// in the toolbar and opens the filter sheet. Mirrors BoardSortMenu's button; a
// small orange badge shows the active facet count.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { C, F, INK } from './theme';

export function BoardFilterButton({ count, onPress }: { count: number; onPress: () => void }) {
  const active = count > 0;
  return (
    <Pressable
      onPress={onPress}
      style={[s.btn, active && s.btnOn]}
      hitSlop={4}
      accessibilityLabel="Filters"
    >
      <SlidersHorizontal size={18} color={active ? C.orange : C.cream} />
      {active ? (
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.hair,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOn: { borderColor: 'rgba(255,107,53,0.35)' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.canvas,
  },
  badgeTxt: { fontFamily: F.bold, fontSize: 9, color: INK },
});
