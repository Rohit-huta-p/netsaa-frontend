// CL Step 4 (register step 7) — optional. Website + years + team size + Instagram. Triggers the PATCH on Finish.
import React from 'react';
import {
  View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import type { CLOFormData } from '@/types/clOnboarding';
import {
  AccentProvider, StepHeader, Field, PrimaryButton, RK, RK_FONT,
} from '@/components/auth/register-kit';

interface Props {
  data: CLOFormData;
  update: (patch: Partial<CLOFormData>) => void;
  onFinish: () => Promise<void>;
  onSkip: () => Promise<void>;
  saving: boolean;
}

export default function Step4Details({ data, update, onFinish, onSkip, saving }: Props) {
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
            title={'A few more\ndetails'}
            sub="Optional — but they help build trust with artists and hirers."
          />

          <Field
            label="WEBSITE"
            value={data.organizationWebsite}
            onChangeText={v => update({ organizationWebsite: v })}
            placeholder="https://yourcompany.com"
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="done"
          />

          <Field
            label="YEARS ACTIVE"
            value={data.yearsInBusiness}
            onChangeText={v => update({ yearsInBusiness: v.replace(/\D/g, '') })}
            placeholder="e.g. 5"
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={2}
            helper="How many years has the company been active?"
          />

          <Field
            label="TEAM SIZE"
            value={data.teamSize}
            onChangeText={v => update({ teamSize: v.replace(/\D/g, '') })}
            placeholder="e.g. 12"
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={4}
            helper="Full-time + regular freelancers you work with"
          />

          <Field
            label="INSTAGRAM"
            prefix="@"
            value={data.instagramHandle ?? ''}
            onChangeText={v => update({ instagramHandle: v.replace(/^@+/, '') })}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />

          <View style={{ height: 80 }} />
        </ScrollView>

        <View style={s.footer}>
          <PrimaryButton label="Finish setup" onPress={onFinish} loading={saving} />
          <Pressable onPress={onSkip} style={s.skipLink} disabled={saving}>
            <Text style={[s.skipText, saving && { opacity: 0.4 }]}>Skip</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AccentProvider>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 24, paddingTop: 12 },
  footer:   { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, backgroundColor: RK.bg },
  skipLink: { paddingVertical: 10, alignItems: 'center' },
  skipText: { fontFamily: RK_FONT.body, fontSize: 13, color: RK.muted },
});
