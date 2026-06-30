import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import type { AgendaItem } from '@/services/eventService';

const SKILL_SUGGESTIONS = [
  'classical', 'contemporary', 'hip-hop', 'kathak', 'bharatanatyam',
  'theatre', 'acting', 'voice', 'singing', 'tabla', 'sitar',
  'choreography', 'direction',
];
const ONE_DAY = 86400000;

const SURFACE = 'rgba(255,255,255,0.04)';
const BG_2 = '#0E0C12';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE = '#FF6B35';
const ORANGE_INK = '#1A0D06';
const RED = '#EF4444';

export default function Step5Description({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const isMultiDay = form.durationKind === 'multi';

  const toggleSkill = (skill: string) => {
    const has = form.skills.includes(skill);
    if (has) update('skills', form.skills.filter((s) => s !== skill));
    else if (form.skills.length < 5) update('skills', [...form.skills, skill]);
  };

  const addAgendaItem = () => {
    const base = form.startsAt ? new Date(form.startsAt).getTime() : Date.now();
    const date = new Date(base + form.agenda.length * ONE_DAY);
    update('agenda', [...form.agenda, { date: date.toISOString().slice(0, 10), title: '', subtitle: '' } as AgendaItem]);
  };
  const editAgendaItem = (i: number, patch: Partial<AgendaItem>) =>
    update('agenda', form.agenda.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  const removeAgendaItem = (i: number) => update('agenda', form.agenda.filter((_, idx) => idx !== i));

  const agendaInvalid = form.agenda.some((item) => !item.title.trim());
  const canContinue = form.about.length >= 100 && form.about.length <= 2000 && !agendaInvalid;

  return (
    <View style={{ gap: 18, marginTop: 2 }}>
      {/* About */}
      <View>
        <View style={styles.labelRow}>
          <Text style={styles.label}>About · required</Text>
          <Text style={[styles.counter, form.about.length < 100 && { color: RED }]}>{form.about.length} / 2000</Text>
        </View>
        <TextInput
          value={form.about}
          onChangeText={(v) => update('about', v)}
          placeholder="What's this event about? Who is it for? What will the artist take away?"
          placeholderTextColor={TEXT_3}
          multiline
          maxLength={2000}
          style={[styles.input, { minHeight: 96, lineHeight: 20, textAlignVertical: 'top' }]}
        />
      </View>

      {/* What to expect */}
      <View>
        <Text style={styles.label}>What to expect · optional</Text>
        <TextInput
          value={form.whatToExpect ?? ''}
          onChangeText={(v) => update('whatToExpect', v)}
          placeholder="Schedule, what to bring, after-event"
          placeholderTextColor={TEXT_3}
          multiline
          maxLength={500}
          style={[styles.input, { minHeight: 66, lineHeight: 20, textAlignVertical: 'top' }]}
        />
      </View>

      {/* Agenda (multi-day) */}
      {isMultiDay ? (
        <View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Day by day · optional</Text>
            <Text style={styles.counter}>{form.agenda.length} {form.agenda.length === 1 ? 'day' : 'days'}</Text>
          </View>
          <View style={{ gap: 8 }}>
            {form.agenda.map((item, i) => (
              <View key={`agenda-${i}`} style={styles.dayCard}>
                <View style={styles.dayHead}>
                  <Text style={styles.dayLabel}>DAY {i + 1}</Text>
                  <Pressable onPress={() => removeAgendaItem(i)} hitSlop={8}><X size={15} color={TEXT_2} /></Pressable>
                </View>
                <TextInput
                  value={item.title}
                  onChangeText={(v) => editAgendaItem(i, { title: v })}
                  placeholder="Topic title · e.g. Aarambh — the beginning"
                  placeholderTextColor={TEXT_3}
                  maxLength={60}
                  style={styles.dayInput}
                />
                <TextInput
                  value={item.subtitle ?? ''}
                  onChangeText={(v) => editAgendaItem(i, { subtitle: v })}
                  placeholder="One-line description · optional"
                  placeholderTextColor={TEXT_3}
                  maxLength={140}
                  style={[styles.dayInput, { color: TEXT_2, fontSize: 12 }]}
                />
              </View>
            ))}
            <Pressable onPress={addAgendaItem} style={styles.addDay}>
              <Plus size={16} color={ORANGE} />
              <Text style={styles.addDayText}>{form.agenda.length === 0 ? 'Add day 1' : `Add day ${form.agenda.length + 1}`}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Skills */}
      <View>
        <Text style={styles.label}>Skills · who's invited (max 5)</Text>
        <View style={styles.chipRow}>
          {SKILL_SUGGESTIONS.map((skill) => {
            const active = form.skills.includes(skill);
            return (
              <Pressable key={skill} onPress={() => toggleSkill(skill)} style={[styles.chip, active && styles.chipOn]}>
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{skill}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bottom nav */}
      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={() => { markComplete(5); onNext(); }}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
        >
          <Text style={[styles.continueText, !canContinue && { color: TEXT_3 }]}>Continue →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3, marginBottom: 6 },
  counter: { fontFamily: 'SpaceMono-Regular', fontSize: 10, color: TEXT_3 },
  input: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: TEXT_0, fontFamily: 'Outfit-Regular', fontSize: 13.5 },
  dayCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 12, padding: 12, gap: 6 },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  dayLabel: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.2, color: ORANGE },
  dayInput: { backgroundColor: BG_2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, color: TEXT_0, fontFamily: 'Outfit-Regular', fontSize: 13 },
  addDay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, borderColor: HAIRLINE, borderStyle: 'dashed', paddingVertical: 13 },
  addDayText: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: ORANGE },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE },
  chipOn: { backgroundColor: TEXT_0, borderColor: TEXT_0 },
  chipText: { fontFamily: 'Outfit-Medium', fontSize: 12.5, color: TEXT_2 },
  chipTextOn: { fontFamily: 'Outfit-SemiBold', color: ORANGE_INK },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: { flex: 1, height: 48, borderRadius: 11, borderWidth: 1, borderColor: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  continueBtn: { flex: 1, height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { backgroundColor: SURFACE },
  continueText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: ORANGE_INK },
});
