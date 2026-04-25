// netsa-mobile/src/components/ui/ChipPicker.tsx
//
// Single- or multi-select chip row. Used extensively across the GigForm v2
// (performer types, event functions, nudity levels, compensation model,
// genres, shoot types, etc.). Extracted from inline repetitions during
// Plan 5 eng-review (P1 #1).

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface ChipOption {
  label: string;
  value: string;
}

export interface ChipPickerProps {
  /** Array of strings OR `{label, value}` objects. Strings treated as both label and value. */
  options: readonly (string | ChipOption)[];
  /** Current selection. Single-select: string. Multi-select: string[]. */
  value: string | string[];
  /** Fires with the full new selection. Single-select tapping a selected chip
   *  to deselect calls onChange with empty string `''`. Multi-select toggle
   *  calls onChange with the new array (omitting the deselected value). */
  onChange: (next: string | string[]) => void;
  /** `single` is the default. `multi` allows toggling multiple values. */
  mode?: 'single' | 'multi';
  /** Optional max selection count for `multi` mode. Silently ignores taps beyond the cap. */
  max?: number;
  /** Accessibility label for the group. */
  accessibilityLabel?: string;
}

function normalizeOptions(opts: readonly (string | ChipOption)[]): ChipOption[] {
  return opts.map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
}

export default function ChipPicker({
  options,
  value,
  onChange,
  mode = 'single',
  max,
  accessibilityLabel,
}: ChipPickerProps) {
  const normalized = normalizeOptions(options);
  const selected: string[] = Array.isArray(value) ? value : value ? [value] : [];

  const handleTap = (optionValue: string) => {
    if (mode === 'single') {
      // Tap-to-deselect: tapping a selected chip clears it (onChange '').
      // Required-field gating happens in the form's guardrail panel, not here.
      if (selected[0] === optionValue) {
        onChange('');
        return;
      }
      onChange(optionValue);
      return;
    }
    // multi
    const isActive = selected.includes(optionValue);
    if (isActive) {
      onChange(selected.filter((v) => v !== optionValue));
      return;
    }
    if (max !== undefined && selected.length >= max) {
      // Silent cap — caller can gate via max and render a nudge elsewhere.
      return;
    }
    onChange([...selected, optionValue]);
  };

  return (
    <View style={styles.row} accessibilityLabel={accessibilityLabel}>
      {normalized.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => handleTap(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1F1F23',
    borderWidth: 1,
    borderColor: '#26262C',
  },
  chipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  chipText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: '#A1A1AA' },
  chipTextActive: { color: '#FFFFFF' },
});
