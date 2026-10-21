// src/components/inputs/SearchableMultiSelect.tsx
//
// Generic A·Minimal searchable multi-select: a field that shows the current picks
// as removable orange chips + a caret; tapping opens a panel with a search box and
// a wrap of toggleable option pills (orange + tick when selected). Data-driven —
// options are passed in; selection is controlled by the parent.
//
// Extracted from the gig board's performer-type filter
// (DOCS/04-design/mockups/gig-filters-aminimal.html) so any surface — event-type,
// performer-type, city, etc. — reuses the exact look and behaviour. Self-contained
// (A·Minimal tokens inlined), so it carries no cross-feature dependency.
//
// Usage:
//   <SearchableMultiSelect
//     selected={values}                     // string[] of selected option values
//     options={[{value,label}, …]}          // data-driven option list
//     onToggle={(v) => setX(draft, v)}      // toggle one value on/off
//     placeholder="Select event types"
//     searchPlaceholder="Search event types…"
//   />

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import { ChevronDown, Search, Check, X } from 'lucide-react-native';

export type MultiSelectOption = { value: string; label: string };

// A·Minimal tokens (inlined so this input is portable across surfaces).
const C = {
  well: '#212129',
  panel: '#1C1C23',
  hair: 'rgba(255,255,255,0.08)',
  orange: '#FF6B35',
  orangeSoft: 'rgba(255,107,53,0.14)',
  orangeBorder: 'rgba(255,107,53,0.28)',
  orangeOpen: 'rgba(255,107,53,0.4)',
  ink: '#190B05', // text/icon on an orange fill
  cream: '#FFFFFF',
  t2: '#A1A1AA',
  t3: '#8B8B99',
};
const F = { body: 'Outfit-Regular', semi: 'Outfit-SemiBold', bold: 'Outfit-Bold' };

export function SearchableMultiSelect({
  selected,
  options,
  onToggle,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches.',
}: {
  /** Currently-selected option values. */
  selected: string[];
  /** Full option list (data-driven). */
  options: MultiSelectOption[];
  /** Toggle one value on/off. */
  onToggle: (value: string) => void;
  /** Field text when nothing is selected. */
  placeholder?: string;
  /** Search box placeholder. */
  searchPlaceholder?: string;
  /** Shown when the search filters out every option. */
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t)
    );
  }, [q, options]);

  return (
    <View>
      {/* Field — removable chips + caret; tap toggles the panel */}
      <Pressable style={[s.field, open && s.fieldOpen]} onPress={() => setOpen((v) => !v)}>
        {selected.length === 0 ? (
          <Text style={s.ph}>{placeholder}</Text>
        ) : (
          selected.map((v) => (
            // Tapping a chip (or its ×) removes just that value; it does not open the panel.
            <Pressable key={v} style={s.chip} onPress={() => onToggle(v)} hitSlop={4}>
              <Text style={s.chipTxt}>{labelOf(v)}</Text>
              <X size={12} color={C.orange} />
            </Pressable>
          ))
        )}
        <View style={[s.caret, open && { transform: [{ rotate: '180deg' }] }]}>
          <ChevronDown size={18} color={open ? C.orange : C.t3} />
        </View>
      </Pressable>

      {/* Panel — search + toggleable option pills */}
      {open ? (
        <View style={s.panel}>
          <View style={s.search}>
            <Search size={15} color={C.t3} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={searchPlaceholder}
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
              <Text style={s.empty}>{emptyText}</Text>
            ) : (
              filtered.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <Pressable
                    key={o.value}
                    style={[s.pill, on && s.pillOn]}
                    onPress={() => onToggle(o.value)}
                  >
                    {on ? <Check size={11} color={C.ink} /> : null}
                    <Text style={[s.pillTxt, on && s.pillTxtOn]}>{o.label}</Text>
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
  fieldOpen: { borderColor: C.orangeOpen },
  ph: { fontFamily: F.body, fontSize: 13, color: C.t3 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.orangeSoft,
    borderWidth: 1,
    borderColor: C.orangeBorder,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipTxt: { fontFamily: F.semi, fontSize: 12, color: C.orange },
  caret: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  panel: {
    marginTop: 9,
    backgroundColor: C.panel,
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
  pill: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.hair,
  },
  pillOn: { backgroundColor: C.orange, borderColor: C.orange },
  pillTxt: { fontFamily: F.semi, fontSize: 12.5, color: C.t2 },
  pillTxtOn: { color: C.ink, fontFamily: F.bold },
  empty: { fontFamily: F.body, fontSize: 12, color: C.t3, paddingVertical: 4 },
});
