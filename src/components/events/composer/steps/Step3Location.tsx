import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import { useCreateEventStore } from '@/stores/createEventStore';

const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE_INK = '#1A0D06';
const BLUE = '#5B8DEF';
const BLUE_SOFT = 'rgba(91,141,239,0.14)';

export default function Step3Location({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const kind = form.location.kind;

  const updateLoc = (patch: Partial<typeof form.location>) =>
    update('location', { ...form.location, ...patch });

  const canContinue = kind === 'online' ? true : !!form.location.venueName && !!form.location.address;

  return (
    <View style={{ gap: 18, marginTop: 2 }}>
      {/* Format */}
      <View>
        <Text style={styles.label}>Format</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['in_person', 'online'] as const).map((k) => {
            const active = kind === k;
            return (
              <Pressable key={k} onPress={() => updateLoc({ kind: k })} style={[styles.chip, active && styles.chipOn]}>
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{k === 'in_person' ? 'In person' : 'Online'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {kind === 'in_person' ? (
        <>
          <View>
            <Text style={styles.label}>Venue name</Text>
            <TextInput
              value={form.location.venueName ?? ''}
              onChangeText={(v) => updateLoc({ venueName: v })}
              placeholder="Studio X"
              placeholderTextColor={TEXT_3}
              maxLength={100}
              style={styles.input}
            />
          </View>
          <View>
            <Text style={styles.label}>Address</Text>
            <TextInput
              value={form.location.address ?? ''}
              onChangeText={(v) => updateLoc({ address: v })}
              placeholder="Andheri West, Mumbai"
              placeholderTextColor={TEXT_3}
              maxLength={300}
              multiline
              style={[styles.input, { minHeight: 56, textAlignVertical: 'top' }]}
            />
          </View>
          <View>
            <Text style={styles.label}>Landmark · optional</Text>
            <TextInput
              value={form.location.landmark ?? ''}
              onChangeText={(v) => updateLoc({ landmark: v })}
              placeholder="Near Andheri Metro"
              placeholderTextColor={TEXT_3}
              maxLength={200}
              style={styles.input}
            />
          </View>
        </>
      ) : (
        <>
          <View>
            <Text style={styles.label}>Platform · optional</Text>
            <TextInput
              value={form.location.onlinePlatform ?? ''}
              onChangeText={(v) => updateLoc({ onlinePlatform: v })}
              placeholder="Zoom, Meet, Discord…"
              placeholderTextColor={TEXT_3}
              style={styles.input}
            />
          </View>
          <View style={styles.note}>
            <Info size={15} color={BLUE} style={{ marginTop: 1 }} />
            <Text style={styles.noteText}>
              The actual join link is captured in admin · sent to confirmed registrants only.
            </Text>
          </View>
        </>
      )}

      {/* Bottom nav */}
      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={() => { markComplete(3); onNext(); }}
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
  label: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3, marginBottom: 6 },
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
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE },
  chipOn: { backgroundColor: TEXT_0, borderColor: TEXT_0 },
  chipText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  chipTextOn: { fontFamily: 'Outfit-SemiBold', color: ORANGE_INK },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: BLUE_SOFT,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  noteText: { flex: 1, fontFamily: 'Outfit-Regular', fontSize: 11.5, color: BLUE, lineHeight: 17 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: { flex: 1, height: 48, borderRadius: 11, borderWidth: 1, borderColor: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  continueBtn: { flex: 1, height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { backgroundColor: SURFACE },
  continueText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: ORANGE_INK },
});
