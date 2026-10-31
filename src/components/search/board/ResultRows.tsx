// src/components/search/board/ResultRows.tsx
//
// A·Minimal result rows for /search — Person, Gig, Event (search mockup, .row).
//   Person: avatar · name (+verified +role tag) · craft · city · Connect/Follow
//   Gig:    briefcase tile · title · poster · city · date · pay (plain fact)
//   Event:  date chit · title · type · city · N going · price / Free
// Pay is always a quiet plain fact — serif amount + tiny mono unit, never a
// hero and never any take-home / fee math (pay-as-fact rule).

import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Briefcase, Check, UserPlus } from 'lucide-react-native';
import connectionService from '@/services/connectionService';
import { interpretConnectionError } from '@/utils/connectionErrors';
import {
  C,
  F,
  ORANGE_SOFT,
  ORANGE_LINE,
  avatarGradient,
  initialOf,
  fmtPayFact,
  fmtEventPrice,
  fmtMetaDate,
  fmtMonthDay,
  metaLine,
} from './theme';

export type ConnectionStatus = 'none' | 'pending' | 'connected';

/* ─── avatar (image, else gradient + initial) ─────────────────────────────── */

function Avatar({ name, uri, size = 46 }: { name?: string; uri?: string; size?: number }) {
  const [g1, g2] = avatarGradient(name || uri);
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <LinearGradient
      colors={[g1, g2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: F.bold, fontSize: size * 0.35, color: 'rgba(255,255,255,0.92)' }}>
        {initialOf(name)}
      </Text>
    </LinearGradient>
  );
}

function VerifiedTick() {
  return (
    <View style={s.vf}>
      <Check size={9} color={C.canvas} strokeWidth={3.6} />
    </View>
  );
}

/* ─── person ──────────────────────────────────────────────────────────────── */

function personName(item: any): string {
  return (
    [item.firstName, item.lastName].filter(Boolean).join(' ').trim() ||
    item.displayName ||
    item.name ||
    item.title ||
    'Unknown'
  );
}

function isOrganization(item: any): boolean {
  return Boolean(
    item.isOrganization ||
      item.organizationName ||
      item.accountType === 'organization' ||
      item.role === 'creative_lead' ||
      item.kind === 'organization',
  );
}

export function PersonRow({
  item,
  status: initialStatus,
  onPress,
}: {
  item: any;
  status: ConnectionStatus;
  onPress?: () => void;
}) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => setStatus(initialStatus), [initialStatus]);

  const id = item._id || item.id;
  const name = personName(item);
  const craft = item.artistType || item.primaryCraft || item.craft || item.artistTypes?.[0];
  const city = item.city || item.primaryCity || item.location?.city;
  const avatar = item.profileImageUrl || item.avatarUrl || item.image;
  const verified =
    Boolean(item.verified || item.isVerified) ||
    item.trustTier === 'verified' ||
    item.trustTier === 'Verified';
  const org = isOrganization(item);
  const tag = item.roleTag || (org ? 'Studio' : undefined);

  const handleConnect = async () => {
    // Orgs follow from their profile (no fake inline toggle) — open the row.
    if (org) return onPress?.();
    if (status !== 'none' || loading) return;
    try {
      setLoading(true);
      await connectionService.sendConnectionRequest(id);
      setStatus('pending');
    } catch (error: any) {
      const info = interpretConnectionError(error);
      if (info.swallow) setStatus('pending');
      else Alert.alert(info.title, info.message);
    } finally {
      setLoading(false);
    }
  };

  const meta = metaLine(craft, city);

  return (
    <Pressable onPress={onPress} style={s.row}>
      <Avatar name={name} uri={avatar} />
      <View style={s.body}>
        <View style={s.nmRow}>
          <Text style={s.nm} numberOfLines={1}>
            {name}
          </Text>
          {verified ? <VerifiedTick /> : null}
          {tag ? <Text style={s.tag}>{String(tag).toUpperCase()}</Text> : null}
        </View>
        {meta ? (
          <Text style={s.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      <Action
        status={status}
        loading={loading}
        org={org}
        onPress={(e) => {
          e.stopPropagation?.();
          handleConnect();
        }}
      />
    </Pressable>
  );
}

function Action({
  status,
  loading,
  org,
  onPress,
}: {
  status: ConnectionStatus;
  loading: boolean;
  org: boolean;
  onPress: (e: any) => void;
}) {
  if (status === 'connected') {
    return (
      <View style={s.ghost}>
        <Text style={s.ghostTxt}>Following</Text>
      </View>
    );
  }
  if (status === 'pending') {
    return (
      <View style={s.ghost}>
        <Text style={s.ghostTxt}>Pending</Text>
      </View>
    );
  }
  return (
    <Pressable onPress={onPress} disabled={loading} style={s.connect} hitSlop={6}>
      {loading ? (
        <ActivityIndicator size="small" color={C.orange} />
      ) : (
        <>
          {!org ? <UserPlus size={13} color={C.orange} strokeWidth={2.2} /> : null}
          <Text style={s.connectTxt}>{org ? 'Follow' : 'Connect'}</Text>
        </>
      )}
    </Pressable>
  );
}

/* ─── gig ─────────────────────────────────────────────────────────────────── */

export function GigRow({ item, onPress }: { item: any; onPress?: () => void }) {
  const poster = item.organizerSnapshot?.displayName || item.organizerName || item.posterName;
  const city = item.location?.city || item.city;
  const date = fmtMetaDate(item.schedule?.startDate || item.startDate || item.date);
  const pay = fmtPayFact(item.compensation ?? item.pay);
  const meta = metaLine(poster, city, date);

  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={s.tile}>
        <Briefcase size={20} color={C.orange} strokeWidth={1.8} />
      </View>
      <View style={s.body}>
        <Text style={s.nm} numberOfLines={1}>
          {item.title}
        </Text>
        {meta ? (
          <Text style={s.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      {pay.amount ? (
        <View style={s.right}>
          <Text style={s.pay}>
            {pay.amount}
            {pay.unit ? <Text style={s.payUnit}>{pay.unit}</Text> : null}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ─── event ───────────────────────────────────────────────────────────────── */

export function EventRow({ item, onPress }: { item: any; onPress?: () => void }) {
  const { month, day } = fmtMonthDay(item.date || item.startDate || item.schedule?.startDate);
  const type = item.eventType || item.type || item.category;
  const city = item.city || item.location?.city || item.venue?.city;
  const goingN =
    item.attendeeCount ?? item.registrationCount ?? item.goingCount ?? item.attendees ?? null;
  const going = typeof goingN === 'number' ? `${goingN} going` : null;
  const price = fmtEventPrice(item);
  const meta = metaLine(type, city, going);

  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={s.dtile}>
        {month ? <Text style={s.dMonth}>{month}</Text> : null}
        <Text style={s.dDay}>{day || '·'}</Text>
      </View>
      <View style={s.body}>
        <Text style={s.nm} numberOfLines={1}>
          {item.title || item.name}
        </Text>
        {meta ? (
          <Text style={s.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <View style={s.right}>
        {price.free ? <Text style={s.free}>Free</Text> : <Text style={s.pay}>{price.label}</Text>}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.hairSoft,
  },
  body: { flex: 1, minWidth: 0 },
  nmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nm: { fontFamily: F.semi, fontSize: 15, color: C.cream, flexShrink: 1 },
  meta: { fontFamily: F.body, fontSize: 12.5, color: C.t3, marginTop: 3 },

  vf: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    fontFamily: F.mono,
    fontSize: 8.5,
    letterSpacing: 1,
    color: C.t3,
    borderWidth: 1,
    borderColor: C.hairSoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    overflow: 'hidden',
  },

  // gig tile
  tile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: ORANGE_SOFT,
    borderWidth: 1,
    borderColor: ORANGE_LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // event date chit
  dtile: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hair,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  dMonth: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.t3 },
  dDay: { fontFamily: F.serif, fontSize: 17, color: C.cream, lineHeight: 18 },

  // pay (plain fact, right-aligned)
  right: { alignItems: 'flex-end' },
  pay: { fontFamily: F.serif, fontSize: 15, color: C.t1 },
  payUnit: { fontFamily: F.mono, fontSize: 9.5, color: C.t4 },
  free: { fontFamily: F.semi, fontSize: 13, color: C.green },

  // person action pills
  connect: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ORANGE_LINE,
    backgroundColor: ORANGE_SOFT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  connectTxt: { fontFamily: F.semi, fontSize: 12.5, color: C.orange },
  ghost: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.hair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostTxt: { fontFamily: F.med, fontSize: 12.5, color: C.t3 },
});
