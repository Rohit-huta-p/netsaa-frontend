import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Gift, IndianRupee, Calendar, Tag, Plus, X } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { Group, TextField, Segmented, Hint, Card } from '../ui';
import { C, F } from '../theme';
import { computeOrganizerBreakdown, formatRupees } from '@/lib/eventPricing';
import { CalendarModal } from '@/components/ui/CalendarModal';
import type { OfferV4 } from '../composerForm';

// A plain number box. Money = same box with a ₹ prefix.
const Num = ({ value, onChange, prefix, placeholder = '0' }: {
  value: number; onChange: (n: number) => void; prefix?: string; placeholder?: string;
}) => (
  <View style={st.num}>
    {prefix ? <Text style={st.prefix}>{prefix}</Text> : null}
    <TextInput keyboardType="number-pad" value={value ? String(value) : ''} placeholder={placeholder} placeholderTextColor={C.dim2}
      onChangeText={(t) => onChange(parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)} style={st.numInput} />
  </View>
);

export default function Step3Spots() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const updateSpot = useComposerStoreV4((s) => s.updateSpot);
  const { addOffer, updateOffer, removeOffer } = useComposerStoreV4.getState();
  const [refundOpen, setRefundOpen] = useState(false);

  // One ticket type per event — kept as the single spot the backend derives from.
  const spot = form.spots[0];
  const earn = form.paid && spot && spot.price > 0 ? computeOrganizerBreakdown(spot.price, 1) : null;
  const setCapacity = (n: number) => spot && updateSpot(spot.id, { capacity: n });
  const setPrice = (n: number) => spot && updateSpot(spot.id, { price: n });

  return (
    <View>
      <Text style={st.sub}>{form.paid ? 'Split instantly at payment. NETSA never holds the money.' : 'Free for everyone who joins.'}</Text>

      <Group label="Free or paid" required>
        <Segmented value={form.paid ? 'paid' : 'free'} onChange={(v) => update('paid', v === 'paid')}
          options={[{ key: 'free', label: 'Free', icon: Gift }, { key: 'paid', label: 'Paid', icon: IndianRupee }]} />
      </Group>

      <Group label={form.paid ? 'Tickets' : 'Capacity'} required>
        <View style={st.row}>
          <View style={{ flex: 1 }}>
            <Text style={st.miniLab}>How many can join</Text>
            <Num value={spot?.capacity ?? 0} onChange={setCapacity} placeholder="20" />
          </View>
          {form.paid ? (
            <View style={{ flex: 1 }}>
              <Text style={st.miniLab}>Price per ticket</Text>
              <Num value={spot?.price ?? 0} onChange={setPrice} prefix="₹" />
            </View>
          ) : null}
        </View>
        <Hint>{form.paid ? 'One price for everyone. You can change it any time before the event.' : 'How many people can join for free.'}</Hint>
      </Group>

      {earn ? (
        <Group label="What you receive" sub={`${formatRupees(spot.price)} per ticket`}>
          <Card>
            <Row k="Ticket price" v={formatRupees(spot.price)} />
            <Row k="− NETSA fee · 0.5%" v={`− ${formatRupees(earn.netsaFee)}`} />
            <Row k="= You receive" v={formatRupees(earn.organizerNet)} bold />
            <Text style={st.enote}>Attendee pays {formatRupees(earn.customerPays)} (incl. 2.36% payment fee). Instant Razorpay split, no escrow.</Text>
          </Card>
          <Hint>No bank linked yet? You'll link one when you tap Publish.</Hint>
        </Group>
      ) : null}

      {form.paid ? (
        <Group label="Discounts" optional sub="Early-bird or group price for the whole event. Best price wins — they don't stack.">
          {form.offers.map((o: OfferV4) => (
            <Card key={o.id} style={st.offerCardGap}>
              <View style={st.offerTop}>
                <View style={st.offerName}>
                  <Tag size={13} color={C.orange} />
                  <TextInput value={o.name} onChangeText={(t) => updateOffer(o.id, { name: t })} placeholder="Name (e.g. Early bird)" placeholderTextColor={C.dim2} style={st.offerNameInput} />
                </View>
                <Pressable onPress={() => removeOffer(o.id)}><X size={16} color={C.dim2} /></Pressable>
              </View>
              <Segmented value={o.audience} onChange={(v) => updateOffer(o.id, { audience: v })}
                options={[{ key: 'everyone', label: 'Everyone' }, { key: 'group', label: 'Groups of N+' }]} />
              <View style={st.row}>
                <View style={{ flex: 1 }}>
                  <Text style={st.miniLab}>Price each</Text>
                  <Num prefix="₹" value={o.price} onChange={(n) => updateOffer(o.id, { price: n })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.miniLab}>{o.audience === 'group' ? 'Min people' : 'First N (optional)'}</Text>
                  {o.audience === 'group'
                    ? <Num value={o.minSeats ?? 2} onChange={(n) => updateOffer(o.id, { minSeats: n || 2 })} placeholder="2" />
                    : <Num value={o.seatLimit ?? 0} onChange={(n) => updateOffer(o.id, { seatLimit: n || null })} placeholder="any" />}
                </View>
              </View>
            </Card>
          ))}
          {form.offers.length < 3 ? (
            <Pressable onPress={() => addOffer()} style={st.add}><Plus size={16} color={C.orange} /><Text style={st.addTxt}>Add a discount</Text></Pressable>
          ) : <Hint>3 of 3 used. Remove one to add another.</Hint>}
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
              <Pressable onPress={() => setRefundOpen(true)}>
                <View style={st.dateField}>
                  <Calendar size={14} color={C.dim} />
                  <Text style={[st.fieldVal, !form.refundFullUntil && { color: C.dim2 }]}>{form.refundFullUntil ? new Date(form.refundFullUntil).toLocaleDateString('en-IN') : 'Full refund until…'}</Text>
                </View>
              </Pressable>
              <TextField placeholder="A note for attendees (optional)" value={form.refundNote} onChangeText={(t) => update('refundNote', t)} />
            </>
          ) : null}
        </Group>
      ) : null}

      <CalendarModal visible={refundOpen} onClose={() => setRefundOpen(false)} minDate={new Date()}
        onSelect={(d) => { update('refundFullUntil', d.toISOString()); setRefundOpen(false); }} />
    </View>
  );
}

const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => (
  <View style={st.erow}><Text style={[st.ek, bold && { color: C.t2 }]}>{k}</Text><Text style={[st.ev, bold && st.evBold]}>{v}</Text></View>
);

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12 },
  miniLab: { fontFamily: F.bold, fontSize: 11, color: C.t3, marginBottom: 5 },
  num: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingHorizontal: 12, height: 46 },
  prefix: { fontFamily: F.bold, fontSize: 16, color: C.dim },
  numInput: { flex: 1, fontFamily: F.bold, fontSize: 16, color: C.t1, padding: 0 },
  offerCardGap: { gap: 9 },
  offerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offerName: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  offerNameInput: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.t1, padding: 0 },
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
