// src/components/gigs/detail/ProducerPanel.tsx
// Producer tab: trust header (avatar · name · verified · org) + real stats
// strip (rating / gigs hosted / reply time) + a link to the full profile.
// No fabricated bio or review counts — only fields the snapshot provides.

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { C, F, Avatar, VerifiedMark } from './ui';
import type { GigDetailVM } from './gigDetailVM';

export function ProducerPanel({ vm, onViewProfile }: { vm: GigDetailVM; onViewProfile?: () => void }) {
  const p = vm.producer;
  const stats = [
    p.ratingLabel ? { n: `${p.ratingLabel} ★`, l: 'rating' } : null,
    p.gigsHosted != null ? { n: String(p.gigsHosted), l: 'gigs hosted' } : null,
    p.replyLabel ? { n: p.replyLabel, l: 'reply time' } : null,
  ].filter(Boolean) as { n: string; l: string }[];

  return (
    <View style={s.pad}>
      <View style={s.head}>
        <Avatar url={p.avatarUrl} initials={p.initials} size={50} />
        <View style={{ flex: 1 }}>
          <View style={s.nameRow}>
            <Text style={s.name}>{p.displayName}</Text>
            {p.isVerified && <VerifiedMark size={16} />}
          </View>
          {!!p.organizationName && <Text style={s.role}>{p.organizationName}</Text>}
        </View>
        {p.isVerified && (
          <View style={s.vpill}>
            <Text style={s.vpillTxt}>Verified</Text>
          </View>
        )}
      </View>

      {stats.length > 0 && (
        <View style={s.stats}>
          {stats.map((st, i) => (
            <View key={st.l} style={[s.stat, i > 0 && s.statBorder]}>
              <Text style={s.n}>{st.n}</Text>
              <Text style={s.l}>{st.l.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={onViewProfile} accessibilityRole="button" accessibilityLabel="View full profile" style={s.profileBtn}>
        <Text style={s.profileTxt}>View full profile</Text>
        <ChevronRight size={16} color={C.t4} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 18 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: F.bold, fontSize: 17, color: C.t1 },
  role: { fontFamily: F.reg, fontSize: 12.5, color: C.t4, marginTop: 3 },
  vpill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: C.greenSoft, borderWidth: 1, borderColor: C.greenBorder },
  vpillTxt: { fontFamily: F.semi, fontSize: 11, color: C.green },
  stats: { flexDirection: 'row', borderWidth: 1, borderColor: C.wellb, borderRadius: 14, marginTop: 16, overflow: 'hidden', backgroundColor: C.card },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: C.hair },
  n: { fontFamily: F.bold, fontSize: 18, color: '#fff' },
  l: { fontFamily: F.semi, fontSize: 8.5, letterSpacing: 1, color: C.t4, marginTop: 4 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.well, borderWidth: 1, borderColor: C.wellb },
  profileTxt: { fontFamily: F.semi, fontSize: 14, color: C.t2 },
});
