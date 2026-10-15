import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Gift, IndianRupee, Plus, X, Tag, Calendar } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { presetFor } from '../eventTypePresets';
import { Group, TextField, Segmented, Stepper, Chips, Hint, Note, Card } from '../ui';
import { C, F } from '../theme';
import { computeOrganizerBreakdown, formatRupees } from '@/lib/eventPricing';
import { CalendarModal } from '@/components/ui/CalendarModal';
import type { SpotV4, OfferV4 } from '../composerForm';

const Money = ({ value, onChange, placeholder = '0' }: { value: number; onChange: (n: number) => void; placeholder?: string }) => (
  <View style={st.money}>
    <Text style={st.cur}>₹</Text>
    <TextInput keyboardType="number-pad" value={value ? String(value) : ''} placeholder={placeholder} placeholderTextColor={C.dim2}
      onChangeText={(t) => onChange(parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)} style={st.moneyInput} />
  </View>
);

export default function Step3Spots() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const { addSpot, updateSpot, removeSpot, addOffer, updateOffer, removeOffer } = useComposerStoreV4.getState();
  const preset = presetFor(form.eventType);
  const [offerDate, setOfferDate] = useState<string | null>(null);

  const paidSpot = form.spots.find((s) => s.price > 0);
  const earn = paidSpot ? computeOrganizerBreakdown(paidSpot.price, 1) : null;

  return (
    <View>
      <Text style={st.sub}>{form.paid ? 'Split instantly at payment. NETSA never holds the money.' : 'Free for everyone who gets in.'}</Text>

      <Group label="Free or paid" required>
        <Segmented value={form.paid ? 'paid' : 'free'} onChange={(v) => update('paid', v === 'paid')}
          options={[{ key: 'free', label: 'Free', icon: Gift }, { key: 'paid', label: 'Paid', icon: IndianRupee }]} />
      </Group>

      <Group label="Spots" required sub={form.spots.length > 1 ? 'People pick one when they sign up.' : 'How many can join. Add another kind if some people join differently.'}>
        {form.spots.map((spot: SpotV4) => (
          <Card key={spot.id} style={st.spotCard}>
            <View style={st.spotTop}>
              <TextInput value={spot.name} onChangeText={(t) => updateSpot(spot.id, { name: t })} placeholder="Name (e.g. Seats)" placeholderTextColor={C.dim2} style={st.spotName} />
              {form.spots.length > 1 ? <Pressable onPress={() => removeSpot(spot.id)}><X size={16} color={C.dim2} /></Pressable> : null}
            </View>
            <TextField placeholder="What's different about it (optional)" value={spot.note} onChangeText={(t) => updateSpot(spot.id, { note: t })} />
            <View style={st.spotRow}>
              <View style={{ flex: 1 }}>
                <Text style={st.miniLab}>How many</Text>
                <Stepper value={spot.capacity} onChange={(n) => updateSpot(spot.id, { capacity: n })} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.miniLab}>Price</Text>
                {form.paid ? <Money value={spot.price} onChange={(n) => updateSpot(spot.id, { price: n })} /> : <Text style={st.freeTag}>Free</Text>}
              </View>
            </View>
          </Card>
        ))}
        {form.spots.length < 8 ? (
          <Pressable onPress={() => addSpot()} style={st.add}><Plus size={16} color={C.orange} /><Text style={st.addTxt}>{preset.addSpotLabel}</Text></Pressable>
        ) : <Hint>8 of 8 spots. Remove one to add another.</Hint>}
      </Group>

      {form.paid && earn ? (
        <Group label="What you receive" sub={`${paidSpot!.name} · ${formatRupees(paidSpot!.price)} each`}>
          <Card>
            <Row k="Ticket price" v={formatRupees(paidSpot!.price)} />
            <Row k="− NETSA fee · 0.5%" v={`− ${formatRupees(earn.netsaFee)}`} />
            <Row k="= You receive" v={formatRupees(earn.organizerNet)} bold />
            <Text style={st.enote}>Attendee pays {formatRupees(earn.customerPays)} (incl. 2.36% payment fee). Instant Razorpay split, no escrow.</Text>
          </Card>
          <Hint>No bank linked yet? You'll link one when you tap Publish.</Hint>
        </Group>
      ) : null}

      {form.paid ? (
        <Group label="Offers" optional sub="Up to 3. Best price wins, offers don't stack.">
          {form.offers.map((o: OfferV4) => (
            <Card key={o.id} style={st.spotCard}>
              <View style={st.spotTop}>
                <View style={st.offerName}><Tag size={13} color={C.orange} />
                  <TextInput value={o.name} onChangeText={(t) => updateOffer(o.id, { name: t })} placeholder="Offer name (e.g. Early bird)" placeholderTextColor={C.dim2} style={st.spotName} />
                </View>
                <Pressable onPress={() => removeOffer(o.id)}><X size={16} color={C.dim2} /></Pressable>
              </View>
              <Segmented value={o.audience} onChange={(v) => updateOffer(o.id, { audience: v })}
                options={[{ key: 'everyone', label: 'Everyone' }, { key: 'group', label: 'Groups of N+' }]} />
              <View style={st.spotRow}>
                <View style={{ flex: 1 }}><Text style={st.miniLab}>Price each</Text><Money value={o.price} onChange={(n) => updateOffer(o.id, { price: n })} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={st.miniLab}>{o.audience === 'group' ? 'Min seats' : 'First N seats (optional)'}</Text>
                  {o.audience === 'group'
                    ? <Stepper value={o.minSeats ?? 2} min={2} onChange={(n) => updateOffer(o.id, { minSeats: n })} />
                    : <Money value={o.seatLimit ?? 0} onChange={(n) => updateOffer(o.id, { seatLimit: n || null })} placeholder="any" />}
                </View>
              </View>
            </Card>
          ))}
          {form.offers.length < 3 ? (
            <Pressable onPress={() => addOffer()} style={st.add}><Plus size={16} color={C.orange} /><Text style={st.addTxt}>Add a ticket offer</Text></Pressable>
          ) : <Hint>3 of 3 offers used. Remove one to add another.</Hint>}
        </Group>
      ) : null}

      {form.paid ? (
        <Group label="Refund policy" required>
          <Segmented value={form.refundPolicy} onChange={(v) => update('refundPolicy', v)}
            options={[{ key: 'flex_24h', label: 'Flexible' }, { key: 'firm', label: 'Firm' }, { key: 'custom', label: 'Custom' }]} />
          {form.refundPolicy === 'flex_24h' ? <Hint>Full refund up to 24h before the event.</Hint> : null}
          {form.refundPolicy === 'firm' ? <Hint>No refunds once registered.</Hint> : null}
          {form.refundPolicy === 'custom' ? (
            <>
              <Pressable onPress={() => setOfferDate('refund')}><View style={st.dateField}><Calendar size={14} color={C.dim} /><Text style={[st.fieldVal, !form.refundFullUntil && { color: C.dim2 }]}>{form.refundFullUntil ? new Date(form.refundFullUntil).toLocaleDateString('en-IN') : 'Full refund until…'}</Text></View></Pressable>
              <TextField placeholder="A note for attendees (optional)" value={form.refundNote} onChangeText={(t) => update('refundNote', t)} />
            </>
          ) : null}
        </Group>
      ) : null}

      <CalendarModal visible={offerDate === 'refund'} onClose={() => setOfferDate(null)} minDate={new Date()}
        onSelect={(d) => { update('refundFullUntil', d.toISOString()); setOfferDate(null); }} />
    </View>
  );
}

const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <View style={st.erow}><Text style={[st.ek, bold && { color: C.t2 }]}>{k}</Text><Text style={[st.ev, bold && st.evBold]}>{v}</Text></View>
);

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  spotCard: { gap: 9 },
  spotTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spotName: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.t1, padding: 0 },
  offerName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  spotRow: { flexDirection: 'row', gap: 12 },
  miniLab: { fontFamily: F.bold, fontSize: 11, color: C.t3, marginBottom: 5 },
  money: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingHorizontal: 12, height: 46 },
  cur: { fontFamily: F.bold, fontSize: 16, color: C.dim },
  moneyInput: { flex: 1, fontFamily: F.bold, fontSize: 16, color: C.t1, padding: 0 },
  freeTag: { fontFamily: F.bold, fontSize: 15, color: C.green, paddingVertical: 12 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, justifyContent: 'center' },
  addTxt: { fontFamily: F.semibold, fontSize: 13, color: C.orange },
  erow: { flexDirection: 'row', justifyContent: 'space-between' },
  ek: { fontFamily: F.body, fontSize: 12.5, color: C.dim },
  ev: { fontFamily: F.semibold, fontSize: 12.5, color: C.t3 },
  evBold: { fontFamily: F.bold, color: C.t1, fontSize: 14 },
  enote: { fontFamily: F.body, fontSize: 10.5, color: C.dim, lineHeight: 15, marginTop: 2 },
  dateField: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11 },
  fieldVal: { flex: 1, fontFamily: F.medium, fontSize: 13.5, color: C.t2 },
});
