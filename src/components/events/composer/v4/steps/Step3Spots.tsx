import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Gift, IndianRupee, Calendar, Clock, Users, Plus, X } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { Group, TextField, Segmented, Hint, Card } from '../ui';
import { C, F } from '../theme';
import { computeOrganizerBreakdown, formatRupees } from '@/lib/eventPricing';
import { CalendarModal } from '@/components/ui/CalendarModal';
import type { OfferV4 } from '../composerForm';

const MAX_TIERS = 4;

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

const Toggle = ({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) => (
  <Pressable onPress={onPress} style={[st.tog, on && st.togOn]} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label}>
    <View style={[st.knob, on && st.knobOn]} />
  </Pressable>
);

export default function Step3Spots() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const updateSpot = useComposerStoreV4((s) => s.updateSpot);
  const { addOffer, updateOffer, removeOffer } = useComposerStoreV4.getState();
  const [refundOpen, setRefundOpen] = useState(false);

  // One ticket type per event — kept as the single spot the backend derives from.
  const spot = form.spots[0];
  const basePrice = spot?.price ?? 0;
  const earn = form.paid && spot && spot.price > 0 ? computeOrganizerBreakdown(spot.price, 1) : null;
  const setCapacity = (n: number) => spot && updateSpot(spot.id, { capacity: n });
  const setPrice = (n: number) => spot && updateSpot(spot.id, { price: n });

  // Discounts live in form.offers: one audience:'everyone' (early bird) + N audience:'group' tiers.
  const earlyBird = form.offers.find((o) => o.audience === 'everyone');
  const groupTiers = form.offers.filter((o) => o.audience === 'group');

  const toggleEarlyBird = () => {
    if (earlyBird) update('offers', form.offers.filter((o) => o.audience !== 'everyone'));
    else addOffer({ name: 'Early bird', audience: 'everyone', price: basePrice });
  };
  const toggleGroup = () => {
    if (groupTiers.length) update('offers', form.offers.filter((o) => o.audience !== 'group'));
    else addOffer({ name: 'Group rate', audience: 'group', minSeats: 2, price: basePrice });
  };
  const addTier = () => {
    if (groupTiers.length >= MAX_TIERS) return;
    const nextMin = groupTiers.length ? Math.max(...groupTiers.map((t) => t.minSeats ?? 2)) + 1 : 2;
    addOffer({ name: 'Group rate', audience: 'group', minSeats: nextMin, price: basePrice });
  };

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
        <Group label="Discounts" optional sub="Reward booking early, or booking together. Turn on what you want.">
          {/* ── Early bird ── */}
          <View style={[st.disc, !!earlyBird && st.discOn]}>
            <View style={st.discHead}>
              <View style={st.discIc}><Clock size={15} color={C.orange} /></View>
              <View style={{ flex: 1 }}>
                <Text style={st.discName}>Early bird</Text>
                <Text style={st.discMeta}>A lower price for everyone — or just the first few.</Text>
              </View>
              <Toggle on={!!earlyBird} onPress={toggleEarlyBird} label="Early bird" />
            </View>
            {earlyBird ? (
              <View style={[st.row, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}><Text style={st.miniLab}>Price each</Text><Num prefix="₹" value={earlyBird.price} onChange={(n) => updateOffer(earlyBird.id, { price: n })} /></View>
                <View style={{ flex: 1 }}><Text style={st.miniLab}>First N tickets</Text><Num value={earlyBird.seatLimit ?? 0} onChange={(n) => updateOffer(earlyBird.id, { seatLimit: n || null })} placeholder="any" /></View>
              </View>
            ) : null}
          </View>

          {/* ── Group rates (its own section + toggle) ── */}
          <View style={[st.disc, groupTiers.length > 0 && st.discOn]}>
            <View style={st.discHead}>
              <View style={st.discIc}><Users size={15} color={C.orange} /></View>
              <View style={{ flex: 1 }}>
                <Text style={st.discName}>Group rates</Text>
                <Text style={st.discMeta}>Cheaper when people book together.</Text>
              </View>
              <Toggle on={groupTiers.length > 0} onPress={toggleGroup} label="Group rates" />
            </View>
            {groupTiers.length > 0 ? (
              <View style={{ gap: 7, marginTop: 12 }}>
                {groupTiers.map((o: OfferV4) => (
                  <View key={o.id} style={st.tier}>
                    <View style={st.tierMinBox}><Num value={o.minSeats ?? 2} onChange={(n) => updateOffer(o.id, { minSeats: n || 2 })} placeholder="2" /></View>
                    <Text style={st.tierLbl}>+ people</Text>
                    <View style={{ flex: 1 }}><Num prefix="₹" value={o.price} onChange={(n) => updateOffer(o.id, { price: n })} /></View>
                    <Pressable onPress={() => removeOffer(o.id)} hitSlop={6}><X size={15} color={C.dim2} /></Pressable>
                  </View>
                ))}
                {groupTiers.length < MAX_TIERS ? (
                  <Pressable onPress={addTier} style={st.add}><Plus size={15} color={C.orange} /><Text style={st.addTxt}>Add a tier</Text></Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          {(earlyBird || groupTiers.length > 0) ? (
            <View style={st.ruleBar}>
              <Text style={st.ruleTxt}>Each person pays the best price they qualify for — a group of 6 gets the 5+ rate, or the early-bird price if it's lower. Discounts don't stack.</Text>
            </View>
          ) : null}
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
  numInput: { flex: 1, fontFamily: F.bold, fontSize: 16, color: C.t1, padding: 0, minWidth: 0 },
  // discount section (early bird / group rates)
  disc: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 15 },
  discOn: { borderColor: C.orangeBorder, backgroundColor: 'rgba(255,107,53,0.05)' },
  discHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  discIc: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  discName: { fontFamily: F.serif, fontSize: 16, color: C.t1, letterSpacing: -0.2 },
  discMeta: { fontFamily: F.body, fontSize: 10.5, color: C.dim, marginTop: 1 },
  // toggle switch
  tog: { width: 44, height: 26, borderRadius: 13, backgroundColor: C.border2, padding: 3, justifyContent: 'center' },
  togOn: { backgroundColor: C.orange },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  knobOn: { alignSelf: 'flex-end' },
  // group tier row
  tier: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierMinBox: { width: 68 },
  tierLbl: { fontFamily: F.semibold, fontSize: 12, color: C.dim },
  // rule note
  ruleBar: { backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', borderRadius: 12, padding: 12 },
  ruleTxt: { fontFamily: F.body, fontSize: 11, color: C.t4, lineHeight: 16 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.well, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, borderRadius: 11, paddingVertical: 11, paddingHorizontal: 12, justifyContent: 'center' },
  addTxt: { fontFamily: F.semibold, fontSize: 13, color: C.orange },
  erow: { flexDirection: 'row', justifyContent: 'space-between' },
  ek: { fontFamily: F.body, fontSize: 12.5, color: C.dim },
  ev: { fontFamily: F.semibold, fontSize: 12.5, color: C.t3 },
  evBold: { fontFamily: F.bold, color: C.t1, fontSize: 14 },
  enote: { fontFamily: F.body, fontSize: 10.5, color: C.dim, lineHeight: 15, marginTop: 2 },
  dateField: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11 },
  fieldVal: { flex: 1, fontFamily: F.medium, fontSize: 13.5, color: C.t2 },
});
