// src/components/search/board/SearchField.tsx
//
// The owned search input: back chevron + a well-field (magnifier · text · clear).
// Controlled; autofocuses on mount so routing in from the top-bar magnifier
// lands the cursor in the field. A·Minimal (search mockup, topbar + .field).

import React, { useRef } from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { C, F } from './theme';

export function SearchField({
  value,
  onChangeText,
  onClear,
  onBack,
  onSubmit,
  autoFocus = true,
  placeholder = 'Artists, gigs, events…',
}: {
  value: string;
  onChangeText: (t: string) => void;
  onClear: () => void;
  onBack: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<TextInput>(null);

  return (
    <View style={s.topbar}>
      <Pressable
        onPress={onBack}
        style={s.back}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <ChevronLeft size={22} color={C.t2} strokeWidth={1.9} />
      </Pressable>

      <View style={s.field}>
        <Search size={18} color={C.t3} strokeWidth={1.9} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={C.t4}
          autoFocus={autoFocus}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={C.orange}
          style={s.input}
          // RN web: strip the focus outline so only the field border shows.
          {...(Platform.OS === 'web' ? ({ style: [s.input, { outlineStyle: 'none' } as any] } as any) : {})}
        />
        {value.length > 0 ? (
          <Pressable
            onPress={onClear}
            style={s.clr}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <X size={12} color={C.t3} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    height: 50,
    backgroundColor: C.well,
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    minWidth: 0,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: F.body,
    fontSize: 15,
    color: C.cream,
    padding: 0,
  },
  clr: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
