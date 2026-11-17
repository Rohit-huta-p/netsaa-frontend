// src/components/inputs/MultiSelectDropdown.tsx
//
// A·Minimal multi-select: a field that opens a dropdown LIST of options (a
// checkbox per row); selected values collect as removable orange pills BELOW
// the field. Controlled by the parent. Colors from the shared formTokens.
//
// Differs from SearchableMultiSelect (which keeps chips inside the field and
// adds a search box) — this is the "select → list → pills-below" pattern used
// for the gig-form Performer type.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';
import { SURFACE, BORDER, ACCENT, TEXT, FONT, RADIUS } from '@/constants/formTokens';

export type MultiSelectOption = { value: string; label: string };

interface Props {
  /** Selected option values (controlled). */
  value: string[];
  /** Option list — plain strings or {value,label}. */
  options: readonly (string | MultiSelectOption)[];
  /** Called with the next selection whenever a row/pill is toggled. */
  onChange: (next: string[]) => void;
  /** Field text when nothing is selected. */
  placeholder?: string;
  accessibilityLabel?: string;
}

export function MultiSelectDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  accessibilityLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const opts: MultiSelectOption[] = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  const labelOf = (v: string) => opts.find((o) => o.value === v)?.label ?? v;

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <View>
      {/* Field — count + caret; tap toggles the dropdown */}
      <Pressable
        style={[s.field, open && s.fieldOpen]}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Text style={value.length ? s.value : s.ph}>
          {value.length ? `${value.length} selected · tap to add more` : placeholder}
        </Text>
        <ChevronDown
          size={18}
          color={open ? ACCENT.primary : TEXT.key}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {/* Dropdown — a list of options with a checkbox each */}
      {open && (
        <View style={s.panel}>
          {opts.map((o, i) => {
            const on = value.includes(o.value);
            return (
              <Pressable
                key={o.value}
                style={[s.row, i === opts.length - 1 && s.rowLast]}
                onPress={() => toggle(o.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <Text style={[s.rowTxt, on && s.rowTxtOn]}>{o.label}</Text>
                <View style={[s.box, on && s.boxOn]}>
                  {on && <Check size={12} color={TEXT.onAccent} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Selected pills — below the field, tap to remove */}
      {value.length > 0 && (
        <View style={s.pills}>
          {value.map((v) => (
            <Pressable
              key={v}
              style={s.pill}
              onPress={() => toggle(v)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${labelOf(v)}`}
            >
              <Text style={s.pillTxt}>{labelOf(v)}</Text>
              <X size={13} color={ACCENT.primary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  field: {
    minHeight: 50,
    borderRadius: RADIUS.well,
    backgroundColor: SURFACE.wellTranslucent,
    borderWidth: 1,
    borderColor: BORDER.well,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  fieldOpen: { borderColor: ACCENT.border40 },
  ph: { fontFamily: FONT.regular, fontSize: 14, color: TEXT.placeholder },
  value: { fontFamily: FONT.regular, fontSize: 14, color: TEXT.value },
  panel: {
    marginTop: 8,
    backgroundColor: SURFACE.sheet,
    borderWidth: 1,
    borderColor: BORDER.default,
    borderRadius: RADIUS.well,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.045)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowTxt: { fontFamily: FONT.regular, fontSize: 14, color: TEXT.chip },
  rowTxtOn: { color: ACCENT.primary, fontFamily: FONT.semibold },
  box: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#4A4A55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: ACCENT.primary, borderColor: ACCENT.primary },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 12,
    paddingRight: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: ACCENT.tint14,
    borderWidth: 1,
    borderColor: ACCENT.border32,
  },
  pillTxt: { fontFamily: FONT.semibold, fontSize: 13, color: ACCENT.primary },
});
