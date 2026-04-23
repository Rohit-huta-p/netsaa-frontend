/**
 * HiredArtistsSection — horizontal avatar strip of hired artists, up to 8.
 * Spec §5.1 #6. Empty state "No hires yet — browse artists" linking to
 * artists browse (once slot 2 is wired; today /artists route may not exist,
 * fallback to /gigs until §5.2 ships the artists browse tab).
 */
import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../SectionCard';
import { useHiredArtists } from '@/hooks/useHiredArtists';

interface Row {
  _id?: string;
  id?: string;
  gigId?: string;
  gigTitle?: string;
  artistSnapshot?: { displayName?: string; profileImageUrl?: string };
  appliedAt?: string;
}

function unwrap(data: any): Row[] {
  if (!data) return [];
  if (Array.isArray(data.applicants)) return data.applicants;
  if (Array.isArray(data?.data?.applicants)) return data.data.applicants;
  return [];
}

export default function HiredArtistsSection() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useHiredArtists(8);
  const rows = useMemo(() => unwrap(data), [data]);

  const isEmpty = !isLoading && !error && rows.length === 0;

  return (
    <SectionCard
      title="Hired artists"
      seeAllHref="/gigs?mine=1&tab=hired"
      isLoading={isLoading}
      isEmpty={isEmpty}
      error={error as Error | null}
      onRetry={() => refetch()}
      emptyState={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No hires yet</Text>
          <Text style={styles.emptySubtitle}>Browse artists and post a gig to start hiring</Text>
        </View>
      }
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {rows.map((r, idx) => {
          const id = r._id ?? r.id ?? `row-${idx}`;
          const name = r.artistSnapshot?.displayName ?? 'Artist';
          const uri = r.artistSnapshot?.profileImageUrl;
          return (
            <TouchableOpacity
              key={id}
              style={styles.card}
              onPress={() =>
                r.gigId ? router.push({ pathname: '/(app)/gigs/[id]', params: { id: r.gigId } }) : undefined
              }
              accessibilityRole="button"
              accessibilityLabel={`${name} hired for ${r.gigTitle ?? 'a gig'}`}
            >
              {uri ? (
                <Image source={{ uri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{(name[0] ?? '?').toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              <Text style={styles.gig} numberOfLines={1}>{r.gigTitle ?? ''}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  scrollRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  card: { width: 90, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1F1F23', marginBottom: 6 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: 'Outfit-SemiBold', fontSize: 18, color: '#A1A1AA' },
  name: { fontFamily: 'Outfit-SemiBold', fontSize: 12, color: '#F5F5F5', textAlign: 'center' },
  gig: { fontFamily: 'Outfit-Regular', fontSize: 11, color: '#71717A', textAlign: 'center', marginTop: 1 },
  emptyBox: { alignItems: 'center', paddingVertical: 16 },
  emptyTitle: { fontFamily: 'Outfit-SemiBold', fontSize: 14, color: '#A1A1AA' },
  emptySubtitle: { marginTop: 6, fontFamily: 'Outfit-Regular', fontSize: 13, color: '#71717A', textAlign: 'center' },
});
