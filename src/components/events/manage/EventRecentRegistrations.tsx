/**
 * EventRecentRegistrations — last 5 attendees with a link to the Roster tab.
 *
 * Reuses useEventRoster (already used by RosterList). Shows the 5 most
 * recent registrations sorted by registeredAt DESC. Each row: name,
 * city (when available), relative time. "See all →" routes to the
 * Roster tab.
 *
 * Empty state mirrors the editorial dashed-border treatment used by
 * the empty Your posts card.
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEventRoster } from '@/hooks/useEventRoster';

interface RosterRow {
  _id?: string;
  attendeeName?: string;
  attendeeCity?: string;
  city?: string;
  registeredAt?: string;
  createdAt?: string;
}

function timeAgo(iso?: string): string {
  if (!iso) return 'recent';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'recent';
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function EventRecentRegistrations({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { data, isLoading } = useEventRoster(eventId);

  const rows: RosterRow[] = useMemo(() => {
    const all: RosterRow[] = Array.isArray(data?.rows) ? data!.rows : [];
    // Sort by registeredAt / createdAt DESC, then slice.
    return all
      .slice()
      .sort((a, b) => {
        const ta = a.registeredAt ?? a.createdAt ?? '';
        const tb = b.registeredAt ?? b.createdAt ?? '';
        return ta < tb ? 1 : ta > tb ? -1 : 0;
      })
      .slice(0, 5);
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.headRow}>
        <Text style={styles.h3}>Recent registrations</Text>
        <Pressable
          onPress={() => router.push(`/(app)/events/${eventId}/manage/roster` as any)}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.link}>See all →</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#FF6B35" />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No registrations yet</Text>
          <Text style={styles.emptyBody}>
            Share the event link to get the first RSVP. New registrations
            show up here as they arrive.
          </Text>
        </View>
      ) : (
        rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          const name = row.attendeeName ?? 'Guest';
          const city = row.attendeeCity ?? row.city;
          return (
            <View
              key={row._id ?? i}
              style={[styles.row, isLast && styles.rowLast]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name[0]?.toUpperCase() ?? '·'}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
                {city ? <Text style={styles.rowCity}>{city}</Text> : null}
              </View>
              <Text style={styles.rowTime}>{timeAgo(row.registeredAt ?? row.createdAt)}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 4,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  h3: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    letterSpacing: -0.5,
    color: '#F3EFE8',
  },
  link: { color: '#FF6B35', fontFamily: 'Outfit-Bold', fontSize: 12 },

  loading: { paddingVertical: 24, alignItems: 'center' },

  empty: {
    backgroundColor: 'rgba(255,255,255,0.015)',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  emptyTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: '#F3EFE8',
    marginBottom: 4,
  },
  emptyBody: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#B8B1A6',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243,239,232,0.05)',
  },
  rowLast: { borderBottomWidth: 0 },
  avatar: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#FF6B35',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: '#F3EFE8',
  },
  rowCity: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: '#6B6878',
    marginTop: 1,
  },
  rowTime: {
    fontFamily: 'SpaceMono-Regular',
    fontSize: 10,
    color: '#6B6878',
  },
});
