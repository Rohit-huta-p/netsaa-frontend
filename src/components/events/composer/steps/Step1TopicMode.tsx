import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useCreateEventStore } from '@/stores/createEventStore';
import TopicTagAutocomplete from '../TopicTagAutocomplete';

const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const ORANGE = '#FF6B35';
const ORANGE_LINE = 'rgba(255,107,53,0.32)';
const ORANGE_INK = '#1A0D06';
const TEXT_0 = '#F3EFE8';
const TEXT_1 = '#A1A1AA';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const TEXT_4 = '#3f3f46';

const MODES = [
  { key: 'free_rsvp' as const, title: 'Free RSVP', sub: 'Anyone with the link can register up to capacity. Recommended.' },
  { key: 'paid_ticket' as const, title: 'Paid ticket', sub: 'Single ticket price. Set the amount + refund policy next.' },
];

export default function Step1TopicMode({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const canContinue = form.topicTags.length >= 1 && !!form.registrationMode;

  return (
    <View style={{ gap: 22, marginTop: 2 }}>
      <View>
        <Text style={styles.label}>Topics</Text>
        <TopicTagAutocomplete selected={form.topicTags} onChange={(tags) => update('topicTags', tags)} />
      </View>

      <View>
        <Text style={styles.label}>Registration</Text>
        <View style={{ gap: 8 }}>
          {MODES.map((m) => {
            const active = form.registrationMode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => update('registrationMode', m.key)}
                style={[styles.card, active && styles.cardActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: active ? TEXT_0 : TEXT_1 }]}>{m.title}</Text>
                  <Text style={[styles.cardSub, { color: active ? TEXT_2 : TEXT_3 }]}>{m.sub}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={() => { markComplete(2); onNext(); }}
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
  label: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 13,
    paddingHorizontal: 14,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 10,
  },
  cardActive: { borderColor: ORANGE_LINE },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: TEXT_4, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: ORANGE },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },
  cardTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 13.5 },
  cardSub: { fontFamily: 'Outfit-Regular', fontSize: 11.5, marginTop: 2, lineHeight: 16 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: { flex: 1, height: 48, borderRadius: 11, borderWidth: 1, borderColor: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  continueBtn: { flex: 1, height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { backgroundColor: SURFACE },
  continueText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: ORANGE_INK },
});
