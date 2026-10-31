// src/components/search/board/Flourish.tsx
//
// Quiet end-of-results flourish (search mockup, .flourish): a ✦ mark over a
// mono caption. ✦ is a typographic glyph, not an emoji icon.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F } from './theme';

export function Flourish({ caption = 'End of results' }: { caption?: string }) {
  return (
    <View style={s.wrap}>
      <Text style={s.mark}>✦</Text>
      <Text style={s.cap}>{caption}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, paddingTop: 26, paddingBottom: 28 },
  mark: { color: C.t4, fontSize: 15, letterSpacing: 4 },
  cap: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 2, color: C.t4, textTransform: 'uppercase' },
});
