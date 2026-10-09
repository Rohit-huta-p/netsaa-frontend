// src/components/gigs/detail/GigFactStrip.tsx
// The four equal facts: Pay · When · Where · Slots (pay-as-fact, §7).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F } from './ui';
import type { Fact } from './gigDetailVM';

export function GigFactStrip({ facts }: { facts: Fact[] }) {
  return (
    <View style={s.row}>
      {facts.map((f, i) => (
        <View key={f.k} style={[s.cell, i > 0 && s.cellBorder]}>
          <Text style={s.k}>{f.k}</Text>
          <Text style={s.v} numberOfLines={1}>
            {f.v}
          </Text>
          {!!f.sub && (
            <Text style={s.sub} numberOfLines={1}>
              {f.sub}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.hair, borderBottomWidth: 1, borderBottomColor: C.hair, marginTop: 18 },
  cell: { flex: 1, paddingVertical: 13 },
  cellBorder: { borderLeftWidth: 1, borderLeftColor: C.hair, paddingLeft: 12 },
  k: { fontFamily: F.semi, fontSize: 8.5, letterSpacing: 1.2, textTransform: 'uppercase', color: C.t4, marginBottom: 5 },
  v: { fontFamily: F.semi, fontSize: 12.5, color: C.t1 },
  sub: { fontFamily: F.reg, fontSize: 10.5, color: C.t4, marginTop: 2 },
});
