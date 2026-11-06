// src/components/search/board/EmptyState.tsx
//
// No-results state: a serif ◇ mark, the query echoed back, and a few fallback
// chips (crafts + a city) to recover with. A·Minimal (search mockup, frame 06).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, MapPin } from 'lucide-react-native';
import { C, F, ORANGE_SOFT, ORANGE_LINE } from './theme';

const FALLBACK: { label: string; kind: 'craft' | 'city'; color?: string }[] = [
  { label: 'Dancer', kind: 'craft', color: C.orange },
  { label: 'Pune', kind: 'city' },
  { label: 'Singer', kind: 'craft', color: C.purple },
  { label: 'Actor', kind: 'craft', color: C.blue },
];

export function EmptyState({
  query,
  selectedCrafts = [],
  onCraft,
  onCity,
}: {
  query: string;
  // Crafts currently in the facet — a craft chip here toggles the facet, so we
  // reflect its on/off state rather than running a one-shot search.
  selectedCrafts?: string[];
  onCraft: (label: string) => void;
  onCity: (label: string) => void;
}) {
  return (
    <View style={s.center}>
      <Text style={s.glyph}>◇</Text>
      <Text style={s.h3}>
        Nothing for <Text style={s.em}>“{query}”</Text>
      </Text>
      <Text style={s.p}>Try a different craft, or a city.</Text>

      <View style={s.fallback}>
        <Text style={s.eyebrow}>Try instead</Text>
        <View style={s.chips}>
          {FALLBACK.map((f) => {
            const on = f.kind === 'craft' && selectedCrafts.includes(f.label);
            return (
              <Pressable
                key={f.label}
                onPress={() => (f.kind === 'craft' ? onCraft(f.label) : onCity(f.label))}
                style={[s.chip, on && s.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                {f.kind === 'craft' ? (
                  on ? (
                    <Check size={12} color={C.orange} strokeWidth={2.4} />
                  ) : (
                    <View style={[s.dot, { backgroundColor: f.color }]} />
                  )
                ) : (
                  <MapPin size={12} color={C.t4} strokeWidth={1.9} />
                )}
                <Text style={[s.chipTxt, f.kind === 'craft' && s.chipTxtStrong, on && s.chipTxtOn]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 20 },
  glyph: { fontFamily: F.serif, fontSize: 52, color: C.t4, lineHeight: 56, marginBottom: 20 },
  h3: { fontFamily: F.serif, fontSize: 21, color: C.cream, textAlign: 'center' },
  em: { fontStyle: 'italic', color: C.orange },
  p: { fontFamily: F.body, fontSize: 13.5, color: C.t3, marginTop: 9, lineHeight: 21, textAlign: 'center' },
  fallback: { marginTop: 30, alignSelf: 'stretch' },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 10.5,
    letterSpacing: 1.7,
    color: C.t4,
    textTransform: 'uppercase',
    marginBottom: 11,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: C.chip,
    borderWidth: 1,
    borderColor: C.hairSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chipOn: { backgroundColor: ORANGE_SOFT, borderColor: ORANGE_LINE },
  chipTxt: { fontFamily: F.med, fontSize: 13, color: C.t2 },
  chipTxtStrong: { color: C.t1 },
  chipTxtOn: { color: C.orange, fontFamily: F.semi },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
