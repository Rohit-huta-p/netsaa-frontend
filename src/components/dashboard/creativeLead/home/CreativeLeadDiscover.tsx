// src/components/dashboard/creativeLead/home/CreativeLeadDiscover.tsx
//
// Section 4 — Discover. Two faces over a horizontal peek rail (card 1 fills,
// card 2 peeks ~20% to signal swipe), mirroring ArtistDiscover's grammar:
//   Client briefs → open client requirements the CL can pitch on (LIVE, the
//                   apply-up face) — requirementService.feed (GET /requirements)
//   Talent        → artist discovery / invite (P2 — no backend hook yet, so a
//                   tasteful "coming soon" peek)
// Design: DOCS/04-design/mockups/creative-lead-home-v2.html discover() (~L278-292).

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react-native';
import { requirementService } from '@/services/requirementService';
import { HC, HF, SectionTitle, SegTabs, fmtRupees, fmtShortDate } from '@/components/dashboard/artist/home/ui';

type Tab = 'briefs' | 'talent';

const SCREEN_W = Dimensions.get('window').width;
const GUTTER = 20;
const GAP = 12;
const CARD_W = Math.min(300, Math.round((SCREEN_W - GUTTER - GAP) / 1.2));
const MAX = 4;

const briefTitle = (r: any): string => r?.occasionText || r?.title || 'Client brief';
const briefMeta = (r: any): string =>
  [r?.clientSnapshot?.displayName, r?.city || r?.clientSnapshot?.city].filter(Boolean).join(' · ').toUpperCase();
const briefBudget = (r: any): string => {
  const b = r?.budgetMax ?? r?.budgetMin ?? null;
  return b ? fmtRupees(b) : 'Budget open';
};

export default function CreativeLeadDiscover() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('briefs');

  // Public feed of open client requirements — no existing hook, so query directly.
  const briefsQ = useQuery({
    queryKey: ['creativeLead', 'briefs'],
    queryFn: () => requirementService.feed({ pageSize: 8 }),
    staleTime: 60_000,
  });
  const briefs = useMemo(() => (briefsQ.data?.requirements ?? []).slice(0, MAX), [briefsQ.data]);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <SectionTitle hint="swipe →">Discover</SectionTitle>
        <SegTabs
          value={tab}
          onChange={setTab}
          options={[
            { key: 'briefs', label: 'Client briefs' },
            { key: 'talent', label: 'Talent' },
          ]}
        />
      </View>

      {tab === 'talent' ? (
        <View style={styles.head}>
          <View style={styles.soonCard}>
            <Text style={styles.soonTitle}>Talent, coming soon</Text>
            <Text style={styles.soonSub}>Discover and invite artists to your gigs — we’re building it.</Text>
          </View>
        </View>
      ) : briefsQ.isLoading ? (
        <View style={styles.railPad}>
          <View style={[styles.card, { width: CARD_W, opacity: 0.4 }]} />
        </View>
      ) : briefs.length === 0 ? (
        <View style={styles.head}>
          <Pressable onPress={() => router.push('/requirements' as any)} style={styles.emptyCard}>
            <Text style={styles.emptyTxt}>No open client briefs right now.</Text>
            <View style={styles.viewRow}>
              <Text style={styles.emptyCta}>BROWSE BRIEFS</Text>
              <ArrowRight size={11} color={HC.orange} />
            </View>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.railPad}
          snapToInterval={CARD_W + GAP}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {briefs.map((r: any) => (
            <Pressable
              key={r._id}
              onPress={() => router.push(`/(app)/requirements/${r._id}` as any)}
              style={[styles.card, { width: CARD_W }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.kindChip}>
                  <Text style={styles.kindTxt}>BRIEF</Text>
                </View>
                {r?.eventDate ? <Text style={styles.cardDate}>{fmtShortDate(r.eventDate)}</Text> : null}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{briefTitle(r)}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>{briefMeta(r)}</Text>
              <View style={styles.cardFoot}>
                <Text style={styles.pay}>{briefBudget(r)}</Text>
                <View style={styles.viewRow}>
                  <Text style={styles.viewTxt}>PITCH</Text>
                  <ArrowRight size={11} color={HC.orange} />
                </View>
              </View>
            </Pressable>
          ))}

          <Pressable onPress={() => router.push('/requirements' as any)} style={styles.seeTile}>
            <View style={styles.seeIcon}>
              <ArrowRight size={15} color={HC.orange} />
            </View>
            <Text style={styles.seeTxt}>SEE ALL{'\n'}BRIEFS</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 8 },
  head: { paddingHorizontal: GUTTER },
  railPad: { paddingHorizontal: GUTTER, paddingVertical: 2, gap: GAP },

  card: {
    backgroundColor: HC.card,
    borderWidth: 1,
    borderColor: HC.hair,
    borderRadius: 16,
    padding: 15,
    minHeight: 156,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  // 'brief' is blue across the CL home (matches the Pitching thumb).
  kindChip: { borderWidth: 1, borderColor: 'rgba(59,130,246,0.30)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  kindTxt: { fontFamily: HF.mono, fontSize: 8, letterSpacing: 1.4, color: HC.blue },
  cardDate: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 0.5, color: HC.t3 },
  cardTitle: { fontFamily: HF.serif, fontSize: 19, lineHeight: 21, letterSpacing: -0.3, color: HC.cream },
  cardMeta: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 0.5, color: HC.t2, marginTop: 7 },
  cardFoot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 14 },
  pay: { fontFamily: HF.serif, fontSize: 17, color: HC.cream },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewTxt: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 1, color: HC.orange },

  seeTile: {
    width: 118,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: HC.hair,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  seeIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: HC.hair, alignItems: 'center', justifyContent: 'center' },
  seeTxt: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 1.3, color: HC.t1, textAlign: 'center', lineHeight: 14 },

  emptyCard: { backgroundColor: HC.card, borderWidth: 1, borderColor: HC.hair, borderRadius: 16, padding: 20, alignItems: 'center', gap: 10 },
  emptyTxt: { fontFamily: HF.body, fontSize: 13, color: HC.t2 },
  emptyCta: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1.3, color: HC.orange },

  soonCard: { backgroundColor: HC.card, borderWidth: 1, borderStyle: 'dashed', borderColor: HC.hair, borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  soonTitle: { fontFamily: HF.serif, fontSize: 17, color: HC.t1 },
  soonSub: { fontFamily: HF.body, fontSize: 12, color: HC.t2, textAlign: 'center', lineHeight: 17 },
});
