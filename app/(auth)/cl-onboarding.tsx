// app/(auth)/cl-onboarding.tsx
// "Set up your company" — 4-step wizard for creative_lead after registration.
// Write-point: PATCH /organizers/me + PATCH /auth/me after all steps, before the done carousel.

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, Alert, BackHandler, Platform } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import authService from '@/services/authService';
import Step1Identity from '@/components/auth/cl-onboarding/Step1Identity';
import Step2Visual from '@/components/auth/cl-onboarding/Step2Visual';
import Step3About from '@/components/auth/cl-onboarding/Step3About';
import Step4Details from '@/components/auth/cl-onboarding/Step4Details';
import DoneCarousel from '@/components/auth/cl-onboarding/DoneCarousel';
import type { CLOFormData } from '@/types/clOnboarding';

export type { CLOFormData };

const EMPTY: CLOFormData = {
  organizationName: '', organizerTypeCategory: '', city: '',
  logoUrl: '', coverUrl: '',
  bio: '', services: [],
  organizationWebsite: '', yearsInBusiness: '', teamSize: '',
};

const STEP_INFO = [
  { label: 'IDENTITY', required: true  },
  { label: 'VISUAL',   required: false },
  { label: 'ABOUT',    required: false },
  { label: 'DETAILS',  required: false },
];

export default function CLOnboarding() {
  const [step, setStep]     = useState(0);
  const [data, setData]     = useState<CLOFormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const queryClient         = useQueryClient();

  // User is already registered — back should go to the app, not the auth stack.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/(app)/dashboard');
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  // Web: intercept browser back button (popstate) — same logic.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
      router.replace('/(app)/dashboard');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const update = useCallback(
    (patch: Partial<CLOFormData>) => setData(prev => ({ ...prev, ...patch })),
    [],
  );

  const next = useCallback(() => setStep(s => s + 1), []);

  const finish = useCallback(async () => {
    setSaving(true);
    try {
      const orgPatch: Record<string, any> = {
        organizationName:       data.organizationName.trim(),
        organizerTypeCategory:  data.organizerTypeCategory,
      };
      if (data.logoUrl)                    orgPatch.logoUrl              = data.logoUrl;
      if (data.bio.trim())                 orgPatch.bio                  = data.bio.trim();
      if (data.services.length)            orgPatch.services             = data.services;
      if (data.organizationWebsite.trim()) orgPatch.organizationWebsite  = data.organizationWebsite.trim();
      if (data.yearsInBusiness)            orgPatch.yearsInBusiness      = Number(data.yearsInBusiness);
      if (data.teamSize)                   orgPatch.teamSize             = Number(data.teamSize);
      await authService.updateOrganizerProfile(orgPatch);

      const userPatch: Record<string, any> = {};
      if (data.city.trim())  userPatch.primaryCity    = data.city.trim();
      if (data.coverUrl)     userPatch.coverImageUrl  = data.coverUrl;
      if (Object.keys(userPatch).length) await authService.updateProfile(userPatch as any);

      queryClient.invalidateQueries({ queryKey: ['organizer', 'me'] });
      setStep(4);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [data, queryClient]);

  if (step === 4) {
    return <DoneCarousel onDone={() => router.replace('/(app)/dashboard')} />;
  }

  const { required } = STEP_INFO[step];

  return (
    <SafeAreaView style={s.root}>
      {/* Disable swipe-back on iOS — user is already registered */}
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#121216" />
      <View style={s.hdr}>
        <View style={s.metaRow}>
          <Text style={s.stepNum}>STEP {step + 1} OF 4</Text>
          {!required && <Text style={s.optTag}>· OPTIONAL</Text>}
        </View>
        <View style={s.barRow}>
          {STEP_INFO.map((_, i) => (
            <View key={i} style={[s.barSeg, i <= step && s.barOn]} />
          ))}
        </View>
      </View>

      {step === 0 && <Step1Identity data={data} update={update} onNext={next} />}
      {step === 1 && <Step2Visual   data={data} update={update} onNext={next} onSkip={next} />}
      {step === 2 && <Step3About    data={data} update={update} onNext={next} onSkip={next} />}
      {step === 3 && (
        <Step4Details
          data={data}
          update={update}
          onFinish={finish}
          onSkip={finish}
          saving={saving}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#121216' },
  hdr:     { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  stepNum: { fontFamily: 'SpaceMono-Regular', fontSize: 9, letterSpacing: 1.4, color: 'rgba(245,245,240,0.28)' },
  optTag:  { fontFamily: 'SpaceMono-Regular', fontSize: 9, letterSpacing: 1.4, color: 'rgba(245,245,240,0.16)' },
  barRow:  { flexDirection: 'row', gap: 4 },
  barSeg:  { flex: 1, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  barOn:   { backgroundColor: '#FF6B35' },
});
