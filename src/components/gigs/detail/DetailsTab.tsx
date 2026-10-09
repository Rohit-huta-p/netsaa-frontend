// src/components/gigs/detail/DetailsTab.tsx
// Details panel: facts strip + About(+read more) · What you'll do · Who we're
// looking for · Compensation · Perks · Terms. Sections self-hide when empty.

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { C, F, SectionTitle, Bullet, KVRow, Chip, Tag } from './ui';
import { GigFactStrip } from './GigFactStrip';
import type { GigDetailVM } from './gigDetailVM';

const CLAMP = 160;

export function DetailsTab({ vm }: { vm: GigDetailVM }) {
  const [expanded, setExpanded] = useState(false);
  const long = vm.about.length > CLAMP;
  const aboutText = !long || expanded ? vm.about : vm.about.slice(0, CLAMP).trimEnd() + '…';

  return (
    <View style={s.pad}>
      <GigFactStrip facts={vm.facts} />

      {!!vm.about && (
        <>
          <SectionTitle>About this gig</SectionTitle>
          <Text style={s.body}>
            {aboutText}
            {long && !expanded ? (
              <Text style={s.readmore} onPress={() => setExpanded(true)}>
                {'  '}Read more
              </Text>
            ) : null}
          </Text>
        </>
      )}

      {vm.responsibilities.length > 0 && (
        <>
          <SectionTitle accent="main">What you'll do</SectionTitle>
          {vm.responsibilities.map((r, i) => (
            <Bullet key={i}>{r}</Bullet>
          ))}
        </>
      )}

      {(vm.lookingFor.length > 0 || vm.requiredSkills.length > 0) && (
        <>
          <SectionTitle accent="main">Who we're looking for</SectionTitle>
          {vm.lookingFor.length > 0 && (
            <View style={{ marginTop: 2 }}>
              {vm.lookingFor.map((r, i) => (
                <KVRow key={r.k} k={r.k} v={r.v} sub={r.sub} last={i === vm.lookingFor.length - 1} />
              ))}
            </View>
          )}
          {vm.requiredSkills.length > 0 && (
            <View style={s.wrapChips}>
              {vm.requiredSkills.map((sk, i) => (
                <Chip key={`${sk}-${i}`}>{sk}</Chip>
              ))}
            </View>
          )}
        </>
      )}

      {/* Compensation — modest line only (no take-home / fee / secure) */}
      <SectionTitle accent="main">Compensation</SectionTitle>
      <View style={s.compLine}>
        <Text style={s.compAmt}>{vm.pay.amount}</Text>
        {!vm.pay.tbd && (
          <Text style={s.compPer}>
            {vm.pay.unit}
            {vm.pay.negotiable ? ' · negotiable' : ''}
          </Text>
        )}
      </View>

      {vm.perks.length > 0 && (
        <>
          <SectionTitle accent="quiet">Perks &amp; inclusions</SectionTitle>
          <View style={s.wrapChips}>
            {vm.perks.map((p, i) => (
              <Tag key={`${p}-${i}`} icon={<Check size={13} color={C.orange} />}>
                {p}
              </Tag>
            ))}
          </View>
        </>
      )}

      {!!vm.terms && (
        <>
          <SectionTitle accent="quiet">Terms</SectionTitle>
          <Text style={[s.body, { fontSize: 13 }]}>{vm.terms}</Text>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  pad: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  body: { fontFamily: F.reg, fontSize: 14, lineHeight: 23, color: C.t3 },
  readmore: { fontFamily: F.semi, color: C.orange },
  wrapChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  compLine: { flexDirection: 'row', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' },
  compAmt: { fontFamily: F.bold, fontSize: 22, color: C.t1, letterSpacing: -0.4 },
  compPer: { fontFamily: F.reg, fontSize: 12.5, color: C.t4 },
});
