// CL Step 1 (register step 4) — required. Company name + org type + city.
import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, Modal,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { CL_ORG_TYPES } from '@/constants/orgTypes';
import type { CLOFormData } from '@/types/clOnboarding';
import {
  AccentProvider, ROLE_ACCENT, StepHeader, Field, PrimaryButton, RK, RK_FONT,
} from '@/components/auth/register-kit';

const CL = ROLE_ACCENT.creative_lead;

interface Props {
  data: CLOFormData;
  update: (patch: Partial<CLOFormData>) => void;
  onNext: () => void;
}

export default function Step1Identity({ data, update, onNext }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectedType = CL_ORG_TYPES.find(t => t.value === data.organizerTypeCategory);

  const ready =
    data.organizationName.trim().length > 0 &&
    data.organizerTypeCategory.length > 0 &&
    data.city.trim().length > 0;

  return (
    <AccentProvider role="creative_lead">
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
          <StepHeader
            title={'Set up your\ncompany'}
            sub="These three things make your profile usable from day one."
          />

          <Field
            label="COMPANY NAME"
            value={data.organizationName}
            onChangeText={v => update({ organizationName: v })}
            placeholder="e.g. Rhythm & Soul Productions"
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Type dropdown */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>WHAT KIND?</Text>
            <Pressable
              style={[s.dropdown, dropdownOpen && { borderColor: CL.base }]}
              onPress={() => setDropdownOpen(true)}
            >
              <Text style={selectedType ? s.dropdownValue : s.dropdownPlaceholder}>
                {selectedType ? selectedType.label : 'Select a type'}
              </Text>
              <ChevronDown
                size={16}
                color={RK.muted}
                style={{ transform: [{ rotate: dropdownOpen ? '180deg' : '0deg' }] }}
              />
            </Pressable>
          </View>

          <Field
            label="CITY"
            value={data.city}
            onChangeText={v => update({ city: v })}
            placeholder="e.g. Pune"
            autoCapitalize="words"
            returnKeyType="done"
          />

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* CTA */}
        <View style={s.footer}>
          <PrimaryButton label="Continue" onPress={onNext} disabled={!ready} />
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
              <Text style={s.sheetTitle}>WHAT KIND OF COMPANY?</Text>
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {CL_ORG_TYPES.map(({ value, label }) => {
                  const active = data.organizerTypeCategory === value;
                  return (
                    <Pressable
                      key={value}
                      style={[s.optionRow, active && { backgroundColor: CL.soft }]}
                      onPress={() => {
                        update({ organizerTypeCategory: value });
                        setDropdownOpen(false);
                      }}
                    >
                      <Text style={[s.optionLabel, active && s.optionLabelActive]}>{label}</Text>
                      {active && <Check size={15} color={CL.border} strokeWidth={2.5} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </AccentProvider>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 12 },
  fieldWrap: { marginBottom: 16 },
  label:   { fontFamily: RK_FONT.mono, fontSize: 9, letterSpacing: 1.6, color: RK.muted, marginBottom: 7 },
  dropdown: {
    minHeight: 48, borderRadius: 12, backgroundColor: RK.surface, borderWidth: 1, borderColor: RK.hair,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13,
  },
  dropdownValue:       { fontFamily: RK_FONT.body, fontSize: 14.5, color: RK.cream },
  dropdownPlaceholder: { fontFamily: RK_FONT.body, fontSize: 14.5, color: RK.dim },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  optionSheet:  { backgroundColor: RK.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 16, paddingBottom: 32 },
  sheetTitle:   { fontFamily: RK_FONT.mono, fontSize: 9, letterSpacing: 1.6, color: RK.muted, marginBottom: 8, paddingHorizontal: 20 },
  optionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: RK.hair },
  optionLabel:       { fontFamily: RK_FONT.body, fontSize: 14.5, color: RK.cream2 },
  optionLabelActive: { color: RK.cream, fontFamily: RK_FONT.semi },
  // CTA
  footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, backgroundColor: RK.bg },
});
