// Step 1 — required. Company name + org type + city.
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Modal,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedType = CL_ORG_TYPES.find(t => t.value === data.organizerTypeCategory);

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

        {/* Type dropdown */}
        <Text style={[s.label, { marginTop: 20 }]}>WHAT KIND?</Text>
        <Pressable
          style={[s.dropdownBtn, dropdownOpen && s.inputFocused]}
          onPress={() => setDropdownOpen(true)}
        >
          <Text style={selectedType ? s.dropdownValue : s.dropdownPlaceholder}>
            {selectedType ? selectedType.label : 'Select type'}
          </Text>
          <ChevronDown
            size={16}
            color="rgba(245,245,240,0.35)"
            style={{ transform: [{ rotate: dropdownOpen ? '180deg' : '0deg' }] }}
          />
        </Pressable>

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

      {/* Dropdown modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setDropdownOpen(false)}>
          <Pressable style={s.optionSheet} onPress={e => e.stopPropagation()}>
            <Text style={s.sheetTitle}>What kind of company?</Text>
            {CL_ORG_TYPES.map(({ value, label }) => {
              const active = data.organizerTypeCategory === value;
              return (
                <Pressable
                  key={value}
                  style={[s.optionRow, active && s.optionRowActive]}
                  onPress={() => {
                    update({ organizerTypeCategory: value });
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={[s.optionLabel, active && s.optionLabelActive]}>{label}</Text>
                  {active && <Check size={14} color="#FF6B35" />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  scroll:        { flex: 1 },
  content:       { paddingHorizontal: 20, paddingTop: 12 },
  headline:      { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 34, color: '#F5F5F0', lineHeight: 42, marginBottom: 6 },
  sub:           { fontFamily: 'Outfit-Light', fontSize: 13, color: 'rgba(245,245,240,0.45)', lineHeight: 19, marginBottom: 28 },
  label:         { fontFamily: 'SpaceMono-Regular', fontSize: 10, letterSpacing: 1.3, color: 'rgba(245,245,240,0.78)', marginBottom: 8 },
  input:         { backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Outfit-Regular', fontSize: 15, color: '#F5F5F0' },
  inputFocused:  { borderColor: '#FF6B35' },
  // Dropdown trigger
  dropdownBtn:         { backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownValue:       { fontFamily: 'Outfit-Regular', fontSize: 15, color: '#F5F5F0' },
  dropdownPlaceholder: { fontFamily: 'Outfit-Regular', fontSize: 15, color: 'rgba(245,245,240,0.22)' },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  optionSheet:   { backgroundColor: '#1C1C23', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 16, paddingBottom: 32, paddingHorizontal: 0 },
  sheetTitle:    { fontFamily: 'SpaceMono-Regular', fontSize: 10, letterSpacing: 1.3, color: 'rgba(245,245,240,0.4)', marginBottom: 8, paddingHorizontal: 20 },
  optionRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  optionRowActive: { backgroundColor: 'rgba(255,107,53,0.07)' },
  optionLabel:   { fontFamily: 'Outfit-Regular', fontSize: 15, color: 'rgba(245,245,240,0.65)' },
  optionLabelActive: { color: '#F5F5F0', fontFamily: 'Outfit-SemiBold' },
  // CTA
  ctaWrap:       { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12, backgroundColor: '#121216' },
  cta:           { backgroundColor: '#FF6B35', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  ctaDisabled:   { backgroundColor: 'rgba(255,107,53,0.18)' },
  ctaText:       { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#0A0A0F' },
  ctaTextDisabled:{ color: 'rgba(245,245,240,0.25)' },
});
