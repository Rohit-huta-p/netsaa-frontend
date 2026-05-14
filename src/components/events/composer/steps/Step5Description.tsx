import { View, Text, TextInput, Pressable } from 'react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import { eventTokens } from '@/lib/eventTokens';

const SKILL_SUGGESTIONS = [
  'classical', 'contemporary', 'hip-hop', 'kathak', 'bharatanatyam',
  'theatre', 'acting', 'voice', 'singing', 'tabla', 'sitar',
  'choreography', 'direction',
];

export default function Step5Description({ onNext }: { onNext: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();

  const toggleSkill = (skill: string) => {
    const has = form.skills.includes(skill);
    if (has) update('skills', form.skills.filter((s) => s !== skill));
    else if (form.skills.length < 5) update('skills', [...form.skills, skill]);
  };

  const canContinue = form.about.length >= 100 && form.about.length <= 2000;

  return (
    <View className="gap-7 mt-2">
      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">About · required</Text>
        <TextInput
          value={form.about}
          onChangeText={(v) => update('about', v)}
          placeholder="What's this event about? Who is it for? What will the artist take away?"
          placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
          multiline
          maxLength={2000}
          className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3 leading-6"
          style={{ minHeight: 160 }}
        />
        <Text className={`font-outfit text-xs text-right ${form.about.length < 100 ? 'text-event-capacityUrgent' : 'text-event-textMuted'}`}>
          {form.about.length} / 2000 · minimum 100
        </Text>
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">What to expect · optional</Text>
        <TextInput
          value={form.whatToExpect ?? ''}
          onChangeText={(v) => update('whatToExpect', v)}
          placeholder="Schedule, what to bring, after-event"
          placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
          multiline
          maxLength={500}
          className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3 leading-6"
          style={{ minHeight: 100 }}
        />
        <Text className="font-outfit text-event-textMuted text-xs text-right">
          {(form.whatToExpect ?? '').length} / 500
        </Text>
      </View>

      <View className="gap-3">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Skills · who's invited (max 5)</Text>
        <View className="flex-row flex-wrap gap-2">
          {SKILL_SUGGESTIONS.map((skill) => {
            const active = form.skills.includes(skill);
            return (
              <Pressable
                key={skill}
                onPress={() => toggleSkill(skill)}
                className={`px-3 py-2 rounded-full ${active ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
              >
                <Text className={`font-outfit text-xs ${active ? 'text-white font-semibold' : 'text-event-textSecondary'}`}>
                  {skill}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => { markComplete(5); onNext(); }}
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
