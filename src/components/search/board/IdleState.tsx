// src/components/search/board/IdleState.tsx
//
// The quiet zero-state shown before anything is typed: Recent (AsyncStorage) ·
// Browse by craft · Popular cities · People you may know. Browse chips + cities
// are a static seed for v1 (crafts drawn from PERFORMER_TYPES, cities from the
// launch wedge); data-driven later. A·Minimal (search mockup, frame 01).

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Clock, MapPin, X } from 'lucide-react-native';
import { C, F } from './theme';
import { PymkRail, PymkSuggestion } from './PymkRail';

// Craft browsing now lives in the persistent CraftRail (a real multi-select
// facet), so the idle state no longer carries its own "Browse by craft" chips.

const POPULAR_CITIES = ['Pune', 'Mumbai', 'Delhi', 'Bengaluru'];

export function IdleState({
  recent,
  onRecentPress,
  onRecentRemove,
  onClearRecent,
  onCity,
  pymkData,
  onOpenProfile,
}: {
  recent: string[];
  onRecentPress: (q: string) => void;
  onRecentRemove: (q: string) => void;
  onClearRecent: () => void;
  onCity: (label: string) => void;
  pymkData?: PymkSuggestion[];
  onOpenProfile?: (userId: string) => void;
}) {
  return (
    <View>
      {recent.length > 0 ? (
        <View style={s.block}>
          <View style={s.head}>
            <Text style={s.eyebrow}>Recent</Text>
            <Pressable onPress={onClearRecent} hitSlop={6}>
              <Text style={s.link}>Clear</Text>
            </Pressable>
          </View>
          <View style={s.chips}>
            {recent.map((q) => (
              <Pressable key={q} onPress={() => onRecentPress(q)} style={s.chip}>
                <Clock size={13} color={C.t4} strokeWidth={1.9} />
                <Text style={s.chipTxt}>{q}</Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onRecentRemove(q);
                  }}
                  hitSlop={8}
                  style={s.rm}
                >
                  <X size={12} color={C.t4} strokeWidth={2} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={s.block}>
        <View style={s.head}>
          <Text style={s.eyebrow}>Popular cities</Text>
        </View>
        <View style={s.chips}>
          {POPULAR_CITIES.map((city) => (
            <Pressable key={city} onPress={() => onCity(city)} style={s.chip}>
              <MapPin size={12} color={C.t4} strokeWidth={1.9} />
              <Text style={s.chipTxt}>{city}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <PymkRail data={pymkData} onOpenProfile={onOpenProfile} />
    </View>
  );
}

const s = StyleSheet.create({
  block: { paddingTop: 18, paddingBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  eyebrow: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1.7, color: C.t4, textTransform: 'uppercase' },
  link: { fontFamily: F.med, fontSize: 12.5, color: C.t3 },
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
  chipTxt: { fontFamily: F.med, fontSize: 13, color: C.t2 },
  chipTxtStrong: { color: C.t1 },
  rm: { marginLeft: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
