// src/components/search/board/ScopeTabs.tsx
//
// Scope strip: All · People · Gigs · Events. Underlined editorial tabs; active =
// cream label + orange underline + orange mono count. Counts come from each
// type's meta.total (the All count is their sum) — this is the fix for the old
// board's always-"00" counts. A·Minimal (search mockup, .tabs/.tab).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, F } from './theme';

export type Scope = 'All' | 'People' | 'Gigs' | 'Events';
export const SCOPES: Scope[] = ['All', 'People', 'Gigs', 'Events'];

export function ScopeTabs({
  value,
  counts,
  onChange,
}: {
  value: Scope;
  // Per-scope totals; undefined while a count is still loading (renders blank).
  counts: Partial<Record<Scope, number | undefined>>;
  onChange: (s: Scope) => void;
}) {
  return (
    <View style={s.tabs}>
      {SCOPES.map((scope) => {
        const on = scope === value;
        const n = counts[scope];
        return (
          <Pressable key={scope} onPress={() => onChange(scope)} style={s.tab}>
            <Text style={[s.label, on && s.labelOn]}>
              {scope}
              {typeof n === 'number' ? (
                <Text style={[s.count, on && s.countOn]}> {n}</Text>
              ) : null}
            </Text>
            {on ? <View style={s.underline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.hairSoft,
  },
  tab: {
    paddingTop: 6,
    paddingBottom: 13,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: { fontFamily: F.semi, fontSize: 14, color: C.t3 },
  labelOn: { color: C.cream },
  count: { fontFamily: F.mono, fontSize: 10, color: C.t4 },
  countOn: { color: C.orange },
  underline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    borderRadius: 2,
    backgroundColor: C.orange,
  },
});
