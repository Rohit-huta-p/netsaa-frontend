// src/components/dashboard/artist/home/ArtistDiscover.tsx
//
// Section 2 — Discover. Gigs / Events tabs over a horizontal card rail:
// card 1 full, card 2 peeks ~20% to signal swipe; up to 4 cards + a See-all
// end tile that opens the full list (artist-home-final.html, skin A).
//
// Source: useDiscoverMatches (stub matcher; backend /matches follow-up). Items
// come mixed by `kind` — we split them into the two tabs.

import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import useDiscoverMatches, { DiscoverItemKind } from '@/hooks/useDiscoverMatches';
import { HC, HF, SectionTitle, SegTabs, fmtRupees } from './ui';

type Tab = 'gigs' | 'events';

const SCREEN_W = Dimensions.get('window').width;
const GUTTER = 20;
const GAP = 12;
// Card 1 fills, card 2 peeks ~20%: with peek ≈ 0.2·card, card ≈ (W − gutter − gap)/1.2.
const CARD_W = Math.min(300, Math.round((SCREEN_W - GUTTER - GAP) / 1.2));
const MAX = 4;

const KIND_LABEL: Record<DiscoverItemKind, string> = {
  gig: 'GIG',
  event: 'EVENT',
  workshop: 'WORKSHOP',
  audition: 'AUDITION',
};

export default function ArtistDiscover() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('gigs');
  const { items, isLoading } = useDiscoverMatches();

  const { gigs, events } = useMemo(
    () => ({
      gigs: items.filter((i) => i.kind === 'gig').slice(0, MAX),
      events: items.filter((i) => i.kind !== 'gig').slice(0, MAX),
    }),
    [items],
  );

  const list = tab === 'gigs' ? gigs : events;
  const seeHref = tab === 'gigs' ? '/gigs' : '/events';

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <SectionTitle hint="swipe →">Discover</SectionTitle>
        <SegTabs
          value={tab}
          onChange={setTab}
          options={[
            { key: 'gigs', label: 'Gigs' },
            { key: 'events', label: 'Events' },
          ]}
        />
      </View>

      {isLoading ? (
        <View style={styles.railPad}>
          <View style={[styles.card, { width: CARD_W, opacity: 0.4 }]} />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.head}>
          <Pressable onPress={() => router.push(seeHref as any)} style={styles.emptyCard}>
            <Text style={styles.emptyTxt}>Nothing to discover here yet.</Text>
            <View style={styles.viewRow}>
              <Text style={styles.emptyCta}>BROWSE {tab.toUpperCase()}</Text>
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
          {list.map((it) => {
            const free = it.payRupees == null || it.payRupees <= 0;
            const isEvent = it.kind !== 'gig';
            return (
              <Pressable
                key={it.id}
                onPress={() => router.push((it.href || seeHref) as any)}
                style={[styles.card, { width: CARD_W }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.kindChip, isEvent && styles.kindChipEv]}>
                    <Text style={[styles.kindTxt, isEvent && { color: HC.purple }]}>{KIND_LABEL[it.kind]}</Text>
                  </View>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {it.title}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {it.meta}
                </Text>
                <View style={styles.cardFoot}>
                  <Text style={[styles.pay, free && styles.payFree]}>{free ? 'Free' : fmtRupees(it.payRupees)}</Text>
                  <View style={styles.viewRow}>
                    <Text style={styles.viewTxt}>VIEW</Text>
                    <ArrowRight size={11} color={HC.orange} />
                  </View>
                </View>
              </Pressable>
            );
          })}

          <Pressable onPress={() => router.push(seeHref as any)} style={styles.seeTile}>
            <View style={styles.seeIcon}>
              <ArrowRight size={15} color={HC.orange} />
            </View>
            <Text style={styles.seeTxt}>SEE ALL{'\n'}{tab.toUpperCase()}</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 2 },
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
  cardTop: { flexDirection: 'row', marginBottom: 13 },
  kindChip: { borderWidth: 1, borderColor: HC.hair, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  kindChipEv: { borderColor: 'rgba(139,92,246,0.30)' },
  kindTxt: { fontFamily: HF.mono, fontSize: 8, letterSpacing: 1.4, color: HC.t2 },
  cardTitle: { fontFamily: HF.serif, fontSize: 19, lineHeight: 21, letterSpacing: -0.3, color: HC.cream },
  cardMeta: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 0.5, color: HC.t2, marginTop: 7 },
  cardFoot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 14 },
  pay: { fontFamily: HF.serif, fontSize: 17, color: HC.cream },
  payFree: { fontFamily: HF.mono, fontSize: 11, letterSpacing: 1, color: HC.t2 },
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

  emptyCard: {
    backgroundColor: HC.card,
    borderWidth: 1,
    borderColor: HC.hair,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyTxt: { fontFamily: HF.body, fontSize: 13, color: HC.t2 },
  emptyCta: { fontFamily: HF.mono, fontSize: 10, letterSpacing: 1.3, color: HC.orange },
});
