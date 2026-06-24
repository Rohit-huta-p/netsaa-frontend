import { View, Text, TextInput, Pressable } from 'react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import { eventTokens } from '@/lib/eventTokens';

export default function Step3Location({ onNext }: { onNext: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const kind = form.location.kind;

  const updateLoc = (patch: Partial<typeof form.location>) =>
    update('location', { ...form.location, ...patch });

  const canContinue =
    kind === 'online'
      ? true
      : !!form.location.venueName && !!form.location.address;

  return (
    <View className="gap-7 mt-2">
      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Format</Text>
        <View className="flex-row gap-2">
          {(['in_person', 'online'] as const).map((k) => {
            const active = kind === k;
            return (
              <Pressable
                key={k}
                onPress={() => updateLoc({ kind: k })}
                className={`flex-1 p-4 rounded-2xl items-center ${active ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
              >
                <Text className={`font-outfit font-semibold ${active ? 'text-white' : 'text-event-textSecondary'}`}>
                  {k === 'in_person' ? 'In person' : 'Online'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {kind === 'in_person' ? (
        <>
          <View className="gap-2">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Venue name</Text>
            <TextInput
              value={form.location.venueName ?? ''}
              onChangeText={(v) => updateLoc({ venueName: v })}
              placeholder="Studio X"
              placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
              maxLength={100}
              className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
            />
          </View>
          <View className="gap-2">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Address</Text>
            <TextInput
              value={form.location.address ?? ''}
              onChangeText={(v) => updateLoc({ address: v })}
              placeholder="Andheri West, Mumbai"
              placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
              maxLength={300}
              multiline
              className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
              style={{ minHeight: 60 }}
            />
          </View>
          <View className="gap-2">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Landmark · optional</Text>
            <TextInput
              value={form.location.landmark ?? ''}
              onChangeText={(v) => updateLoc({ landmark: v })}
              placeholder="Near Andheri Metro"
              placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
              maxLength={200}
              className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
            />
          </View>
        </>
      ) : (
        <View className="gap-2">
          <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Platform · optional</Text>
          <TextInput
            value={form.location.onlinePlatform ?? ''}
            onChangeText={(v) => updateLoc({ onlinePlatform: v })}
            placeholder="Zoom, Meet, Discord..."
            placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
            className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
          />
          <Text className="font-outfit text-event-textMuted text-xs mt-1">
            The actual join link is captured in admin · sent to confirmed registrants only.
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => { markComplete(3); onNext(); }}
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
