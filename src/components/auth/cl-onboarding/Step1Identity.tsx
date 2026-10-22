// Step 1 — required. Company name + org type + city.
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { CL_ORG_TYPES } from '@/constants/orgTypes';
import type { CLOFormData } from '@/types/clOnboarding';

interface Props {
  data: CLOFormData;
  update: (patch: Partial<CLOFormData>) => void;
  onNext: () => void;
}

export default function Step1Identity({ data, update, onNext }: Props) {
  const [nameFocused, setNameFocused] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);

  const ready =
    data.organizationName.trim().length > 0 &&
    data.organizerTypeCategory.length > 0 &&
    data.city.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <Text style={s.headline}>Set up your{'\n'}company</Text>
        <Text style={s.sub}>These three things make your profile usable from day one.</Text>

        {/* Name */}
        <Text style={s.label}>COMPANY NAME</Text>
        <TextInput
          style={[s.input, nameFocused && s.inputFocused]}
          placeholder="e.g. Rhythm & Soul Productions"
          placeholderTextColor="rgba(245,245,240,0.22)"
          value={data.organizationName}
          onChangeText={v => update({ organizationName: v })}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          autoCapitalize="words"
          returnKeyType="done"
        />

        {/* Type */}
        <Text style={[s.label, { marginTop: 20 }]}>WHAT KIND?</Text>
        <View style={s.typeList}>
          {CL_ORG_TYPES.map(({ value, label }) => {
            const active = data.organizerTypeCategory === value;
            return (
              <Pressable
                key={value}
                style={[s.typeRow, active && s.typeRowActive]}
                onPress={() => update({ organizerTypeCategory: value })}
              >
                <View style={[s.radioDot, active && s.radioDotActive]} />
                <Text style={[s.typeLabel, active && s.typeLabelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* City */}
        <Text style={[s.label, { marginTop: 20 }]}>CITY</Text>
        <TextInput
          style={[s.input, cityFocused && s.inputFocused]}
          placeholder="e.g. Pune"
          placeholderTextColor="rgba(245,245,240,0.22)"
          value={data.city}
          onChangeText={v => update({ city: v })}
          onFocus={() => setCityFocused(true)}
          onBlur={() => setCityFocused(false)}
          autoCapitalize="words"
          returnKeyType="done"
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={s.ctaWrap}>
        <Pressable
          style={[s.cta, !ready && s.ctaDisabled]}
          onPress={onNext}
          disabled={!ready}
        >
          <Text style={[s.ctaText, !ready && s.ctaTextDisabled]}>Continue</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  scroll:        { flex: 1 },
  content:       { paddingHorizontal: 20, paddingTop: 12 },
  headline:      { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 34, color: '#F5F5F0', lineHeight: 42, marginBottom: 6 },
  sub:           { fontFamily: 'Outfit-Light', fontSize: 13, color: 'rgba(245,245,240,0.45)', lineHeight: 19, marginBottom: 28 },
  label:         { fontFamily: 'SpaceMono-Regular', fontSize: 9, letterSpacing: 1.4, color: 'rgba(245,245,240,0.28)', marginBottom: 8 },
  input:         { backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Outfit-Regular', fontSize: 15, color: '#F5F5F0' },
  inputFocused:  { borderColor: '#FF6B35' },
  typeList:      { gap: 4 },
  typeRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 10 },
  typeRowActive: { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.07)' },
  radioDot:      { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(245,245,240,0.22)', backgroundColor: 'transparent' },
  radioDotActive:{ borderColor: '#FF6B35', backgroundColor: '#FF6B35' },
  typeLabel:     { fontFamily: 'Outfit-Regular', fontSize: 14, color: 'rgba(245,245,240,0.55)', flex: 1 },
  typeLabelActive:{ color: '#F5F5F0', fontFamily: 'Outfit-SemiBold' },
  ctaWrap:       { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12, backgroundColor: '#121216' },
  cta:           { backgroundColor: '#FF6B35', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  ctaDisabled:   { backgroundColor: 'rgba(255,107,53,0.18)' },
  ctaText:       { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#0A0A0F' },
  ctaTextDisabled:{ color: 'rgba(245,245,240,0.25)' },
});
