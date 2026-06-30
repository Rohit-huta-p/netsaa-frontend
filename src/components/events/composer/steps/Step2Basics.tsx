import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Calendar } from 'lucide-react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import { DurationKind } from '@/lib/eventTokens';
import { CalendarModal } from '@/components/ui/CalendarModal';

// Mockup O1 wording for the duration chips (stored value stays the key).
const DUR: Record<DurationKind, string> = {
  m30: '30 mins', h1: '1 hour', h2: '2 hours', h3: '3 hours',
  half: 'Half day', full: 'Full day', multi: 'Multi-day',
};
const DUR_ORDER: DurationKind[] = ['m30', 'h1', 'h2', 'h3', 'half', 'full', 'multi'];

const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE_INK = '#1A0D06';
const RED = '#EF4444';

export default function Step2Basics({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const [dateOpen, setDateOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  const deadlineInvalid =
    !!form.registrationDeadline &&
    !!form.startsAt &&
    new Date(form.registrationDeadline).getTime() > new Date(form.startsAt).getTime();

  const canContinue =
    form.title.length >= 6 &&
    form.title.length <= 80 &&
    !!form.startsAt &&
    !!form.durationKind &&
    !deadlineInvalid;

  return (
    <View style={{ gap: 20, marginTop: 2 }}>
      {/* Title */}
      <View>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Title</Text>
          <Text style={styles.counter}>{form.title.length} / 80</Text>
        </View>
        <TextInput
          value={form.title}
          onChangeText={(t) => update('title', t)}
          placeholder="Open audition · period drama"
          placeholderTextColor={TEXT_3}
          maxLength={80}
          style={styles.input}
        />
      </View>

      {/* Tagline */}
      <View>
        <Text style={styles.label}>Tagline · optional</Text>
        <TextInput
          value={form.tagline ?? ''}
          onChangeText={(t) => update('tagline', t)}
          placeholder="One-line hook"
          placeholderTextColor={TEXT_3}
          maxLength={80}
          style={styles.input}
        />
      </View>

      {/* Starts */}
      <View>
        <Text style={styles.label}>Starts</Text>
        <Pressable onPress={() => setDateOpen(true)} style={[styles.input, styles.inputRow]}>
          <Calendar size={15} color={TEXT_3} />
          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 14, color: form.startsAt ? TEXT_0 : TEXT_3 }}>
            {form.startsAt
              ? new Date(form.startsAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
              : 'Pick date + time'}
          </Text>
        </Pressable>
      </View>

      {/* Duration */}
      <View>
        <Text style={styles.label}>Duration</Text>
        <View style={styles.chipRow}>
          {DUR_ORDER.map((k) => {
            const active = form.durationKind === k;
            return (
              <Pressable key={k} onPress={() => update('durationKind', k)} style={[styles.chip, active && styles.chipOn]}>
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{DUR[k]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Registration closes */}
      <View>
        <Text style={styles.label}>Registration closes · optional</Text>
        <Pressable onPress={() => setDeadlineOpen(true)} style={[styles.input, styles.inputRow, { justifyContent: 'space-between' }]}>
          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 14, color: form.registrationDeadline ? TEXT_0 : TEXT_3, flex: 1 }}>
            {form.registrationDeadline
              ? new Date(form.registrationDeadline).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
              : 'No cutoff — accept until event starts'}
          </Text>
          {form.registrationDeadline ? (
            <Pressable onPress={() => update('registrationDeadline', null)} hitSlop={8}>
              <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11.5, color: TEXT_3 }}>Clear</Text>
            </Pressable>
          ) : null}
        </Pressable>
        <Text style={[styles.helper, deadlineInvalid && { color: RED }]}>
          {deadlineInvalid
            ? 'Deadline must be before the event starts.'
            : "We'll block new registrations after this."}
        </Text>
      </View>

      {/* Bottom nav */}
      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={() => { markComplete(1); onNext(); }}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
        >
          <Text style={[styles.continueText, !canContinue && { color: TEXT_3 }]}>Continue →</Text>
        </Pressable>
      </View>

      <CalendarModal
        visible={dateOpen}
        onClose={() => setDateOpen(false)}
        date={form.startsAt ? new Date(form.startsAt) : undefined}
        onSelect={(d: Date) => { update('startsAt', d.toISOString()); setDateOpen(false); }}
        minDate={new Date()}
      />
      <CalendarModal
        visible={deadlineOpen}
        onClose={() => setDeadlineOpen(false)}
        date={form.registrationDeadline ? new Date(form.registrationDeadline) : undefined}
        onSelect={(d: Date) => { update('registrationDeadline', d.toISOString()); setDeadlineOpen(false); }}
        minDate={new Date()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  label: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3, marginBottom: 6 },
  counter: { fontFamily: 'SpaceMono-Regular', fontSize: 10, color: TEXT_3 },
  input: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT_0,
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE },
  chipOn: { backgroundColor: TEXT_0, borderColor: TEXT_0 },
  chipText: { fontFamily: 'Outfit-Medium', fontSize: 12.5, color: TEXT_2 },
  chipTextOn: { fontFamily: 'Outfit-SemiBold', color: ORANGE_INK },
  helper: { fontFamily: 'Outfit-Regular', fontSize: 11, color: TEXT_3, marginTop: 6 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: { flex: 1, height: 48, borderRadius: 11, borderWidth: 1, borderColor: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  continueBtn: { flex: 1, height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { backgroundColor: SURFACE },
  continueText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: ORANGE_INK },
});
