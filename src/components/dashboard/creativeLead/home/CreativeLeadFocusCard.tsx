// src/components/dashboard/creativeLead/home/CreativeLeadFocusCard.tsx
//
// Section 2 — "NEEDS YOU FIRST". One urgent nudge:
//   • Active  → "N applicants waiting · across K open gigs" → ghost Review CTA
//               (ghost so the create action stays the primary emphasis).
//   • Clear   → "Nothing needs you yet" → solid Post a gig + Post an event.
// Shares the useOrganizerPosts('active') + useApplicantsInbox('applied') caches
// with CreativeLeadWork (React Query dedupes).

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useOrganizerPosts } from '@/hooks/useOrganizerPosts';
import { useApplicantsInbox } from '@/hooks/useApplicantsInbox';
import { HC, HF } from '@/components/dashboard/artist/home/ui';

function unwrapApplicants(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data.applicants)) return data.applicants;
  if (Array.isArray(data?.data?.applicants)) return data.data.applicants;
  return [];
}

export default function CreativeLeadFocusCard() {
  const router = useRouter();
  const active = useOrganizerPosts('active', 50);
  const { data: appData } = useApplicantsInbox('applied', 5);

  const { totalApplicants, openGigs, oldest } = useMemo(() => {
    const liveGigs = (active.allItems ?? []).filter((p) => p.kind === 'gig');
    const total = liveGigs.reduce((a, g) => a + (g.applicants ?? 0), 0);
    const open = liveGigs.filter((g) => (g.applicants ?? 0) > 0).length;
    const apps = unwrapApplicants(appData);
    return { totalApplicants: total, openGigs: open, oldest: apps[0] };
  }, [active.allItems, appData]);

  const create = (tab: 'gig' | 'event') =>
    router.push(`/(app)/create?initialTab=${tab}` as any);

  if (totalApplicants > 0) {
    const reviewHref = oldest?.gigId
      ? `/(app)/gigs/${oldest.gigId}?tab=applicants`
      : '/posts';
    return (
      <View style={[styles.card, styles.cardActive]}>
        <View style={styles.kickRow}>
          <View style={styles.dot} />
          <Text style={styles.kicker}>NEEDS YOU FIRST</Text>
        </View>
        <Text style={styles.title}>
          {totalApplicants} applicant{totalApplicants === 1 ? '' : 's'} waiting
        </Text>
        <Text style={styles.sub}>
          Across {openGigs} open {openGigs === 1 ? 'gig' : 'gigs'}
        </Text>
        <Pressable
          style={styles.ghostBtn}
          onPress={() => router.push(reviewHref as any)}
          accessibilityRole="button"
          accessibilityLabel="Review applicants"
        >
          <Text style={styles.ghostTxt}>Review applicants</Text>
          <ArrowRight size={15} color={HC.orange} />
        </Pressable>
      </View>
    );
  }

  // All-clear / new CL — surface both create CTAs.
  return (
    <View style={[styles.card, styles.cardClear]}>
      <View style={styles.kickRow}>
        <View style={[styles.dot, { backgroundColor: HC.t3 }]} />
        <Text style={[styles.kicker, { color: HC.t3 }]}>ALL CLEAR</Text>
      </View>
      <Text style={styles.titleClear}>Nothing needs you yet</Text>
      <Text style={styles.sub}>Post a gig or an event to get started.</Text>
      <View style={styles.ctaRow}>
        <Pressable style={styles.solidBtn} onPress={() => create('gig')}>
          <Text style={styles.solidTxt}>Post a gig</Text>
        </Pressable>
        <Pressable style={[styles.solidBtn, styles.solidPurple]} onPress={() => create('event')}>
          <Text style={[styles.solidTxt, styles.solidTxtPurple]}>Post an event</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
  },
  cardActive: {
    borderColor: 'rgba(255,107,53,0.28)',
    backgroundColor: 'rgba(255,107,53,0.055)',
  },
  cardClear: {
    borderColor: HC.hair,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  kickRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: HC.orange },
  kicker: { fontFamily: HF.mono, fontSize: 9, letterSpacing: 1.4, color: HC.orange },
  title: { fontFamily: HF.serif, fontSize: 17, letterSpacing: -0.2, color: HC.cream },
  titleClear: { fontFamily: HF.serif, fontSize: 17, letterSpacing: -0.2, color: HC.t1 },
  sub: { fontFamily: HF.body, fontSize: 11.5, color: HC.t2, marginTop: 3 },

  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    marginTop: 11,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.4)',
    backgroundColor: 'transparent',
  },
  ghostTxt: { fontFamily: HF.semi, fontSize: 12, color: HC.orange },

  ctaRow: { flexDirection: 'row', gap: 9, marginTop: 12 },
  solidBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: HC.orange,
  },
  solidPurple: { backgroundColor: HC.purple },
  solidTxt: { fontFamily: HF.bold, fontSize: 12.5, color: '#190B05' },
  solidTxtPurple: { color: '#FFFFFF' },
});
