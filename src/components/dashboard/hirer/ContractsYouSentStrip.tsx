/**
 * ContractsYouSentStrip — 3-stat strip. Hidden when total=0.
 *
 * Awaiting signature:  status in ['pending_artist_signature']
 * Active:              status in ['active', 'signed']
 * Total:               length of filtered result
 *
 * (Status enum values match payment-service Contract.ts. Verify during
 * Task 5 integration test — fall back to a conservative match if the
 * enum values differ.)
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../SectionCard';
import useContractsHirer from '@/hooks/useContractsHirer';

interface ContractRow { status?: string }

export default function ContractsYouSentStrip() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useContractsHirer();

  const counts = useMemo(() => {
    const rows: ContractRow[] = Array.isArray(data) ? data : [];
    const awaiting = rows.filter((c) => c.status === 'pending_artist_signature').length;
    const active = rows.filter((c) => c.status === 'active' || c.status === 'signed').length;
    return { awaiting, active, total: rows.length };
  }, [data]);

  // Hide when no contracts — same pattern as artist ContractsStrip.
  if (!isLoading && !error && counts.total === 0) return null;

  return (
    <SectionCard
      title="Contracts you sent"
      seeAllHref="/contracts?as=hirer"
      isLoading={isLoading}
      error={error as Error | null}
      onRetry={() => refetch()}
    >
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.stat}
          onPress={() => router.push('/contracts?as=hirer&filter=pending_artist_signature' as any)}
          accessibilityRole="button"
          accessibilityLabel={`${counts.awaiting} contracts awaiting artist signature`}
        >
          <Text style={styles.statValue}>{counts.awaiting}</Text>
          <Text style={styles.statLabel}>Awaiting</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.stat}
          onPress={() => router.push('/contracts?as=hirer&filter=active' as any)}
          accessibilityRole="button"
          accessibilityLabel={`${counts.active} active contracts`}
        >
          <Text style={styles.statValue}>{counts.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.stat}
          onPress={() => router.push('/contracts?as=hirer' as any)}
          accessibilityRole="button"
          accessibilityLabel={`${counts.total} total contracts`}
        >
          <Text style={styles.statValue}>{counts.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </TouchableOpacity>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 8 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontFamily: 'Outfit-SemiBold', fontSize: 24, color: '#F5F5F5' },
  statLabel: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#A1A1AA', marginTop: 4 },
  divider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: '#1F1F23' },
});
