// src/components/dashboard/creativeLead/home/CreativeLeadCompanyCard.tsx
//
// Section 5 — "Your company page · N%". A completion nudge + trust-tier chip
// (DOCS/04-design/mockups/creative-lead-home-v2.html `.cofoot`). There is no
// company-specific completeness score in the app (computeOverallScore is
// artist-oriented), so we derive % from the real OrganizerProfile fields a CL
// fills to make their company page useful, and name the top missing one as the
// nudge. Hidden at 100% (nothing to nudge) and while the profile is loading.

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useHeroDataHirer from '@/hooks/useHeroDataHirer';
import { HC, HF } from '@/components/dashboard/artist/home/ui';

type Tier = 'new' | 'rising' | 'trusted' | 'verified';
const TIER: Record<Tier, { label: string; fg: string; bg: string }> = {
  new: { label: 'New', fg: HC.t3, bg: 'rgba(255,255,255,0.05)' },
  rising: { label: 'Rising', fg: HC.blue, bg: 'rgba(59,130,246,0.13)' },
  trusted: { label: 'Trusted', fg: HC.green, bg: 'rgba(34,197,94,0.12)' },
  verified: { label: 'Verified', fg: HC.gold, bg: 'rgba(245,158,11,0.12)' },
};

export default function CreativeLeadCompanyCard() {
  const router = useRouter();
  const { user, organizer, isLoading } = useHeroDataHirer();

  const { pct, tip, ready } = useMemo(() => {
    if (!organizer) return { pct: 0, tip: '', ready: false };
    const org: any = organizer;
    const u: any = user;
    // The company-identity fields that make a page worth landing on, ordered by
    // impact — the first unfilled one becomes the nudge.
    const fields = [
      { filled: !!org.logoUrl, tip: 'Add your company logo' },
      { filled: !!org.bio, tip: 'Write a short company bio' },
      { filled: (org.photos?.length ?? 0) > 0, tip: 'Add your showreel so clients can see your work' },
      { filled: (org.services?.length ?? 0) > 0, tip: 'List what you do' },
      { filled: !!org.organizationWebsite, tip: 'Add your website' },
      { filled: !!u?.coverImageUrl, tip: 'Add a cover image' },
      { filled: !!org.yearsInBusiness, tip: 'Add how long you’ve been working' },
      { filled: !!org.teamSize, tip: 'Add your team size' },
    ];
    const filledCount = fields.filter((f) => f.filled).length;
    const firstMissing = fields.find((f) => !f.filled);
    return {
      pct: Math.round((filledCount / fields.length) * 100),
      tip: firstMissing?.tip ?? '',
      ready: true,
    };
  }, [organizer, user]);

  if (isLoading || !ready || pct >= 100) return null;

  const tier = (((user as any)?.trustTier as Tier) in TIER ? ((user as any).trustTier as Tier) : 'new');
  const t = TIER[tier];

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push('/(app)/client/agency-profile' as any)}
      accessibilityRole="button"
      accessibilityLabel={`Your company page, ${pct} percent complete. ${tip}`}
    >
      <View style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>Your company page · {pct}%</Text>
        <View style={[styles.tier, { backgroundColor: t.bg }]}>
          <Text style={[styles.tierTxt, { color: t.fg }]}>{t.label}</Text>
        </View>
      </View>
      <View style={styles.bar}>
        <LinearGradient
          colors={[HC.orange, '#FF9A6B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${Math.max(pct, 4)}%` }]}
        />
      </View>
      <Text style={styles.tip}>
        {tip} <Text style={styles.tipCta}>Complete →</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HC.hair,
    backgroundColor: HC.card,
    padding: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontFamily: HF.serif, fontSize: 16, color: HC.cream },
  tier: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  tierTxt: { fontFamily: HF.mono, fontSize: 8.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  bar: { height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: 13, marginBottom: 9, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  tip: { fontFamily: HF.body, fontSize: 11.5, color: HC.t2, lineHeight: 16 },
  tipCta: { fontFamily: HF.bold, color: HC.orange },
});
