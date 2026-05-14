import { View, Text, TextInput, Pressable } from 'react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import { eventTokens } from '@/lib/eventTokens';

const PRESETS = [20, 50, 100, 200, 500];

export default function Step4Capacity({ onNext }: { onNext: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const total = form.capacity.total;

  const set = (n: number) => update('capacity', { total: Math.max(1, Math.min(1000, n)) });

  const canContinue = total >= 1 && total <= 1000;

  return (
    <View className="gap-7 mt-2">
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Total capacity</Text>
        <View className="rounded-2xl bg-event-surface border border-event-border px-4 py-5 items-center">
          <Text className="font-serif text-event-textPrimary text-5xl">{total}</Text>
          <Text className="font-outfit text-event-textSecondary text-xs mt-1">people</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((n) => {
          const active = total === n;
          return (
            <Pressable
              key={n}
              onPress={() => set(n)}
              className={`px-4 py-2.5 rounded-full ${active ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
            >
              <Text className={`font-outfit text-sm ${active ? 'text-white font-semibold' : 'text-event-textSecondary'}`}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Or type a number</Text>
        <TextInput
          value={String(total)}
          onChangeText={(s) => set(parseInt(s, 10) || 1)}
          keyboardType="number-pad"
          placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
          className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
        />
        <Text className="font-outfit text-event-textMuted text-xs">
          Hard cap is 1000. For larger events, request admin approval.
        </Text>
      </View>

      <Pressable
        onPress={() => { markComplete(4); onNext(); }}
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
