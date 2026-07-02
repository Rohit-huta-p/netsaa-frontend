import { useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import { useWalkupAdd } from '@/hooks/useEvents';

const BG_2 = '#0E0C12';
const SURFACE = 'rgba(255,255,255,0.04)';
const HAIRLINE_2 = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_1 = '#A1A1AA';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE_INK = '#1A0D06';
const ORANGE_LINE = 'rgba(255,107,53,0.32)';

export default function WalkupAddSheet({
  visible, event, remaining, onClose, onAdded,
}: {
  visible: boolean;
  event: EventDoc;
  remaining: number;
  onClose: () => void;
  onAdded: (name: string) => void;
}) {
  const walkup = useWalkupAdd(event._id);
  const [fullName, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [seats, setSeats] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const isPaid = event.registrationMode === 'paid_ticket';
  // Price is display-only; the server computes the authoritative amount from Event.ticketPrice.
  const priceRupees: number = (event as any).pricing?.amount ?? (event as any).ticketPrice ?? 0;
  const maxSeats = Math.max(1, Math.min(event.maxGuestsPerRegistration ?? 5, remaining));
  const seatOptions = useMemo(() => Array.from({ length: maxSeats }, (_, i) => i + 1), [maxSeats]);

  const registered = (event.capacity?.total ?? 0) - remaining;

  const reset = () => { setName(''); setPhone(''); setSeats(1); setError(null); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    setError(null);
    if (!fullName.trim() || !phone.trim()) { setError('Name and phone required'); return; }
    try {
      await walkup.mutateAsync({ fullName: fullName.trim(), phone: phone.trim(), quantity: seats, payment: isPaid ? 'cash' : 'free' });
      const name = fullName.trim();
      reset();
      onAdded(name);
    } catch (e: any) {
      const status = e?.response?.status;
      setError(status === 409 ? 'No seats left' : status === 403 ? 'Only the host can add walk-ups' : 'Could not add walk-up');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.wrap}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      <View style={styles.sheet}>
        <View style={styles.grab} />
        <Text style={styles.h3}>Add a walk-up</Text>
        <Text style={styles.lead}>{remaining} {remaining === 1 ? 'seat' : 'seats'} left in your cap. They'll be on the roster.</Text>

        <Text style={styles.label}>NAME</Text>
        <TextInput value={fullName} onChangeText={setName} placeholder="Full name" placeholderTextColor={TEXT_3} style={styles.input} />

        <Text style={styles.label}>PHONE</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phonePrefix}>+91</Text>
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="00000 00000" placeholderTextColor={TEXT_3} style={styles.phoneInput} />
        </View>

        <Text style={styles.label}>SEATS</Text>
        <View style={styles.chipRow}>
          {seatOptions.map((n) => {
            const on = n === seats;
            return (
              <Pressable key={n} onPress={() => setSeats(n)} style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>

        {isPaid ? (
          <>
            <Text style={styles.label}>PAYMENT</Text>
            <View style={styles.payRow}>
              <View style={[styles.payCard, styles.payCardOn]}>
                <Text style={styles.payTitleOn}>Cash recorded</Text>
                <Text style={styles.paySub}>₹{(priceRupees * seats).toLocaleString('en-IN')} marked paid</Text>
              </View>
              <View style={[styles.payCard, styles.payCardOff]}>
                <Text style={styles.payTitleOff}>Razorpay link</Text>
                <Text style={styles.paySubMuted}>Coming soon</Text>
              </View>
            </View>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={submit} disabled={walkup.isPending} style={[styles.cta, walkup.isPending && { opacity: 0.6 }]}>
          <Text style={styles.ctaTxt}>{walkup.isPending ? 'Adding…' : 'Add & check in →'}</Text>
        </Pressable>
        <Text style={styles.footer}>Walkup capacity: {registered + seats}/{event.capacity?.total ?? '—'} after this</Text>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: BG_2, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: HAIRLINE_2, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  grab: { width: 36, height: 3, borderRadius: 99, backgroundColor: TEXT_3, alignSelf: 'center', marginBottom: 12 },
  h3: { fontFamily: 'DMSerifDisplay_400Regular', color: TEXT_0, fontSize: 20, marginBottom: 4 },
  lead: { fontFamily: 'Outfit-Regular', color: TEXT_1, fontSize: 13, marginBottom: 14 },
  label: { fontFamily: 'SpaceMono-Bold', color: TEXT_3, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 12, color: TEXT_0, fontFamily: 'Outfit-Regular', fontSize: 14 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2, borderRadius: 9, paddingHorizontal: 14 },
  phonePrefix: { fontFamily: 'Outfit-Regular', color: TEXT_2, fontSize: 14 },
  phoneInput: { flex: 1, color: TEXT_0, fontFamily: 'Outfit-Regular', fontSize: 14, paddingVertical: 12 },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 7, backgroundColor: SURFACE, borderWidth: 1, borderColor: HAIRLINE_2 },
  chipOn: { backgroundColor: TEXT_0, borderColor: TEXT_0 },
  chipTxt: { fontFamily: 'Outfit-Medium', color: TEXT_2, fontSize: 13 },
  chipTxtOn: { fontFamily: 'Outfit-SemiBold', color: ORANGE_INK },
  payRow: { flexDirection: 'row', gap: 8 },
  payCard: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1 },
  payCardOn: { backgroundColor: SURFACE, borderColor: ORANGE_LINE },
  payCardOff: { backgroundColor: SURFACE, borderColor: HAIRLINE_2, opacity: 0.6 },
  payTitleOn: { fontFamily: 'Outfit-SemiBold', color: TEXT_0, fontSize: 12.5 },
  payTitleOff: { fontFamily: 'Outfit-Regular', color: TEXT_1, fontSize: 12.5 },
  paySub: { fontFamily: 'Outfit-Regular', color: TEXT_2, fontSize: 10.5, marginTop: 2 },
  paySubMuted: { fontFamily: 'Outfit-Regular', color: TEXT_3, fontSize: 10.5, marginTop: 2 },
  error: { fontFamily: 'Outfit-Medium', color: '#EF4444', fontSize: 12.5, marginTop: 12 },
  cta: { height: 48, borderRadius: 11, backgroundColor: TEXT_0, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  ctaTxt: { fontFamily: 'Outfit-Bold', color: ORANGE_INK, fontSize: 13.5 },
  footer: { fontFamily: 'Outfit-Regular', color: TEXT_3, fontSize: 11, textAlign: 'center', marginTop: 10 },
});
