import { View, Text, TextInput, Pressable } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import { eventTokens } from '@/lib/eventTokens';
import type { AgendaItem } from '@/services/eventService';

const SKILL_SUGGESTIONS = [
  'classical', 'contemporary', 'hip-hop', 'kathak', 'bharatanatyam',
  'theatre', 'acting', 'voice', 'singing', 'tabla', 'sitar',
  'choreography', 'direction',
];

const ONE_DAY = 86400000;

export default function Step5Description({ onNext }: { onNext: () => void; onBack?: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();

  const isMultiDay = form.durationKind === 'multi';

  const toggleSkill = (skill: string) => {
    const has = form.skills.includes(skill);
    if (has) update('skills', form.skills.filter((s) => s !== skill));
    else if (form.skills.length < 5) update('skills', [...form.skills, skill]);
  };

  const addAgendaItem = () => {
    const base = form.startsAt ? new Date(form.startsAt).getTime() : Date.now();
    const offset = form.agenda.length;
    const date = new Date(base + offset * ONE_DAY);
    const next: AgendaItem = {
      date: date.toISOString().slice(0, 10),
      title: '',
      subtitle: '',
    };
    update('agenda', [...form.agenda, next]);
  };

  const editAgendaItem = (i: number, patch: Partial<AgendaItem>) => {
    update('agenda', form.agenda.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  };

  const removeAgendaItem = (i: number) => {
    update('agenda', form.agenda.filter((_, idx) => idx !== i));
  };

  const agendaInvalid = form.agenda.some((item) => !item.title.trim());

  const canContinue =
    form.about.length >= 100 &&
    form.about.length <= 2000 &&
    !agendaInvalid;

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

      {isMultiDay ? (
        <View className="gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">Day by day · optional</Text>
            <Text className="font-mono text-event-textMuted text-xs">
              {form.agenda.length} {form.agenda.length === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {form.agenda.map((item, i) => (
            <View key={`agenda-${i}`} className="gap-2 rounded-2xl bg-event-surface border border-event-border p-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-mono text-event-gold text-[11px] tracking-widest">DAY {i + 1}</Text>
                <Pressable onPress={() => removeAgendaItem(i)} hitSlop={8}>
                  <X size={16} color="#71717a" />
                </Pressable>
              </View>
              <TextInput
                value={item.title}
                onChangeText={(v) => editAgendaItem(i, { title: v })}
                placeholder="Topic title · e.g. Aarambh — the beginning"
                placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
                maxLength={60}
                className="font-outfit text-event-textPrimary text-base rounded-xl bg-event-bgAlt border border-event-border px-3 py-3"
              />
              <TextInput
                value={item.subtitle ?? ''}
                onChangeText={(v) => editAgendaItem(i, { subtitle: v })}
                placeholder="One-line description · optional"
                placeholderTextColor={eventTokens.textMuted ?? '#6E6C76'}
                maxLength={140}
                className="font-outfit text-event-textSecondary text-sm rounded-xl bg-event-bgAlt border border-event-border px-3 py-2.5"
              />
            </View>
          ))}

          <Pressable
            onPress={addAgendaItem}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-event-border bg-event-surface py-3.5"
          >
            <Plus size={16} color="#FF6B35" />
            <Text className="font-outfit text-event-brand text-sm font-semibold">
              {form.agenda.length === 0 ? 'Add day 1' : `Add day ${form.agenda.length + 1}`}
            </Text>
          </Pressable>

          <Text className="font-outfit text-event-textMuted text-xs leading-5">
            Shown as a structured day list on the event page. Skip if the days share the same content.
          </Text>
        </View>
      ) : null}

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
