// src/components/search/board/SectionHeader.tsx
//
// Editorial section header: orange accent tick + serif title + mono count
// ("N ENTRIES" or a custom note) + optional "See all →". A hairline rule sits
// above every header except the first. A·Minimal (search mockup, .sec).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F } from './theme';

export function SectionHeader({
  title,
  entries,
  note,
  onSeeAll,
  first = false,
}: {
  title: string;
  // Renders "N ENTRIES" on the right (ignored when `note` is given).
  entries?: number;
  // A custom right-hand label (e.g. the uppercased query on a scoped view).
  note?: string;
  onSeeAll?: () => void;
  first?: boolean;
}) {
  const right = note ?? (typeof entries === 'number' ? `${entries} ENTRIES` : '');
  return (
    <View style={[s.sec, first && s.first]}>
      <View style={s.bar} />
      <Text style={s.title}>{title}</Text>
      {right ? <Text style={s.cnt}>{right}</Text> : null}
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} style={s.seeWrap} hitSlop={6}>
          <Text style={s.see}>See all →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  sec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: C.hairSoft,
  },
  first: { borderTopWidth: 0, paddingTop: 8 },
  bar: { width: 3, height: 15, borderRadius: 2, backgroundColor: C.orange },
  title: { fontFamily: F.serif, fontSize: 18, color: C.cream, lineHeight: 20 },
  cnt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.t4 },
  seeWrap: { marginLeft: 'auto' },
  see: { fontFamily: F.semi, fontSize: 12.5, color: C.orange },
});
