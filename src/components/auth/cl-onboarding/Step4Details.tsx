// Step 4 — optional. Website + years + team size. Triggers the PATCH on Finish.
import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import type { CLOFormData } from '@/types/clOnboarding';

interface Props {
  data: CLOFormData;
  update: (patch: Partial<CLOFormData>) => void;
  onFinish: () => Promise<void>;
  onSkip: () => Promise<void>;
  saving: boolean;
}

export default function Step4Details({ data, update, onFinish, onSkip, saving }: Props) {
  const [focused, setFocused] = useState<string | null>(null);

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
        <Text style={s.headline}>A few more{'\n'}details</Text>
        <Text style={s.sub}>Optional — but they help build trust with artists and hirers.</Text>

        {/* Website */}
        <Text style={s.label}>WEBSITE</Text>
        <TextInput
          style={[s.input, focused === 'web' && s.inputFocused]}
          placeholder="https://yourcompany.com"
          placeholderTextColor="rgba(245,245,240,0.22)"
          value={data.organizationWebsite}
          onChangeText={v => update({ organizationWebsite: v })}
          onFocus={() => setFocused('web')}
          onBlur={() => setFocused(null)}
          autoCapitalize="none"
          keyboardType="url"
          returnKeyType="done"
        />

        {/* Years active */}
        <Text style={[s.label, { marginTop: 20 }]}>YEARS ACTIVE</Text>
        <TextInput
          style={[s.input, focused === 'years' && s.inputFocused]}
          placeholder="e.g. 5"
          placeholderTextColor="rgba(245,245,240,0.22)"
          value={data.yearsInBusiness}
          onChangeText={v => update({ yearsInBusiness: v.replace(/\D/g, '') })}
          onFocus={() => setFocused('years')}
          onBlur={() => setFocused(null)}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={2}
        />
        <Text style={s.fieldHint}>How many years has the company been active?</Text>

        {/* Team size */}
        <Text style={[s.label, { marginTop: 20 }]}>TEAM SIZE</Text>
        <TextInput
          style={[s.input, focused === 'team' && s.inputFocused]}
          placeholder="e.g. 12"
          placeholderTextColor="rgba(245,245,240,0.22)"
          value={data.teamSize}
          onChangeText={v => update({ teamSize: v.replace(/\D/g, '') })}
          onFocus={() => setFocused('team')}
          onBlur={() => setFocused(null)}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={4}
        />
        <Text style={s.fieldHint}>Full-time + regular freelancers you work with</Text>

        {/* Instagram placeholder — Phase 2 */}
        <View style={s.p2Row}>
          <Text style={s.p2Label}>INSTAGRAM</Text>
          <View style={s.p2Input}>
            <Text style={s.p2Text}>Coming soon</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={s.ctaRow}>
        <Pressable style={s.skipBtn} onPress={onSkip} disabled={saving}>
          <Text style={s.skipText}>Skip</Text>
        </Pressable>
        <Pressable style={s.finishBtn} onPress={onFinish} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#0A0A0F" />
            : <Text style={s.finishText}>Finish setup</Text>
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  scroll:      { flex: 1 },
  content:     { paddingHorizontal: 20, paddingTop: 12 },
  headline:    { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 34, color: '#F5F5F0', lineHeight: 42, marginBottom: 6 },
  sub:         { fontFamily: 'Outfit-Light', fontSize: 13, color: 'rgba(245,245,240,0.45)', lineHeight: 19, marginBottom: 28 },
  label:       { fontFamily: 'SpaceMono-Regular', fontSize: 9, letterSpacing: 1.4, color: 'rgba(245,245,240,0.28)', marginBottom: 8 },
  input:       { backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Outfit-Regular', fontSize: 15, color: '#F5F5F0' },
  inputFocused:{ borderColor: '#FF6B35' },
  fieldHint:   { fontFamily: 'Outfit-Light', fontSize: 11, color: 'rgba(245,245,240,0.25)', marginTop: 5 },
  p2Row:       { marginTop: 24 },
  p2Label:     { fontFamily: 'SpaceMono-Regular', fontSize: 9, letterSpacing: 1.4, color: 'rgba(245,245,240,0.14)', marginBottom: 8 },
  p2Input:     { backgroundColor: 'rgba(28,28,35,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  p2Text:      { fontFamily: 'Outfit-Regular', fontSize: 14, color: 'rgba(245,245,240,0.18)' },
  ctaRow:      { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12, backgroundColor: '#121216' },
  skipBtn:     { flex: 1, paddingVertical: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#1C1C23', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  skipText:    { fontFamily: 'Outfit-Regular', fontSize: 14, color: 'rgba(245,245,240,0.45)' },
  finishBtn:   { flex: 2, paddingVertical: 15, alignItems: 'center', borderRadius: 12, backgroundColor: '#FF6B35' },
  finishText:  { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#0A0A0F' },
});
