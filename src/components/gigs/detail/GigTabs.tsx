// src/components/gigs/detail/GigTabs.tsx
// Segmented tab control (Details / Producer / Discussion) — orange active pill.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F } from './ui';

export type GigTabKey = 'details' | 'producer' | 'discussion';

const TABS: { key: GigTabKey; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'producer', label: 'Producer' },
  { key: 'discussion', label: 'Discussion' },
];

export function GigTabs({ value, onChange }: { value: GigTabKey; onChange: (k: GigTabKey) => void }) {
  return (
    <View style={s.wrap}>
      {TABS.map((t) => {
        const on = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[s.tab, on && s.tabOn]}
          >
            <Text style={[s.txt, on && s.txtOn]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 3, marginHorizontal: 20, marginTop: 18, marginBottom: 4, backgroundColor: C.chip, borderWidth: 1, borderColor: C.chipb, borderRadius: 14, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 10 },
  tabOn: { backgroundColor: C.orange },
  txt: { fontFamily: F.semi, fontSize: 13, color: C.t3 },
  txtOn: { color: '#fff' },
});
