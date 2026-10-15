import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';
import { useComposerStoreV4 } from './useComposerStoreV4';
import { ProgressDots, FooterBar } from './ui';
import { C, F } from './theme';
import Step1Event from './steps/Step1Event';
import Step2WhereWhen from './steps/Step2WhereWhen';
import Step3Spots from './steps/Step3Spots';
import Step4Register from './steps/Step4Register';
import Step5Describe from './steps/Step5Describe';
import Step6Publish from './steps/Step6Publish';

const STEP_LABELS = ['Event', 'Where', 'Spots', 'Register', 'Describe', 'Review'];
const STEP_META: Record<number, { eyebrow: string; title: string }> = {
  1: { eyebrow: 'the event', title: 'What are you putting on?' },
  2: { eyebrow: 'when & where', title: 'When and where?' },
  3: { eyebrow: 'spots', title: 'Who can come, and how many?' },
  4: { eyebrow: 'registration', title: 'How do people get in?' },
  5: { eyebrow: 'describe', title: 'Tell people about it.' },
  6: { eyebrow: 'review', title: 'A last look.' },
};

export default function ComposerShellV4({ onPublish, onClose, publishing }: {
  onPublish: () => void; onClose: () => void; publishing?: boolean;
}) {
  const step = useComposerStoreV4((s) => s.step);
  const editMode = useComposerStoreV4((s) => s.editMode);
  const next = useComposerStoreV4((s) => s.next);
  const back = useComposerStoreV4((s) => s.back);
  const meta = STEP_META[step];

  const goBack = () => (step > 1 ? back() : onClose());

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={st.nav}>
        <Pressable onPress={goBack} hitSlop={10} style={st.navBtn} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={18} color={C.t2} />
        </Pressable>
        <Text style={st.navTitle}>{editMode ? 'Edit event' : 'New event'}</Text>
        <Pressable onPress={onClose} hitSlop={10} style={st.navBtn} accessibilityRole="button" accessibilityLabel="Close">
          <X size={18} color={C.t2} />
        </Pressable>
      </View>

      <View style={st.prog}><ProgressDots step={step} steps={STEP_LABELS} /></View>

      <View style={st.head}>
        <Text style={st.eyebrow}>Step {step} · {meta.eyebrow}</Text>
        <Text style={st.title}>{meta.title}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 1 ? <Step1Event /> : null}
        {step === 2 ? <Step2WhereWhen /> : null}
        {step === 3 ? <Step3Spots /> : null}
        {step === 4 ? <Step4Register /> : null}
        {step === 5 ? <Step5Describe /> : null}
        {step === 6 ? <Step6Publish /> : null}
      </ScrollView>

      <FooterBar
        left={step > 1 ? { label: 'Back', onPress: back, icon: 'back' } : undefined}
        right={step < 6
          ? { label: 'Next', onPress: next, icon: 'next' }
          : {
              label: publishing
                ? (editMode ? 'Saving…' : 'Publishing…')
                : (editMode ? 'Save changes' : 'Publish'),
              onPress: onPublish, icon: 'check', disabled: publishing,
            }}
      />
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  navBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: F.bold, fontSize: 14, color: C.t2, marginRight: 38 },
  prog: { paddingHorizontal: 20 },
  head: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
  eyebrow: { fontFamily: F.mono, fontSize: 10.5, letterSpacing: 1, color: C.orange, textTransform: 'uppercase' },
  title: { fontFamily: F.serif, fontSize: 27, color: C.t1, letterSpacing: -0.5, marginTop: 5, lineHeight: 31 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
});
