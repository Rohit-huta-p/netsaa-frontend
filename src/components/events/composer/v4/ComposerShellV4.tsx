import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useComposerStoreV4 } from './useComposerStoreV4';
import { useComposerVideoPoll } from './useComposerVideoPoll';
import { FooterBar } from './ui';
import { C, F } from './theme';
import Step1Event from './steps/Step1Event';
import Step2WhereWhen from './steps/Step2WhereWhen';
import Step3Spots from './steps/Step3Spots';
import Step4Register from './steps/Step4Register';
import Step5Describe from './steps/Step5Describe';
import StepFeaturing from './steps/StepFeaturing';
import Step6Publish from './steps/Step6Publish';

const STEP_LABELS = ['Event', 'Where', 'Tickets', 'Register', 'Describe', 'Featuring', 'Review'];
const STEP_META: Record<number, { eyebrow: string; title: string }> = {
  1: { eyebrow: 'the event', title: 'What are you putting on?' },
  2: { eyebrow: 'when & where', title: 'When and where?' },
  3: { eyebrow: 'tickets', title: 'Who can come, and the price?' },
  4: { eyebrow: 'registration', title: 'How do people get in?' },
  5: { eyebrow: 'describe', title: 'Tell people about it.' },
  6: { eyebrow: 'featuring', title: 'Who’s featured?' },
  7: { eyebrow: 'review', title: 'A last look.' },
};

export default function ComposerShellV4({ onPublish, onClose, publishing }: {
  onPublish: () => void; onClose: () => void; publishing?: boolean;
}) {
  const step = useComposerStoreV4((s) => s.step);
  const editMode = useComposerStoreV4((s) => s.editMode);
  const next = useComposerStoreV4((s) => s.next);
  const back = useComposerStoreV4((s) => s.back);
  const meta = STEP_META[step];

  // Keep Mux reel polling alive across step changes (steps mount/unmount).
  useComposerVideoPoll();

  const goBack = () => (step > 1 ? back() : onClose());

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Compact gig-form-style header — dimmed strip, serif step title + mono
          counter, thin orange progress. No mini-dots; back chip exits on step 1. */}
      <View style={st.header}>
        <View style={st.stepRow}>
          <Pressable onPress={goBack} hitSlop={8} style={st.backChip} accessibilityRole="button" accessibilityLabel={step > 1 ? 'Back a step' : 'Close'}>
            <ChevronLeft size={20} color={C.t4} />
          </Pressable>
          <View style={st.titleWrap}>
            <Text style={st.stepTitle} numberOfLines={1}>{meta.title}</Text>
            <Text style={st.stepMeta}>Step {step} of {STEP_LABELS.length}</Text>
          </View>
        </View>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${(step / STEP_LABELS.length) * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 1 ? <Step1Event /> : null}
        {step === 2 ? <Step2WhereWhen /> : null}
        {step === 3 ? <Step3Spots /> : null}
        {step === 4 ? <Step4Register /> : null}
        {step === 5 ? <Step5Describe /> : null}
        {step === 6 ? <StepFeaturing /> : null}
        {step === 7 ? <Step6Publish /> : null}
      </ScrollView>

      <FooterBar
        left={step > 1 ? { label: 'Back', onPress: back, icon: 'back' } : undefined}
        right={step < 7
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
  header: { backgroundColor: C.header },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  backChip: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border2, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, minWidth: 0 },
  stepTitle: { fontFamily: F.serif, fontSize: 16, color: C.t1, letterSpacing: -0.2 },
  stepMeta: { fontFamily: F.mono, fontSize: 10, color: C.dim2, letterSpacing: 0.5, marginTop: 1, textTransform: 'uppercase' },
  progressTrack: { height: 2, backgroundColor: C.border },
  progressFill: { height: '100%', backgroundColor: C.orange },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },
});
