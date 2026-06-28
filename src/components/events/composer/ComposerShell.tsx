import { View, Pressable, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { X, ChevronLeft } from 'lucide-react-native';
import { useCreateEventStore, ComposerStep } from '@/stores/createEventStore';
import { eventTokens } from '@/lib/eventTokens';
import ComposerProgress from './ComposerProgress';
import Step1TopicMode from './steps/Step1TopicMode';
import Step2Basics from './steps/Step2Basics';
import Step3Location from './steps/Step3Location';
import Step4Capacity from './steps/Step4Capacity';
import Step5Description from './steps/Step5Description';
import Step6Media from './steps/Step6Media';
import Step7Review from './steps/Step7Review';

const STEPS: Record<ComposerStep, { title: string; subtitle: string }> = {
  1: { title: 'Basics', subtitle: 'Title, time, duration' },
  2: { title: 'Topic + mode', subtitle: 'What kind of event?' },
  3: { title: 'Location', subtitle: 'In person or online' },
  4: { title: 'Capacity', subtitle: 'How many people' },
  5: { title: 'Description', subtitle: 'About, what to expect' },
  6: { title: 'Media', subtitle: 'Photos + video' },
  7: { title: 'Review', subtitle: 'Final check, publish' },
};

export default function ComposerShell() {
  const router = useRouter();
  const { step, setStep, reset } = useCreateEventStore();
  const meta = STEPS[step];

  const goBack = () => {
    if (step > 1) setStep((step - 1) as ComposerStep);
    else {
      reset();
      router.back();
    }
  };

  const goNext = () => {
    if (step < 7) setStep((step + 1) as ComposerStep);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Pressable onPress={goBack} hitSlop={12} className="p-2 rounded-full">
          {step === 1
            ? <X size={22} color={eventTokens.textSecondary} />
            : <ChevronLeft size={22} color={eventTokens.textSecondary} />}
        </Pressable>
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Step {step} of 7
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ComposerProgress current={step} />

      <View className="px-6 pt-4 pb-2">
        <Text className="font-serif text-event-textPrimary text-3xl">{meta.title}</Text>
        <Text className="font-outfit text-event-textSecondary text-sm mt-1">{meta.subtitle}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? <Step2Basics onNext={goNext} /> : null}
        {step === 2 ? <Step1TopicMode onNext={goNext} /> : null}
        {step === 3 ? <Step3Location onNext={goNext} /> : null}
        {step === 4 ? <Step4Capacity onNext={goNext} /> : null}
        {step === 5 ? <Step5Description onNext={goNext} /> : null}
        {step === 6 ? <Step6Media onNext={goNext} /> : null}
        {step === 7 ? <Step7Review /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
