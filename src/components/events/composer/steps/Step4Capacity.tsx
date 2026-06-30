import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateEventStore, RefundPolicy, RequiredAttendeeField } from '@/stores/createEventStore';
import { computeOrganizerBreakdown, formatRupees, NETSA_FEE_PERCENT } from '@/lib/eventPricing';
import { usePayoutAccount } from '@/hooks/usePayoutAccount';

const CAPACITY_PRESETS = [20, 50, 100, 200, 500];
const PRICE_PRESETS = [99, 249, 499, 999, 1999];
const GUEST_OPTIONS = [1, 2, 3, 5, 10];

const REFUND_OPTIONS: { value: RefundPolicy; label: string; sub: string }[] = [
  { value: 'flex_24h', label: 'Flexible', sub: 'Full refund up to 24h before' },
  { value: 'firm', label: 'Firm', sub: 'No refunds once registered' },
  { value: 'custom', label: 'Custom', sub: 'Write your own policy' },
];

const ATTENDEE_FIELDS: { value: RequiredAttendeeField; label: string; sub: string; locked?: boolean }[] = [
  { value: 'phone', label: 'Phone', sub: 'Always required · SMS reminders', locked: true },
  { value: 'email', label: 'Email', sub: 'Receipts + ICS' },
  { value: 'guestNames', label: 'Guest names', sub: 'When group > 1' },
];

const SURFACE = 'rgba(255,255,255,0.04)';
const SURFACE_HI = 'rgba(255,255,255,0.07)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_1 = '#A1A1AA';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const TEXT_4 = '#3f3f46';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.16)';
const ORANGE_LINE = 'rgba(255,107,53,0.32)';
const ORANGE_INK = '#1A0D06';
const GREEN = '#22C55E';
const GREEN_SOFT = 'rgba(34,197,94,0.14)';
const YELLOW = '#EAB308';
const YELLOW_SOFT = 'rgba(234,179,8,0.14)';

export default function Step4Capacity({ onNext, onBack }: { onNext: () => void; onBack?: () => void }) {
  const { form, update, markComplete } = useCreateEventStore();
  const router = useRouter();
  const total = form.capacity.total;
  const isPaid = form.registrationMode === 'paid_ticket';

  const { data: payoutAccount } = usePayoutAccount();
  const payoutVerified = payoutAccount?.status === 'verified';

  const setCapacity = (n: number) => update('capacity', { total: Math.max(1, Math.min(1000, n)) });
  const setPrice = (n: number) => update('pricing', { ...form.pricing, amount: Math.max(0, Math.min(100000, n)) });
  const setRefundPolicy = (p: RefundPolicy) => update('pricing', { ...form.pricing, refundPolicy: p });
  const setRefundNote = (note: string) => update('pricing', { ...form.pricing, refundCustomNote: note });
  const setMaxGuests = (n: number) => update('maxGuestsPerRegistration', Math.max(1, Math.min(10, n)));
  const setAllowWaitlist = (v: boolean) => { update('allowWaitlist', v); if (!v) update('waitlistAutoPromote', false); };
  const toggleField = (field: RequiredAttendeeField) => {
    if (field === 'phone') return;
    const has = form.requiredAttendeeFields.includes(field);
    update('requiredAttendeeFields', has ? form.requiredAttendeeFields.filter((f) => f !== field) : [...form.requiredAttendeeFields, field]);
  };

  const capacityValid = total >= 1 && total <= 1000;
  const pricingValid = !isPaid || (form.pricing.amount > 0 && form.pricing.amount <= 100000);
  const refundNoteValid = !isPaid || form.pricing.refundPolicy !== 'custom' || !!form.pricing.refundCustomNote?.trim();
  const guestsValid = form.maxGuestsPerRegistration >= 1 && form.maxGuestsPerRegistration <= 10;
  const canContinue = capacityValid && pricingValid && refundNoteValid && guestsValid && !(isPaid && !payoutVerified);

  const pricingLocked = isPaid && !payoutVerified;

  return (
    <View style={{ marginTop: 2 }}>
      {isPaid && payoutVerified ? (
        <View style={styles.verifiedPill}>
          <View style={styles.verifiedDot} />
          <Text style={styles.verifiedText}>Bank verified · HDFC **** 1234</Text>
        </View>
      ) : null}

      {/* Capacity */}
      <Text style={styles.section}>Capacity</Text>
      <View style={styles.bigBox}>
        <TextInput
          value={String(total)}
          onChangeText={(s) => setCapacity(parseInt(s, 10) || 1)}
          keyboardType="number-pad"
          style={styles.bigNum}
        />
        <Text style={styles.bigUnit}>artists</Text>
      </View>
      <View style={styles.chipRow}>
        {CAPACITY_PRESETS.map((n) => (
          <Chip key={n} label={String(n)} active={total === n} onPress={() => setCapacity(n)} />
        ))}
      </View>

      {/* Group */}
      <Text style={styles.section}>Group registration</Text>
      <View style={styles.chipRow}>
        {GUEST_OPTIONS.map((n) => (
          <Chip key={n} label={String(n)} active={form.maxGuestsPerRegistration === n} onPress={() => setMaxGuests(n)} />
        ))}
      </View>
      <Text style={styles.helper}>
        One attendee can bring up to {form.maxGuestsPerRegistration - 1} guest{form.maxGuestsPerRegistration === 2 ? '' : 's'}.
      </Text>

      {/* Required */}
      <Text style={styles.section}>Required from attendees</Text>
      {ATTENDEE_FIELDS.map((opt, i) => {
        const active = form.requiredAttendeeFields.includes(opt.value);
        return (
          <Pressable
            key={opt.value}
            onPress={() => toggleField(opt.value)}
            disabled={opt.locked}
            style={[styles.fieldRow, i === 0 && { borderTopWidth: 0 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{opt.label}</Text>
              <Text style={styles.rowSub}>{opt.sub}</Text>
            </View>
            <SwitchPill on={active} />
          </Pressable>
        );
      })}

      {/* Waitlist */}
      <Text style={styles.section}>Waitlist</Text>
      <View style={styles.card}>
        <View style={styles.cardHeadRow}>
          <Text style={styles.rowTitle}>Allow waitlist when full</Text>
          <SwitchPill on={form.allowWaitlist} />
        </View>
        {form.allowWaitlist ? (
          <View style={{ gap: 6, marginTop: 10 }}>
            <Pressable onPress={() => update('waitlistAutoPromote', true)} style={[styles.radioRow, form.waitlistAutoPromote && styles.radioRowOn]}>
              <RadioDot on={form.waitlistAutoPromote} />
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>Auto-promote</Text>
                <Text style={styles.radioSub}>Top of list gets 30 min to confirm</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => update('waitlistAutoPromote', false)} style={[styles.radioRow, !form.waitlistAutoPromote && styles.radioRowOn]}>
              <RadioDot on={!form.waitlistAutoPromote} />
              <Text style={[styles.radioTitle, { flex: 1 }]}>I'll approve each</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Day-of */}
      <Text style={styles.section}>Day-of</Text>
      <Pressable onPress={() => update('walkupsAllowed', !form.walkupsAllowed)} style={[styles.card, styles.cardHeadRow]}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.rowTitle}>Allow walk-ups</Text>
          <Text style={styles.rowSub}>Add people at the door if seats are left</Text>
        </View>
        <SwitchPill on={form.walkupsAllowed} />
      </Pressable>

      {/* Pricing (paid) */}
      {isPaid ? (
        <>
          {pricingLocked ? (
            <View style={styles.gate}>
              <Text style={styles.gateEyebrow}>Payout setup required</Text>
              <Text style={styles.gateTitle}>Link a bank to collect payments</Text>
              <Text style={styles.gateBody}>Set up a verified bank account to publish paid events. Earnings settle there instantly via Razorpay.</Text>
              <Pressable onPress={() => router.push('/settings/payouts')} style={styles.gateBtn}>
                <Text style={styles.gateBtnText}>Set up payouts →</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={pricingLocked ? styles.locked : undefined} pointerEvents={pricingLocked ? 'none' : 'auto'}>
            <Text style={styles.section}>Ticket price · INR</Text>
            <View style={styles.bigBox}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  value={String(form.pricing.amount)}
                  onChangeText={(s) => setPrice(parseInt(s, 10) || 0)}
                  keyboardType="number-pad"
                  style={styles.bigNum}
                />
              </View>
              <Text style={styles.bigUnit}>per ticket</Text>
            </View>
            <View style={styles.chipRow}>
              {PRICE_PRESETS.map((n) => (
                <Chip key={n} label={`₹${n.toLocaleString('en-IN')}`} active={form.pricing.amount === n} onPress={() => setPrice(n)} />
              ))}
            </View>

            {form.pricing.amount > 0 ? (() => {
              const o = computeOrganizerBreakdown(form.pricing.amount, 1);
              return (
                <View style={styles.earnings}>
                  <Text style={styles.earningsEyebrow}>Your earnings per ticket</Text>
                  <View style={styles.earnRow}><Text style={styles.earnKey}>Ticket price</Text><Text style={styles.earnVal}>{formatRupees(form.pricing.amount)}</Text></View>
                  <View style={styles.earnRow}><Text style={styles.earnKey}>− NETSA fee · {NETSA_FEE_PERCENT}%</Text><Text style={styles.earnVal}>− {formatRupees(o.netsaFee)}</Text></View>
                  <View style={styles.earnDivider} />
                  <View style={[styles.earnRow, { alignItems: 'baseline' }]}>
                    <Text style={[styles.earnKey, { color: TEXT_0, fontFamily: 'Outfit-SemiBold' }]}>= You receive</Text>
                    <Text style={styles.earnTotal}>{formatRupees(o.organizerNet)}</Text>
                  </View>
                  <Text style={styles.earnNote}>
                    Customer pays {formatRupees(o.customerPays)} ({formatRupees(form.pricing.amount)} + {formatRupees(o.serviceFee)} service fee). Instant Razorpay split — no escrow.
                  </Text>
                </View>
              );
            })() : null}

            <Text style={styles.section}>Refund policy</Text>
            <View style={{ gap: 8 }}>
              {REFUND_OPTIONS.map((opt) => {
                const active = form.pricing.refundPolicy === opt.value;
                return (
                  <Pressable key={opt.value} onPress={() => setRefundPolicy(opt.value)} style={[styles.refundRow, active && styles.refundRowOn]}>
                    <RadioDot on={active} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: active ? TEXT_0 : TEXT_1 }]}>{opt.label}</Text>
                      <Text style={[styles.rowSub, { color: active ? TEXT_2 : TEXT_3 }]}>{opt.sub}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {form.pricing.refundPolicy === 'custom' ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.section}>Custom refund note · required</Text>
                <TextInput
                  value={form.pricing.refundCustomNote ?? ''}
                  onChangeText={setRefundNote}
                  placeholder="e.g. Full refund up to 7 days before, 50% within 7 days, none within 48h."
                  placeholderTextColor={TEXT_3}
                  multiline
                  maxLength={200}
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                />
                <Text style={styles.counter}>{(form.pricing.refundCustomNote ?? '').length} / 200</Text>
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      {/* Bottom nav */}
      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={() => { markComplete(4); onNext(); }}
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

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function SwitchPill({ on }: { on: boolean }) {
  return (
    <View style={[styles.track, on ? styles.trackOn : styles.trackOff]}>
      <View style={[styles.knob, { backgroundColor: on ? '#fff' : TEXT_4, alignSelf: on ? 'flex-end' : 'flex-start' }]} />
    </View>
  );
}

function RadioDot({ on }: { on: boolean }) {
  return (
    <View style={[styles.radio, { borderColor: on ? ORANGE : TEXT_4 }]}>
      {on ? <View style={styles.radioInner} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: 'SpaceMono-Bold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: TEXT_3, marginTop: 18, marginBottom: 8 },
  helper: { fontFamily: 'Outfit-Regular', fontSize: 11, color: TEXT_3, marginTop: 8 },
  counter: { fontFamily: 'Outfit-Regular', fontSize: 10.5, color: TEXT_3, textAlign: 'right', marginTop: 6 },
  input: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: TEXT_0, fontFamily: 'Outfit-Regular', fontSize: 14 },

  verifiedPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, backgroundColor: GREEN_SOFT, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4 },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
  verifiedText: { fontFamily: 'Outfit-SemiBold', fontSize: 10.5, color: GREEN },

  bigBox: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  bigNum: { fontFamily: 'DMSerifDisplay_400Regular', color: TEXT_0, fontSize: 44, lineHeight: 50, textAlign: 'center', padding: 0, minWidth: 80 },
  rupee: { fontFamily: 'DMSerifDisplay_400Regular', color: TEXT_2, fontSize: 22 },
  bigUnit: { fontFamily: 'Outfit-Regular', fontSize: 11, color: TEXT_2, marginTop: 4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE },
  chipOn: { backgroundColor: TEXT_0, borderColor: TEXT_0 },
  chipText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  chipTextOn: { fontFamily: 'Outfit-SemiBold', color: ORANGE_INK },

  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderTopColor: 'rgba(243,239,232,0.06)' },
  rowTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 13.5, color: TEXT_0 },
  rowSub: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: TEXT_2, marginTop: 2 },

  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE, borderRadius: 10, padding: 13, paddingHorizontal: 14 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE },
  radioRowOn: { backgroundColor: ORANGE_SOFT, borderColor: ORANGE_LINE },
  radioTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: TEXT_0 },
  radioSub: { fontFamily: 'Outfit-Regular', fontSize: 11, color: TEXT_2 },

  refundRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE },
  refundRowOn: { borderColor: ORANGE_LINE },

  earnings: { backgroundColor: SURFACE, borderWidth: 1, borderColor: ORANGE_LINE, borderRadius: 12, padding: 14, marginTop: 14 },
  earningsEyebrow: { fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.3, textTransform: 'uppercase', color: ORANGE, marginBottom: 10 },
  earnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  earnKey: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: TEXT_1 },
  earnVal: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: TEXT_0 },
  earnDivider: { height: 1, backgroundColor: HAIRLINE, marginVertical: 5 },
  earnTotal: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: ORANGE },
  earnNote: { fontFamily: 'Outfit-Regular', fontSize: 10.5, color: TEXT_2, lineHeight: 16, marginTop: 8 },

  gate: { backgroundColor: YELLOW_SOFT, borderWidth: 1, borderColor: 'rgba(234,179,8,0.32)', borderRadius: 12, padding: 16, marginTop: 18, gap: 6 },
  gateEyebrow: { fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.3, textTransform: 'uppercase', color: YELLOW },
  gateTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: TEXT_0 },
  gateBody: { fontFamily: 'Outfit-Regular', fontSize: 12, color: TEXT_1, lineHeight: 17 },
  gateBtn: { backgroundColor: YELLOW, borderRadius: 9, paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  gateBtnText: { fontFamily: 'Outfit-Bold', fontSize: 13, color: '#1a1106' },
  locked: { opacity: 0.4 },

  track: { width: 46, height: 26, borderRadius: 99, padding: 2, justifyContent: 'center' },
  trackOn: { backgroundColor: ORANGE },
  trackOff: { backgroundColor: SURFACE_HI, borderWidth: 1, borderColor: HAIRLINE },
  knob: { width: 22, height: 22, borderRadius: 11 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: ORANGE },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  backBtn: { flex: 1, height: 48, borderRadius: 11, borderWidth: 1, borderColor: HAIRLINE, alignItems: 'center', justifyContent: 'center' },
  backText: { fontFamily: 'Outfit-Medium', fontSize: 13, color: TEXT_2 },
  continueBtn: { flex: 1, height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center' },
  continueDisabled: { backgroundColor: SURFACE },
  continueText: { fontFamily: 'Outfit-Bold', fontSize: 14, color: ORANGE_INK },
});
