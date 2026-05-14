import { View, Text, Pressable } from 'react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import TopicTagAutocomplete from '../TopicTagAutocomplete';

export default function Step1TopicMode({ onNext }: { onNext: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();

  const canContinue = form.topicTags.length >= 1 && !!form.registrationMode;

  return (
    <View className="gap-8 mt-2">
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Topics</Text>
        <TopicTagAutocomplete
          selected={form.topicTags}
          onChange={(tags) => update('topicTags', tags)}
        />
      </View>

      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Registration</Text>
        <View className="gap-2">
          {(['free_rsvp', 'paid_ticket'] as const).map((mode) => {
            const active = form.registrationMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => update('registrationMode', mode)}
                className={`p-4 rounded-2xl border ${active ? 'border-event-brand bg-event-surface' : 'border-event-border bg-event-surfaceAlt'}`}
              >
                <Text className="font-outfit text-event-textPrimary text-base font-semibold">
                  {mode === 'free_rsvp' ? 'Free RSVP' : 'Paid ticket'}
                </Text>
                <Text className="font-outfit text-event-textSecondary text-xs mt-1">
                  {mode === 'free_rsvp'
                    ? 'Anyone with the link can register up to capacity. Recommended.'
                    : 'Charge a ticket fee. (Coming soon — locked for now.)'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => { markComplete(1); onNext(); }}
        disabled={!canContinue}
        className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-event-brand' : 'bg-event-surface'}`}
      >
        <Text className={`font-outfit font-bold ${canContinue ? 'text-white' : 'text-event-textMuted'}`}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}
