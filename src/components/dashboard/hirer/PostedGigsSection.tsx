/**
 * PostedGigsSection — 3 status chips + up to 5 gig rows with applicant counts.
 * Spec §5.1 #3. Tapping a row routes to the hirer-mode gig detail (existing
 * /(app)/gigs/[id] route, hirer mode shows Applications tab inline).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../SectionCard';
import { usePostedGigs } from '@/hooks/usePostedGigs';
import { POSTED_GIGS_FILTERS, type PostedGigFilter } from '@/constants/postedGigsStatus';

interface GigRow {
  _id?: string;
  id?: string;
  title?: string;
  status?: string;
  stats?: { applicationsCount?: number; viewsCount?: number };
  createdAt?: string;
}

function unwrapGigs(data: any): GigRow[] {
  if (!data) return [];
  if (Array.isArray(data.gigs)) return data.gigs;
  if (Array.isArray(data?.data?.gigs)) return data.data.gigs;
  return [];
}

export default function PostedGigsSection() {
  const [selected, setSelected] = useState<PostedGigFilter>(
    POSTED_GIGS_FILTERS[1] // Default to "Live"
  );
  const router = useRouter();

  const { data, isLoading, error, refetch } = usePostedGigs(selected.backendStatus, 5);
  const gigs = useMemo(() => unwrapGigs(data), [data]);

  return (
    <SectionCard
      title="Your posts"
      seeAllHref="/gigs?mine=1"
      isLoading={isLoading}
      error={error as Error | null}
      onRetry={() => refetch()}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        accessibilityLabel="Filter your posts by status"
      >
        {POSTED_GIGS_FILTERS.map((f) => {
          const active = f.backendStatus === selected.backendStatus;
          return (
            <TouchableOpacity
              key={f.backendStatus}
              onPress={() => setSelected(f)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {gigs.length === 0 ? (
        <View style={styles.emptyInline}>
          <Text style={styles.emptyText}>
            {`No ${selected.label.toLowerCase()} posts`}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {gigs.map((g, idx) => {
            const id = g._id ?? g.id ?? `row-${idx}`;
            const applicants = g.stats?.applicationsCount ?? 0;
            const views = g.stats?.viewsCount ?? 0;
            return (
              <TouchableOpacity
                key={id}
                style={styles.row}
                onPress={() => router.push({ pathname: '/(app)/gigs/[id]', params: { id } })}
                accessibilityRole="button"
                accessibilityLabel={`Open post ${g.title ?? 'Untitled gig'}`}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {g.title ?? 'Untitled gig'}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {`${applicants} applicant${applicants === 1 ? '' : 's'} · ${views} view${views === 1 ? '' : 's'}`}
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
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: '#1F1F23', borderWidth: 1, borderColor: '#26262C',
  },
  chipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' }, // hirer accent (orange)
  chipText: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#A1A1AA' },
  chipTextActive: { color: '#FFFFFF' },
  list: { marginTop: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1F1F23',
  },
  rowMain: { flex: 1, paddingRight: 12 },
  rowTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#F5F5F5' },
  rowMeta: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#71717A', marginTop: 2 },
  emptyInline: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontFamily: 'Outfit-Regular', fontSize: 14, color: '#71717A' },
});
