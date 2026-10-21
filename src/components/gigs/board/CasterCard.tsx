// src/components/gigs/board/CasterCard.tsx
//
// Casting lens — wellfound-style caster-grouped card (the direction the user
// loved). Avatar + name + what-they-are + Follow, with the caster's open roles
// nested beneath. Role tap → gig detail; caster header / Follow → /profile/:id
// (where the real follow/connect lives — no fake local toggle). Verified tick
// and "Worked together" badge stay off until the backend carries those signals.

import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, BadgeCheck, Users } from 'lucide-react-native';
import { C, F, INK, AMBER, casterGradient, initialOf } from './theme';
import type { CasterGroup } from './casterGroups';

export function CasterCard({
  group,
  onPressRole,
  onPressCaster,
}: {
  group: CasterGroup;
  onPressRole: (gig: any) => void;
  onPressCaster?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [g0, g1] = casterGradient(group.id);
  const shown = expanded ? group.roles : group.roles.slice(0, 2);

  return (
    <View style={s.caster}>
      <Pressable style={s.h} onPress={onPressCaster} disabled={!onPressCaster}>
        {group.avatarUrl ? (
          <Image source={{ uri: group.avatarUrl }} style={s.av} />
        ) : (
          <LinearGradient colors={[g0, g1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.av}>
            <Text style={s.avTxt}>{initialOf(group.name)}</Text>
          </LinearGradient>
        )}
        <View style={s.hb}>
          <View style={s.nmRow}>
            <Text style={s.nm} numberOfLines={1}>
              {group.name}
            </Text>
            {group.verified ? <BadgeCheck size={13} color={C.green} /> : null}
          </View>
          <Text style={s.role} numberOfLines={1}>
            {`${group.total} open ${group.total === 1 ? 'role' : 'roles'}${group.city ? ` · ${group.city}` : ''}`.toUpperCase()}
          </Text>
        </View>
        {onPressCaster ? (
          <View style={s.follow}>
            <Text style={s.followTxt}>FOLLOW</Text>
          </View>
        ) : null}
      </Pressable>

      {group.workedGigs ? (
        <View style={s.worked}>
          <Users size={11} color={C.blue} />
          <Text style={s.workedTxt}>WORKED TOGETHER · {group.workedGigs} GIGS</Text>
        </View>
      ) : null}

      <View style={s.roles}>
        {shown.map((r, i) => (
          <Pressable
            key={r.gig?._id ?? i}
            onPress={() => onPressRole(r.gig)}
            style={[s.crole, i === shown.length - 1 && s.croleLast]}
          >
            <View style={s.cdot} />
            <View style={s.cb}>
              <Text style={s.ct} numberOfLines={1}>
                {r.title}
              </Text>
              {r.date || r.urgLabel ? (
                <Text style={s.cm} numberOfLines={1}>
                  {r.date}
                  {r.urgLabel ? (
                    <Text style={{ color: AMBER }}>
                      {r.date ? '  ·  ' : ''}
                      {r.urgLabel}
                    </Text>
                  ) : null}
                </Text>
              ) : null}
            </View>
            <View style={s.cr}>
              <Text style={s.cpay}>{r.pay}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {group.total > 2 ? (
        <Pressable style={s.all} onPress={() => setExpanded((v) => !v)}>
          <Text style={s.allTxt}>{expanded ? 'SHOW LESS' : `VIEW ALL ${group.total} ROLES`}</Text>
          <ArrowRight size={12} color={C.t2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  caster: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  h: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  av: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avTxt: { fontFamily: F.serif, fontSize: 19, color: INK },
  hb: { flex: 1, minWidth: 0 },
  nmRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nm: { fontFamily: F.semi, fontSize: 15, color: C.cream, flexShrink: 1 },
  role: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.5, color: C.t2, marginTop: 4 },
  follow: {
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  followTxt: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.orange },
  worked: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 11 },
  workedTxt: { fontFamily: F.bold, fontSize: 8, letterSpacing: 0.8, color: C.blue },
  roles: { marginTop: 12, borderTopWidth: 1, borderTopColor: C.hairSoft, paddingTop: 2 },
  crole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.hairSoft,
  },
  croleLast: { borderBottomWidth: 0 },
  cdot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.orange },
  cb: { flex: 1, minWidth: 0 },
  ct: { fontFamily: F.body, fontSize: 13, color: C.cream },
  cm: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 0.3, color: C.t2, marginTop: 3 },
  cr: {},
  cpay: { fontFamily: F.serif, fontSize: 14, color: C.cream },
  all: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.hairSoft,
  },
  allTxt: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.t2 },
});
