import { View, Pressable, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { X, ChevronLeft } from 'lucide-react-native';
import { useCreateEventStore, ComposerStep } from '@/stores/createEventStore';
import ComposerProgress from './ComposerProgress';
import Step1TopicMode from './steps/Step1TopicMode';
import Step2Basics from './steps/Step2Basics';
import Step3Location from './steps/Step3Location';
import Step4Capacity from './steps/Step4Capacity';
import Step5Description from './steps/Step5Description';
import Step6Media from './steps/Step6Media';
import Step7Review from './steps/Step7Review';

const BG = '#09090b';
const TEXT_0 = '#F3EFE8';
const ORANGE = '#FF6B35';
const HAIRLINE = 'rgba(255,255,255,0.1)';

// Per-step nav copy — orange "Step N · <eyebrow>" + a sentence title (mockup O1–O7).
const STEPS: Record<ComposerStep, { eyebrow: string; title: string }> = {
  1: { eyebrow: 'basics', title: 'The essentials.' },
  2: { eyebrow: 'topic + mode', title: 'What kind of event?' },
  3: { eyebrow: 'location', title: 'Where does it happen?' },
  4: { eyebrow: 'capacity & pricing', title: 'How many, and what does it cost?' },
  5: { eyebrow: 'description', title: 'Tell the story.' },
  6: { eyebrow: 'media', title: 'Show it off.' },
  7: { eyebrow: 'review', title: 'Final check.' },
};

export default function ComposerShell() {
  const router = useRouter();
  const { step, setStep, reset } = useCreateEventStore();
  const meta = STEPS[step];

  const goBack = () => {
    if (step > 1) setStep((step - 1) as ComposerStep);
    else exit();
  };
  const goNext = () => {
    if (step < 7) setStep((step + 1) as ComposerStep);
  };
  const exit = () => {
    reset();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: BG }}
    >
      {/* Nav — back · "New event" · close */}
      <View style={styles.nav}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={18} color={TEXT_0} />
        </Pressable>
        <Text style={styles.navTitle}>New event</Text>
        <Pressable onPress={exit} hitSlop={10} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Close composer">
          <X size={18} color={TEXT_0} />
        </Pressable>
      </View>

      <ComposerProgress current={step} />

      {/* Eyebrow + sentence title */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <Text style={styles.eyebrow}>Step {step} · {meta.eyebrow}</Text>
        <Text style={styles.title}>{meta.title}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? <Step2Basics onNext={goNext} onBack={goBack} /> : null}
        {step === 2 ? <Step1TopicMode onNext={goNext} onBack={goBack} /> : null}
        {step === 3 ? <Step3Location onNext={goNext} onBack={goBack} /> : null}
        {step === 4 ? <Step4Capacity onNext={goNext} onBack={goBack} /> : null}
        {step === 5 ? <Step5Description onNext={goNext} onBack={goBack} /> : null}
        {step === 6 ? <Step6Media onNext={goNext} onBack={goBack} /> : null}
        {step === 7 ? <Step7Review /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { flex: 1, fontFamily: 'DMSerifDisplay_400Regular', color: TEXT_0, fontSize: 20 },
  eyebrow: {
    fontFamily: 'SpaceMono-Bold',
    color: ORANGE,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: { fontFamily: 'DMSerifDisplay_400Regular', color: TEXT_0, fontSize: 22, lineHeight: 24, letterSpacing: -0.3 },
});
