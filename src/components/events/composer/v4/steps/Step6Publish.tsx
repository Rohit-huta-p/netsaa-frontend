import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Check, TriangleAlert, Calendar, MapPin, Video, Image as ImageIcon } from 'lucide-react-native';
import { useComposerStoreV4, type V4Step } from '../useComposerStoreV4';
import { presetFor } from '../eventTypePresets';
import { Group, Segmented, Note } from '../ui';
import { C, F } from '../theme';
import { formatRupees } from '@/lib/eventPricing';

type Chk = { ok: boolean; text: string; fix?: V4Step };

function fmtDate(iso: string | null, tbd: boolean): string {
  if (tbd || !iso) return 'Date to be announced';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Date to be announced';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export default function Step6Publish() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const setStep = useComposerStoreV4((s) => s.setStep);
  const preset = presetFor(form.eventType);

  const paidSpots = form.spots.filter((s) => s.price > 0);
  const totalCap = form.spots.reduce((n, s) => n + (s.capacity || 0), 0);
  const priceText = !form.paid || !paidSpots.length ? 'Free'
    : paidSpots.length === 1 && form.spots.length === 1 ? formatRupees(paidSpots[0].price)
    : `From ${formatRupees(Math.min(...paidSpots.map((s) => s.price)))}`;
  const place = form.format === 'online'
    ? (form.location.onlinePlatform || 'Online')
    : (form.location.venueName || form.location.city || 'Venue to be announced');

  const checks: Chk[] = [
    { ok: !!form.title.trim(), text: form.title.trim() ? `Titled “${form.title.trim()}”` : 'Add a title', fix: 1 },
    { ok: form.timeTbd || !!form.startsAt, text: form.timeTbd ? 'Date to be announced' : form.startsAt ? fmtDate(form.startsAt, false) : 'Set a date and time', fix: 2 },
    { ok: form.format === 'online' ? !!form.location.onlinePlatform : !!(form.location.venueName || form.location.city), text: form.format === 'online' ? (form.location.onlinePlatform ? 'Online event' : 'Say where it happens online') : (form.location.venueName || form.location.city ? place : 'Add a venue'), fix: 2 },
    { ok: totalCap > 0, text: totalCap > 0 ? `${totalCap} ${totalCap === 1 ? 'spot' : 'spots'} across ${form.spots.length} ${form.spots.length === 1 ? 'kind' : 'kinds'}` : 'Add at least one spot', fix: 3 },
    { ok: !!form.about.trim(), text: form.about.trim() ? 'About is written' : 'Write a few lines in About', fix: 5 },
    { ok: !!form.cover, text: form.cover ? 'Cover added' : 'Add a cover so your event stands out', fix: 5 },
  ];

  const button = form.door === 'apply' ? 'Apply' : form.door === 'guest_list' ? 'Request to join'
    : (form.paid && paidSpots.length ? `Get tickets · ${priceText.replace('From ', '')}` : 'Register');
  const typeLabel = form.eventTypeLabel || preset.label;
  const chips = [typeLabel, form.level !== 'all' ? form.level : null, form.format === 'online' ? 'Online' : 'In person'].filter(Boolean) as string[];

  return (
    <View>
      <Text style={st.sub}>A last look, then it goes live.</Text>

      <Group label="Checks">
        <View style={st.checks}>
          {checks.map((c, i) => (
            <View key={i} style={st.ck}>
              <View style={[st.ci, c.ok ? st.ciOk : st.ciWarn]}>
                {c.ok ? <Check size={11} color={C.green} strokeWidth={2.8} /> : <TriangleAlert size={11} color={C.orange} strokeWidth={2.4} />}
              </View>
              <Text style={[st.ckTxt, !c.ok && st.ckWarnTxt]}>{c.text}</Text>
              {!c.ok && c.fix ? <Pressable onPress={() => setStep(c.fix!)} hitSlop={8}><Text style={st.fix}>Fix</Text></Pressable> : null}
            </View>
          ))}
        </View>
      </Group>

      <View style={st.pvLab}><View style={st.pvDot} /><Text style={st.pvLabTxt}>Preview · how artists see it</Text></View>
      <View style={st.card}>
        <View style={st.cardCover}>
          {form.cover ? (
            <Image source={{ uri: form.cover.thumbnailUrl || form.cover.url }} style={st.cardCoverImg}
              resizeMode={form.coverFit === 'fill' ? 'cover' : 'contain'} />
          ) : (
            <ImageIcon size={20} color={C.dim2} />
          )}
        </View>
        <View style={st.cardBody}>
          <View style={st.cardChips}>{chips.map((c) => <View key={c} style={st.cardChip}><Text style={st.cardChipTxt}>{c}</Text></View>)}</View>
          <Text style={st.cardTitle}>{form.title.trim() || 'Your event title'}</Text>
          <View style={st.metaRow}>
            <View style={st.meta}><Calendar size={13} color={C.dim} /><Text style={st.metaTxt}>{fmtDate(form.startsAt, form.timeTbd)}</Text></View>
            <View style={st.meta}>{form.format === 'online' ? <Video size={13} color={C.dim} /> : <MapPin size={13} color={C.dim} />}<Text style={st.metaTxt}>{place}</Text></View>
          </View>
          <View style={st.cardFoot}>
            <View style={st.price}><Text style={st.priceAmt}>{priceText}</Text></View>
            <View style={st.applyBtn}><Text style={st.applyTxt}>{button}</Text></View>
          </View>
          <View style={st.org}><View style={st.avatar}><Text style={st.avatarTxt}>You</Text></View><Text style={st.orgTxt}>You · Host · new on NETSA</Text></View>
        </View>
      </View>

      <Group label="Who can see it">
        <Segmented value={form.visibility === 'public' ? 'public' : 'unlisted'} onChange={(v) => update('visibility', v)}
          options={[{ key: 'public', label: 'Public' }, { key: 'unlisted', label: 'Only people with the link' }]} />
      </Group>

      {form.paid ? (
        <Note kind="info"><Text style={st.b}>Paid event. </Text>Tapping Publish asks you to link a bank once (about 3 minutes). If it’s still being verified, the event goes live with “Tickets open soon” and sales start the moment it’s done.</Note>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  b: { fontFamily: F.bold, color: '#fff' },
  checks: { gap: 8 },
  ck: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  ci: { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ciOk: { backgroundColor: C.greenSoft },
  ciWarn: { backgroundColor: C.orangeSoft },
  ckTxt: { flex: 1, fontFamily: F.body, fontSize: 12.5, color: C.t2, lineHeight: 17 },
  ckWarnTxt: { color: C.t3 },
  fix: { fontFamily: F.labelHeavy, fontSize: 11, color: C.orange, letterSpacing: 0.3 },
  pvLab: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  pvDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.orange },
  pvLabTxt: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 0.5, color: C.t3, textTransform: 'uppercase' },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden', marginBottom: 22 },
  cardCover: { height: 120, backgroundColor: C.well, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardCoverImg: { width: '100%', height: '100%' },
  cardBody: { padding: 13, gap: 8 },
  cardChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cardChip: { backgroundColor: C.well, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  cardChipTxt: { fontFamily: F.semibold, fontSize: 10, color: C.t3, textTransform: 'capitalize' },
  cardTitle: { fontFamily: F.serif, fontSize: 21, color: C.t1, letterSpacing: -0.3, lineHeight: 25 },
  metaRow: { gap: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaTxt: { fontFamily: F.body, fontSize: 12.5, color: C.dim },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price: {},
  priceAmt: { fontFamily: F.bold, fontSize: 16, color: C.t1 },
  applyBtn: { backgroundColor: C.orange, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  applyTxt: { fontFamily: F.labelHeavy, fontSize: 12.5, color: '#fff' },
  org: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 9, marginTop: 2 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontFamily: F.bold, fontSize: 8, color: C.orange },
  orgTxt: { fontFamily: F.body, fontSize: 11.5, color: C.dim },
});
