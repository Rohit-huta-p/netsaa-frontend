// src/components/gigs/board/GigBoardCard.tsx
//
// Compact A·Minimal gig card for the Roles lens (DOCS/.../gig-board-aminimal.html).
// Three zones: top strip (craft chip · urgency · save) / serif title (2-line) /
// hairline footer (poster · city · date — left, pay — right). Pay is a plain
// fact (fixed / range / Negotiable) — never take-home or fee math.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Bookmark, Check } from 'lucide-react-native';
import useAuthStore from '@/stores/authStore';
import gigService from '@/services/gigService';
import { C, F, INK, AMBER, fmtPay, fmtDate, fmtUrgency } from './theme';

export function GigBoardCard({
  gig,
  onPress,
  isSelected,
}: {
  gig: any;
  onPress: () => void;
  isSelected?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const [saved, setSaved] = useState<boolean>(!!gig?.viewerContext?.saved);

  // Mirrors useGigActions.handleSave: auth-gate → optimistic → reconcile/revert.
  const toggleSave = async () => {
    if (!user) return; // guests can't save
    const next = !saved;
    setSaved(next);
    try {
      const res = await gigService.saveGig(gig._id);
      if (res?.data?.saved !== undefined) setSaved(res.data.saved);
    } catch {
      setSaved(!next);
    }
  };

  const craft = gig?.artistTypes?.[0];
  const urg = fmtUrgency(gig);
  const pay = fmtPay(gig?.compensation);
  const poster = gig?.organizerSnapshot?.organizationName || gig?.organizerSnapshot?.displayName;
  const city = gig?.location?.city;
  const date = fmtDate(gig?.applicationDeadline || gig?.schedule?.startDate || gig?.createdAt);
  // No trust/verified field on the gig model yet → tick stays off (backend follow-up).
  const verified = false;
  const metaParts = [city, date].filter(Boolean).join(' · ');
  const dim = metaParts ? (poster ? `· ${metaParts}` : metaParts) : '';

  return (
    <Pressable onPress={onPress} style={[s.card, isSelected && s.cardSel]}>
      <View style={s.top}>
        {craft ? (
          <View style={s.chip}>
            <Text style={s.chipTxt}>{String(craft).toUpperCase()}</Text>
          </View>
        ) : null}
        {urg ? (
          <View style={[s.urg, urg.soon ? s.urgSoon : s.urgNew]}>
            <Text style={[s.urgTxt, { color: urg.soon ? AMBER : C.orange }]}>
              {urg.label.toUpperCase()}
            </Text>
          </View>
        ) : null}
        <Pressable onPress={toggleSave} hitSlop={8} style={[s.save, saved && s.saveOn]}>
          <Bookmark size={14} color={saved ? C.orange : C.t3} fill={saved ? C.orange : 'transparent'} />
        </Pressable>
      </View>

      <Text style={s.title} numberOfLines={2}>
        {gig?.title || 'Untitled role'}
      </Text>

      <View style={s.foot}>
        <View style={s.sub}>
          {poster ? (
            <Text style={s.nm} numberOfLines={1}>
              {poster}
            </Text>
          ) : null}
          {verified ? <Check size={10} color={C.green} /> : null}
          {dim ? (
            <Text style={s.dim} numberOfLines={1}>
              {dim}
            </Text>
          ) : null}
        </View>
        <View style={s.payWrap}>
          <Text style={s.pay}>
            {pay.amount}
            {pay.unit ? <Text style={s.payU}> {pay.unit.toUpperCase()}</Text> : null}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardSel: { borderColor: 'rgba(255,107,53,0.5)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipTxt: { fontFamily: F.mono, fontSize: 8, letterSpacing: 1.4, color: C.t2 },
  urg: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  urgSoon: { backgroundColor: 'rgba(245,158,11,0.14)' },
  urgNew: { backgroundColor: 'rgba(255,107,53,0.13)' },
  urgTxt: { fontFamily: F.bold, fontSize: 8, letterSpacing: 1 },
  save: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.hair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOn: { borderColor: 'rgba(255,107,53,0.35)' },
  title: { fontFamily: F.serif, fontSize: 18, lineHeight: 22, letterSpacing: -0.3, color: C.cream },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: C.hairSoft,
  },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 },
  nm: { fontFamily: F.body, fontSize: 12, color: C.t1, flexShrink: 0 },
  dim: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 0.3, color: C.t3, flexShrink: 1 },
  payWrap: { flexShrink: 0 },
  pay: { fontFamily: F.serif, fontSize: 18, color: C.cream },
  payU: { fontFamily: F.mono, fontSize: 8, letterSpacing: 1, color: C.t3 },
});
