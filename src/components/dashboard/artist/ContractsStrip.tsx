// netsa-mobile/src/components/dashboard/artist/ContractsStrip.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useContractsArtist from '@/hooks/useContractsArtist';

/**
 * ContractsStrip — dense three-stat row summarizing the artist's contracts.
 *
 * Counts are computed client-side from whatever `useContractsArtist`
 * returns (the payment-service shape is `data.data.contracts[]`):
 *   • awaiting = contracts in `pending_artist_signature`
 *   • active   = contracts in `signed` / `accepted` / `active` (any of the
 *                "in force" states — we widen this defensively because the
 *                backend enum includes `accepted` pre-signature-complete
 *                and `active` post-kickoff)
 *   • total    = every contract row we know about
 *
 * When `total === 0` the whole card is hidden (the artist has no contract
 * history and shouldn't stare at a three-zero row).
 *
 * Taps deep-link into /contracts?filter=<status>. The contracts list screen
 * already exists and ignores unknown params gracefully.
 */

interface ContractRow {
  _id?: string;
  id?: string;
  status?: string;
}

function unwrapContracts(resp: any): ContractRow[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data?.contracts)) return resp.data.contracts;
  if (Array.isArray(resp?.contracts)) return resp.contracts;
  if (Array.isArray(resp?.data)) return resp.data;
  return [];
}

// Backend Contract status enum (payment-service models/Contract.ts):
//   draft, sent, pending_artist_signature, pending_guardian_cosign,
//   accepted, active, performed, completed, declined, disputed,
//   cancelled, breached.
// "In force" here means the artist-side work is locked in: accepted,
// active, performed, and completed all represent committed agreements.
const ACTIVE_STATUSES = new Set([
  'signed',
  'accepted',
  'active',
  'performed',
  'completed',
]);

const AWAITING_STATUSES = new Set(['pending_artist_signature']);

interface StatBlockProps {
  label: string;
  value: number;
  color: string;
  href: string;
}

function StatBlock({ label, value, color, href }: StatBlockProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.statBlock}
      activeOpacity={0.75}
      onPress={() => router.push(href as any)}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
    >
      <Text style={[styles.statValue, { color }]} allowFontScaling={false}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ContractsStrip() {
  const { data } = useContractsArtist();

  const { awaiting, active, total } = useMemo(() => {
    const contracts = unwrapContracts(data);
    let aw = 0;
    let ac = 0;
    for (const c of contracts) {
      const s = c?.status;
      if (!s) continue;
      if (AWAITING_STATUSES.has(s)) aw += 1;
      if (ACTIVE_STATUSES.has(s)) ac += 1;
    }
    return { awaiting: aw, active: ac, total: contracts.length };
  }, [data]);

  if (total === 0) return null;

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel="Contracts summary"
    >
      <Text style={styles.title}>Contracts</Text>
      <View style={styles.statsRow}>
        <StatBlock
          label={'Awaiting\nsignature'}
          value={awaiting}
          color={awaiting > 0 ? '#F97316' : '#A1A1AA'}
          href="/contracts?filter=pending_artist_signature"
        />
        <View style={styles.divider} />
        <StatBlock
          label={'Active'}
          value={active}
          color={active > 0 ? '#22C55E' : '#A1A1AA'}
          href="/contracts?filter=active"
        />
        <View style={styles.divider} />
        <StatBlock
          label={'Total'}
          value={total}
          color="#F5F5F5"
          href="/contracts"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F0F12',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1F1F23',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 18,
    color: '#F5F5F5',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  statValue: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 36,
    lineHeight: 42,
  },
  statLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    lineHeight: 14,
    color: '#A1A1AA',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#1F1F23',
    marginVertical: 4,
  },
});
