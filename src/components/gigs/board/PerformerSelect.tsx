// src/components/gigs/board/PerformerSelect.tsx
//
// Searchable, data-driven performer multi-select for the filter sheet. Field
// shows selected crafts as removable orange chips + caret; tapping opens a panel
// with a search box and scrollable option pills. Options are passed in
// (ARTIST_OPTIONS ∪ crafts present in the data) so a craft that exists in gigs
// but isn't hardcoded still appears. Selecting a pill toggles via the existing
// setArtist wiring (handled by the parent) — FilterState stays identical.

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import { ChevronDown, Search, Check, X } from 'lucide-react-native';
import type { FilterOption } from '@/components/gigs/discovery/gigFilterOptions';
import { C, F, INK, ORANGE_SOFT } from './theme';

export function PerformerSelect({
  selected,
  options,
  onToggle,
}: {
  selected: string[];
  options: FilterOption[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter((o) => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t));
  }, [q, options]);

  return (
    <View>
      <Pressable style={[s.field, open && s.fieldOpen]} onPress={() => setOpen((v) => !v)}>
        {selected.length === 0 ? (
          <Text style={s.ph}>Select performer types</Text>
        ) : (
          selected.map((v) => (
            <Pressable key={v} style={s.selChip} onPress={() => onToggle(v)} hitSlop={4}>
              <Text style={s.selChipTxt}>{labelOf(v)}</Text>
              <X size={12} color={C.orange} />
            </Pressable>
          ))
        )}
        <View style={[s.caret, open && { transform: [{ rotate: '180deg' }] }]}>
          <ChevronDown size={18} color={open ? C.orange : C.t3} />
        </View>
      </Pressable>

      {open ? (
        <View style={s.panel}>
          <View style={s.search}>
            <Search size={15} color={C.t3} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search crafts…"
              placeholderTextColor={C.t3}
              style={s.searchInput}
            />
          </View>
          <ScrollView
            style={{ maxHeight: 168 }}
            contentContainerStyle={s.opts}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.length === 0 ? (
              <Text style={s.empty}>No crafts match.</Text>
            ) : (
              filtered.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <Pressable key={o.value} style={[s.optPill, on && s.optPillOn]} onPress={() => onToggle(o.value)}>
                    {on ? <Check size={11} color={INK} /> : null}
                    <Text style={[s.optTxt, on && s.optTxtOn]}>{o.label}</Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  field: {
    minHeight: 48,
    backgroundColor: C.well,
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 13,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 12,
    paddingRight: 44,
    paddingVertical: 8,
    position: 'relative',
  },
  fieldOpen: { borderColor: 'rgba(255,107,53,0.4)' },
  ph: { fontFamily: F.body, fontSize: 13, color: C.t3 },
  selChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ORANGE_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.28)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  selChipTxt: { fontFamily: F.semi, fontSize: 12, color: C.orange },
  caret: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  panel: {
    marginTop: 9,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 13,
    padding: 11,
  },
  search: {
    height: 40,
    backgroundColor: C.well,
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: C.cream, fontFamily: F.body, fontSize: 13, padding: 0 },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optPill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.hair,
  },
  optPillOn: { backgroundColor: C.orange, borderColor: C.orange },
  optTxt: { fontFamily: F.semi, fontSize: 12.5, color: C.t2 },
  optTxtOn: { color: INK, fontFamily: F.bold },
  empty: { fontFamily: F.body, fontSize: 12, color: C.t3, paddingVertical: 4 },
});
