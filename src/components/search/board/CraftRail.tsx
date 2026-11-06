// src/components/search/board/CraftRail.tsx
//
// Persistent multi-select craft facet under the search input. Unlike the old
// "Browse by craft" chips (which ran a single-shot text search and replaced one
// another), these are real toggle filters: selecting Dancer + Actor shows BOTH
// (OR), as a structured facet sent to the backend (people.artistType,
// gig.artistTypes, event.eligibleArtistTypes). Always visible — idle and active
// — so the facet can be refined while viewing results. A·Minimal chip language.

import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { C, F, ORANGE_SOFT, ORANGE_LINE } from './theme';

// The coarse craft taxonomy the facet exposes. Values are sent verbatim to the
// backend (matched case-insensitively against each vertical's artist-type field).
export const CRAFTS: { label: string; color: string }[] = [
  { label: 'Dancer', color: C.orange },
  { label: 'Singer', color: C.purple },
  { label: 'Actor', color: C.blue },
  { label: 'Musician', color: C.green },
  { label: 'Model', color: C.gold },
  { label: 'Photographer', color: '#F43F5E' },
  { label: 'DJ', color: '#0EA5E9' },
];

export function CraftRail({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[];
  onToggle: (craft: string) => void;
  onClear: () => void;
}) {
  const any = selected.length > 0;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.row}
      keyboardShouldPersistTaps="handled"
    >
      {CRAFTS.map((c) => {
        const on = selected.includes(c.label);
        return (
          <Pressable
            key={c.label}
            onPress={() => onToggle(c.label)}
            style={[s.chip, on && s.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${c.label}${on ? ', selected' : ''}`}
          >
            {on ? (
              <Check size={13} color={C.orange} strokeWidth={2.4} />
            ) : (
              <View style={[s.dot, { backgroundColor: c.color }]} />
            )}
            <Text style={[s.txt, on && s.txtOn]}>{c.label}</Text>
          </Pressable>
        );
      })}

      {any ? (
        <Pressable onPress={onClear} style={s.clear} hitSlop={6} accessibilityRole="button" accessibilityLabel="Clear crafts">
          <X size={13} color={C.t3} strokeWidth={2.2} />
          <Text style={s.clearTxt}>Clear</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingTop: 2, paddingBottom: 14 },
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
  dot: { width: 6, height: 6, borderRadius: 3 },
  txt: { fontFamily: F.med, fontSize: 13, color: C.t2 },
  txtOn: { color: C.orange, fontFamily: F.semi },
  clear: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clearTxt: { fontFamily: F.med, fontSize: 12.5, color: C.t3 },
});
