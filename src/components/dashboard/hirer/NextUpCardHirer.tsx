/**
 * NextUpCardHirer — conditional: renders the next decision the hirer needs
 * to make. Priority order:
 *   1. Oldest contract with status 'pending_artist_signature' OR
 *      'pending_hirer_action' (if payment-service exposes such a state)
 *   2. Oldest unreviewed applicant (status 'applied') across user's gigs
 *   3. null
 *
 * Both datasources are already cached by the other hirer sections — this
 * component piggybacks on those caches via useContractsHirer +
 * useApplicantsInbox. No incremental network cost.
 *
 * CACHE DEDUPE
 * ------------
 * This hook MUST call `useApplicantsInbox('applied', 5)` with the same
 * limit ApplicantsInbox uses. The React Query key for both is
 * `queryKeys.hirer.applicants('applied')` — it does NOT encode `limit`.
 * So calling with a different limit (e.g., 1) would clobber the shared
 * cache with the shorter array and leave ApplicantsInbox showing a single
 * row. Keep the limits aligned. We read `apps[0]` from the shared array.
 * (Bug caught during plan-eng-review on 2026-04-23.)
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import useContractsHirer from '@/hooks/useContractsHirer';
import { useApplicantsInbox } from '@/hooks/useApplicantsInbox';

function unwrapApplicants(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data.applicants)) return data.applicants;
  if (Array.isArray(data?.data?.applicants)) return data.data.applicants;
  return [];
}

export default function NextUpCardHirer() {
  const router = useRouter();
  const { data: contracts } = useContractsHirer();
  // Share the same cache key + limit as ApplicantsInbox so React Query
  // dedupes to ONE network call. Read only the first row here.
  const { data: appData } = useApplicantsInbox('applied', 5);

  const next = useMemo(() => {
    const contractAwaiting = Array.isArray(contracts)
      ? contracts.find(
          (c: any) =>
            c?.status === 'pending_artist_signature' ||
            c?.status === 'pending_hirer_action'
        )
      : undefined;
    if (contractAwaiting) {
      return {
        kind: 'contract' as const,
        title: 'Contract awaiting signature',
        subtitle: contractAwaiting.gigTitle ?? 'Review & send reminder',
        href: `/contracts/${contractAwaiting._id ?? ''}`,
      };
    }

    const apps = unwrapApplicants(appData);
    const oldest = apps[0];
    if (oldest) {
      return {
        kind: 'applicant' as const,
        title: 'New applicant to review',
        subtitle: `${oldest.artistSnapshot?.displayName ?? 'Someone'} → ${oldest.gigTitle ?? 'your gig'}`,
        href: `/(app)/gigs/${oldest.gigId}?tab=applicants`,
      };
    }
    return null;
  }, [contracts, appData]);

  if (!next) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(next.href as any)}
      accessibilityRole="button"
      accessibilityLabel={`${next.title}. ${next.subtitle}`}
    >
      <View style={styles.body}>
        <Text style={styles.kicker}>NEXT UP</Text>
        <Text style={styles.title}>{next.title}</Text>
        <Text style={styles.sub} numberOfLines={2}>{next.subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#A1A1AA" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1F0F12', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#FF6B35',
    marginHorizontal: 16, marginVertical: 8,
  },
  body: { flex: 1 },
  kicker: { fontFamily: 'Outfit-SemiBold', fontSize: 10, letterSpacing: 1.2, color: '#FF6B35', marginBottom: 4 },
  title: { fontFamily: 'Outfit-SemiBold', fontSize: 16, color: '#F5F5F5' },
  sub: { marginTop: 4, fontFamily: 'Outfit-Regular', fontSize: 13, color: '#A1A1AA' },
});
