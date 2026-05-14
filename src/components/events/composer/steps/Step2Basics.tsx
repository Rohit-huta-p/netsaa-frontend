import { View, Text, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { useCreateEventStore } from '@/stores/createEventStore';
import { durationKindLabel, eventTokens, DurationKind } from '@/lib/eventTokens';
// Use existing CalendarModal — API: visible, onClose, date (Date|undefined), onSelect (Date) => void
import { CalendarModal } from '@/components/ui/CalendarModal';

export default function Step2Basics({ onNext }: { onNext: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const [dateOpen, setDateOpen] = useState(false);

  const canContinue =
    form.title.length >= 6 &&
    form.title.length <= 80 &&
    !!form.startsAt &&
    !!form.durationKind;

  return (
    <View className="gap-7 mt-2">
      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Title</Text>
        <TextInput
          value={form.title}
          onChangeText={(t) => update('title', t)}
          placeholder="Open audition · period drama"
          placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
          maxLength={80}
          className="font-serif text-event-textPrimary text-xl rounded-2xl bg-event-surface border border-event-border px-4 py-4"
        />
        <Text className="font-outfit text-event-textMuted text-xs text-right">
          {form.title.length} / 80
        </Text>
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Tagline · optional</Text>
        <TextInput
          value={form.tagline ?? ''}
          onChangeText={(t) => update('tagline', t)}
          placeholder="One-line hook"
          placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
          maxLength={80}
          className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
        />
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Starts</Text>
        <Pressable
          onPress={() => setDateOpen(true)}
          className="rounded-2xl bg-event-surface border border-event-border px-4 py-4"
        >
          <Text className={`font-outfit text-base ${form.startsAt ? 'text-event-textPrimary' : 'text-event-textMuted'}`}>
            {form.startsAt
              ? new Date(form.startsAt).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
              : 'Pick date + time'}
          </Text>
        </Pressable>
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Duration</Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(durationKindLabel) as DurationKind[]).map((k) => {
            const active = form.durationKind === k;
            return (
              <Pressable
                key={k}
                onPress={() => update('durationKind', k)}
                className={`px-4 py-2.5 rounded-full ${active ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
              >
                <Text className={`font-outfit text-sm ${active ? 'text-white font-semibold' : 'text-event-textSecondary'}`}>
                  {durationKindLabel[k]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => { markComplete(2); onNext(); }}
        disabled={!canContinue}
        className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-event-brand' : 'bg-event-surface'}`}
      >
        <Text className={`font-outfit font-bold ${canContinue ? 'text-white' : 'text-event-textMuted'}`}>
          Continue
        </Text>
      </Pressable>

      {/* CalendarModal: onSelect receives a Date; convert to ISO string for the store */}
      <CalendarModal
        visible={dateOpen}
        onClose={() => setDateOpen(false)}
        date={form.startsAt ? new Date(form.startsAt) : undefined}
        onSelect={(selectedDate: Date) => {
          update('startsAt', selectedDate.toISOString());
          setDateOpen(false);
        }}
        minDate={new Date()}
      />
    </View>
  );
}
