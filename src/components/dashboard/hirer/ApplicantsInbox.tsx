/**
 * ApplicantsInbox — 3 status chips + up to 5 applicant rows flat across
 * all the current user's gigs. Plan 3, Task 14. Spec §5.1 implicit in
 * Posts details (§5.2). Tapping a row routes to the parent gig's detail
 * page with the applications tab preselected via `?tab=applicants`.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../SectionCard';
import { useApplicantsInbox } from '@/hooks/useApplicantsInbox';
import {
  APPLICANTS_INBOX_FILTERS,
  type ApplicantInboxFilter,
} from '@/constants/applicantsInboxStatus';

interface ApplicantRow {
  _id?: string;
  id?: string;
  gigId?: string;
  gigTitle?: string;
  artistSnapshot?: { displayName?: string; artistType?: string };
  status?: string;
  appliedAt?: string;
}

function unwrap(data: any): ApplicantRow[] {
  if (!data) return [];
  if (Array.isArray(data.applicants)) return data.applicants;
  if (Array.isArray(data?.data?.applicants)) return data.data.applicants;
  return [];
}

function formatDate(raw?: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ApplicantsInbox() {
  const [selected, setSelected] = useState<ApplicantInboxFilter>(
    APPLICANTS_INBOX_FILTERS[0] // Default to "New"
  );
  const router = useRouter();

  const { data, isLoading, error, refetch } = useApplicantsInbox(selected.backendStatus, 5);
  const rows = useMemo(() => unwrap(data), [data]);

  return (
    <SectionCard
      title="Applicants"
      seeAllHref="/gigs?mine=1&tab=applicants"
      isLoading={isLoading}
      error={error as Error | null}
      onRetry={() => refetch()}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {APPLICANTS_INBOX_FILTERS.map((f) => {
          const active = f.backendStatus === selected.backendStatus;
          return (
            <TouchableOpacity
              key={f.backendStatus}
              onPress={() => setSelected(f)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {rows.length === 0 ? (
        <View style={styles.emptyInline}>
          <Text style={styles.emptyText}>{`No ${selected.label.toLowerCase()} applicants`}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((r, idx) => {
            const id = r._id ?? r.id ?? `row-${idx}`;
            const artistName = r.artistSnapshot?.displayName ?? 'Applicant';
            const gigTitle = r.gigTitle ?? 'Untitled gig';
            const date = formatDate(r.appliedAt);
            return (
              <TouchableOpacity
                key={id}
                style={styles.row}
                onPress={() =>
                  r.gigId
                    ? router.push({ pathname: '/(app)/gigs/[id]', params: { id: r.gigId, tab: 'applicants' } })
                    : undefined
                }
                accessibilityRole="button"
                accessibilityLabel={`${artistName} applied to ${gigTitle}`}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{artistName}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {gigTitle}{date ? ` • ${date}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1F1F23',
    borderWidth: 1,
    borderColor: '#26262C',
  },
  chipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  chipText: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#A1A1AA' },
  chipTextActive: { color: '#FFFFFF' },
  list: { marginTop: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F23',
  },
  rowMain: { flex: 1, paddingRight: 12 },
  rowTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#F5F5F5' },
  rowMeta: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#71717A', marginTop: 2 },
  emptyInline: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#71717A' },
});
