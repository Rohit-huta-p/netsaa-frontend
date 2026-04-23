// netsa-mobile/src/components/dashboard/artist/NextUpCard.tsx
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FileSignature, Calendar, ChevronRight } from 'lucide-react-native';
import useContractsArtist from '@/hooks/useContractsArtist';
import useApplications from '@/hooks/useApplications';

/**
 * NextUpCard — high-priority "do this next" card on the artist home.
 *
 * Priority (first match wins, per spec Task 13):
 *   1. A contract in state `pending_artist_signature` → "Sign contract" CTA
 *   2. The soonest hired application whose gig start date is in the future
 *      → "Upcoming: {gigTitle}" with big day-of-month chip + days-until
 *   3. Otherwise render null (section hides entirely — no loading chrome
 *      either, since this is an optional above-the-fold surface)
 *
 * The component is read-only; tap navigates into the existing contract
 * detail or gig detail screens. Both queries are already deduped via
 * queryKeys so mounting this alongside UpcomingSection doesn't double-fetch.
 */

interface ContractRow {
  _id?: string;
  id?: string;
  status?: string;
  terms?: {
    gigTitle?: string;
  };
  hirerName?: string;
  hirer?: { name?: string; displayName?: string };
}

interface HiredApplicationRow {
  _id?: string;
  id?: string;
  status?: string;
  gigId?: any;
  gig?: {
    _id?: string;
    title?: string;
    startDate?: string;
    schedule?: { startDate?: string };
  };
  gigTitle?: string;
}

function unwrapContracts(resp: any): ContractRow[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  // Payment service envelope: { data: { contracts: [...] } }
  if (Array.isArray(resp?.data?.contracts)) return resp.data.contracts;
  if (Array.isArray(resp?.contracts)) return resp.contracts;
  if (Array.isArray(resp?.data)) return resp.data;
  return [];
}

function unwrapApplications(resp: any): HiredApplicationRow[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  return [];
}

function gigStartDate(app: HiredApplicationRow): string | null {
  const gig =
    (app?.gigId && typeof app.gigId === 'object' ? app.gigId : null) ||
    app?.gig ||
    null;
  return gig?.schedule?.startDate || gig?.startDate || null;
}

function gigTitle(app: HiredApplicationRow): string {
  const gig =
    (app?.gigId && typeof app.gigId === 'object' ? app.gigId : null) ||
    app?.gig ||
    null;
  return gig?.title || app?.gigTitle || 'Upcoming gig';
}

function gigId(app: HiredApplicationRow): string | null {
  const gig =
    (app?.gigId && typeof app.gigId === 'object' ? app.gigId : null) ||
    app?.gig ||
    null;
  const id = gig?._id || (typeof app?.gigId === 'string' ? app.gigId : null);
  return id ? String(id) : null;
}

type Selection =
  | { kind: 'contract'; contractId: string; gigTitle: string; hirerName?: string }
  | {
      kind: 'gig';
      gigId: string;
      title: string;
      startDate: Date;
      dayOfMonth: number;
      daysUntil: number;
    }
  | null;

export default function NextUpCard() {
  const router = useRouter();
  const { data: contractsResp } = useContractsArtist();
  const { data: applicationsResp } = useApplications('hired');

  const selection = useMemo<Selection>(() => {
    // 1. Contracts awaiting signature
    const contracts = unwrapContracts(contractsResp);
    const pending = contracts.find(
      (c) => c?.status === 'pending_artist_signature'
    );
    if (pending) {
      const id = pending._id ?? pending.id;
      if (id) {
        return {
          kind: 'contract',
          contractId: String(id),
          gigTitle: pending.terms?.gigTitle ?? 'Untitled gig',
          hirerName:
            pending.hirer?.displayName ??
            pending.hirer?.name ??
            pending.hirerName,
        };
      }
    }

    // 2. Soonest upcoming hired gig
    const apps = unwrapApplications(applicationsResp);
    const now = Date.now();
    const upcoming = apps
      .filter((a) => (a?.status ?? 'hired') === 'hired')
      .map((a) => {
        const raw = gigStartDate(a);
        if (!raw) return null;
        const t = new Date(raw).getTime();
        if (Number.isNaN(t) || t <= now) return null;
        return { app: a, start: new Date(raw) };
      })
      .filter((x): x is { app: HiredApplicationRow; start: Date } => x !== null)
      .sort((x, y) => x.start.getTime() - y.start.getTime());

    if (upcoming.length > 0) {
      const { app, start } = upcoming[0];
      const id = gigId(app);
      if (id) {
        const daysUntil = Math.max(
          0,
          Math.ceil((start.getTime() - now) / (1000 * 60 * 60 * 24))
        );
        return {
          kind: 'gig',
          gigId: id,
          title: gigTitle(app),
          startDate: start,
          dayOfMonth: start.getDate(),
          daysUntil,
        };
      }
    }

    return null;
  }, [contractsResp, applicationsResp]);

  if (!selection) return null;

  if (selection.kind === 'contract') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Next up: sign contract for ${selection.gigTitle}`}
        onPress={() => router.push(`/contracts/${selection.contractId}` as any)}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerLabel}>Next up</Text>
          <ChevronRight size={16} color="#71717A" />
        </View>
        <View style={styles.contractBody}>
          <View style={styles.contractIconWrap}>
            <FileSignature size={22} color="#F97316" strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Sign contract</Text>
            <Text style={styles.ctaSubtitle} numberOfLines={1}>
              {selection.gigTitle}
              {selection.hirerName ? ` · ${selection.hirerName}` : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Next up: ${selection.title}, in ${selection.daysUntil} days`}
      onPress={() => router.push(`/gigs/${selection.gigId}` as any)}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>Next up</Text>
        <ChevronRight size={16} color="#71717A" />
      </View>
      <View style={styles.gigBody}>
        <View style={styles.dateChip}>
          <Text style={styles.dateDay} allowFontScaling={false}>
            {selection.dayOfMonth}
          </Text>
          <Text style={styles.dateMonth}>
            {selection.startDate.toLocaleDateString(undefined, { month: 'short' })}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaTitle} numberOfLines={1}>
            {`Upcoming: ${selection.title}`}
          </Text>
          <View style={styles.daysRow}>
            <Calendar size={12} color="#A1A1AA" />
            <Text style={styles.daysUntilText}>
              {selection.daysUntil === 0
                ? 'Today'
                : selection.daysUntil === 1
                  ? 'Tomorrow'
                  : `${selection.daysUntil} days`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    letterSpacing: 1,
    color: '#8B5CF6',
    textTransform: 'uppercase',
  },
  contractBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 14,
  },
  contractIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gigBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 14,
  },
  dateChip: {
    width: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  dateDay: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 44,
    lineHeight: 52,
    color: '#F5F5F5',
  },
  dateMonth: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#A1A1AA',
    textTransform: 'uppercase',
  },
  ctaTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 18,
    color: '#F5F5F5',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#A1A1AA',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  daysUntilText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: '#A1A1AA',
  },
});
