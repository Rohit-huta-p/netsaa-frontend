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
// Two dismiss modes:
//   • default (inline)    — the panel renders inline below the field and pushes
//                           content down; closed by tapping the field/caret again.
//   • overlay             — the panel renders as a floating popover in a Modal that
//                           closes on an OUTSIDE tap (codebase idiom: BoardSortMenu).
//                           Keyboard-aware: the popover lifts above the keyboard so
//                           the search box + pills stay reachable (this panel has a
//                           TextInput, unlike the plain sort menus). Opt in per use.
//
// Usage:
//   <SearchableMultiSelect
//     selected={values}                     // string[] of selected option values
//     options={[{value,label}, …]}          // data-driven option list
//     onToggle={(v) => setX(draft, v)}      // toggle one value on/off
//     placeholder="Select event types"
//     searchPlaceholder="Search event types…"
//     overlay                               // ← tap-outside-to-close popover
//   />

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, TextInput, ScrollView, StyleSheet,
  Modal, Keyboard, useWindowDimensions,
} from 'react-native';
import { ChevronDown, Search, Check, X, Plus } from 'lucide-react-native';

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
  allowCustom = false,
  overlay = false,
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
  /** Allow typing a custom value not in the list. */
  allowCustom?: boolean;
  /**
   * Render the options as a floating popover (in a Modal) that closes on an
   * outside tap, instead of the default inline panel. Keyboard-aware so the
   * search box + pills stay above the keyboard. Opt in where an inline panel
   * can't catch outside taps (e.g. the Creative Lead "Specialties" editor).
   */
  overlay?: boolean;
}) {
  const { width: winW, height: winH } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  // Overlay-only geometry: the field's on-screen box, the panel's measured
  // height, and the live keyboard height — together they place the popover.
  const fieldRef = useRef<View>(null);
  const [anchor, setAnchor] = useState({ x: 20, y: 140, w: winW - 40, h: 48 });
  const [panelH, setPanelH] = useState(260);
  const [kb, setKb] = useState(0);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t)
    );
  }, [q, options]);

  const customValue = q.trim();
  const exactMatch = options.some(
    (o) => o.value.toLowerCase() === customValue.toLowerCase() ||
           o.label.toLowerCase() === customValue.toLowerCase()
  );
  const showAddRow = allowCustom && customValue.length > 0 && !exactMatch && !selected.includes(customValue);

  const close = () => setOpen(false);

  // Track the keyboard (overlay only) so the popover can lift clear of it.
  useEffect(() => {
    if (!overlay) return;
    const onShow = Keyboard.addListener('keyboardDidShow', (e) => setKb(e.endCoordinates?.height ?? 0));
    const onHide = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => { onShow?.remove?.(); onHide?.remove?.(); };
  }, [overlay]);

  // Open the overlay popover, measuring the field so the panel anchors under it.
  // `setOpen` first (so the button never feels dead if measure is a no-op, e.g.
  // on web/tests); the measure callback then refines the anchor one frame later.
  const openOverlay = () => {
    setOpen(true);
    fieldRef.current?.measureInWindow?.((x, y, w, h) => {
      if (w) setAnchor({ x, y, w, h });
    });
  };

  // Place the popover under the field, or flip it above when the keyboard or the
  // screen bottom would cover it.
  const below = anchor.y + anchor.h + 9;
  const fitsBelow = below + panelH <= winH - kb - 12;
  const top = fitsBelow ? below : Math.max(12, anchor.y - 9 - panelH);

  // The panel interior (search + option pills) — shared by both dismiss modes.
  const panelBody = (
    <>
      <View style={s.search}>
        <Search size={15} color={C.t3} />
        <TextInput
          testID="msms-search"
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
        {showAddRow && (
          <Pressable
            testID="msms-addrow"
            style={s.addRow}
            onPress={() => { onToggle(customValue); setQ(''); }}
          >
            <Plus size={13} color={C.orange} strokeWidth={2.5} />
            <Text style={s.addRowTxt}>Add "{customValue}"</Text>
          </Pressable>
        )}
        {filtered.length === 0 && !showAddRow ? (
          <Text style={s.empty}>{emptyText}</Text>
        ) : (
          filtered.map((o) => {
            const on = selected.includes(o.value);
            return (
              <Pressable
                key={o.value}
                testID={`msms-opt-${o.value}`}
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
    </>
  );

  return (
    <View>
      {/* Field — removable chips + caret; tap toggles (inline) or opens (overlay). */}
      <View ref={fieldRef} collapsable={false}>
        <Pressable
          testID="msms-field"
          style={[s.field, open && s.fieldOpen]}
          onPress={() => (overlay ? openOverlay() : setOpen((v) => !v))}
        >
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
      </View>

      {/* Inline panel (default) — pushes content down; close by tapping the field again. */}
      {!overlay && open ? <View style={s.panel}>{panelBody}</View> : null}

      {/* Overlay popover — a full-screen backdrop catches the OUTSIDE tap and closes. */}
      {overlay && open ? (
        <Modal visible transparent animationType="fade" onRequestClose={close}>
          <Pressable style={s.backdrop} onPress={close} testID="msms-backdrop">
            {/* Inner no-op Pressable swallows taps so they don't bubble to the backdrop. */}
            <Pressable
              style={[s.panel, s.panelFloat, { top, left: anchor.x, width: anchor.w }]}
              onPress={() => {}}
              onLayout={(e) => setPanelH(e.nativeEvent.layout.height)}
            >
              {panelBody}
            </Pressable>
          </Pressable>
        </Modal>
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
  // Overlay popover: absolutely positioned at the measured anchor, with a lift.
  panelFloat: {
    position: 'absolute',
    marginTop: 0,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  backdrop: { flex: 1 },
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.orangeBorder,
    backgroundColor: C.orangeSoft,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  addRowTxt: { fontFamily: F.semi, fontSize: 12.5, color: C.orange },
});
