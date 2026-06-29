/**
 * RosterList — the O5 roster (organizer mockup): status pill-tabs with count
 * badges (Confirmed / Waitlist / Cancelled) + a name/phone search + the list.
 *
 * The "Roster" nav title comes from the manage tab layout (mockup nav chrome).
 */
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { useEventRoster, type RosterRow } from '@/hooks/useEventRoster';
import RosterRowComponent from './RosterRow';

type Tab = 'confirmed' | 'waitlist' | 'cancelled';

export default function RosterList({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventRoster(eventId);
  const [tab, setTab] = useState<Tab>('confirmed');
  const [q, setQ] = useState('');

  const counts = data?.counts ?? { confirmed: 0, waitlist: 0, cancelled: 0 };
  const rows: RosterRow[] = data?.[tab] ?? [];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(query) ||
        (r.phone ?? '').toLowerCase().includes(query),
    );
  }, [rows, q]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabs}>
        <TabBtn label="Confirmed" n={counts.confirmed} active={tab === 'confirmed'} onPress={() => setTab('confirmed')} />
        <TabBtn label="Waitlist" n={counts.waitlist} active={tab === 'waitlist'} onPress={() => setTab('waitlist')} />
        <TabBtn label="Cancelled" n={counts.cancelled} active={tab === 'cancelled'} onPress={() => setTab('cancelled')} />
      </View>

      <View style={styles.search}>
        <Search size={15} color="#6B6878" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or phone…"
          placeholderTextColor="#52525B"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search roster by name or phone"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r._id}
        renderItem={({ item }) => <RosterRowComponent row={item} />}
        ListEmptyComponent={<EmptyState tab={tab} query={q.trim()} />}
        contentContainerStyle={filtered.length === 0 ? styles.emptyWrap : undefined}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function TabBtn({ label, n, active, onPress }: { label: string; n: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabOn]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${n}`}
    >
      <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
      <Text style={[styles.num, active && styles.numOn]}>{n}</Text>
    </Pressable>
  );
}

function EmptyState({ tab, query }: { tab: Tab; query: string }) {
  const copy =
    query.length > 0
      ? { h: 'No matches', s: `No one in ${tab} matches “${query}”.` }
      : tab === 'confirmed'
      ? { h: 'No registrations yet', s: 'Once artists RSVP, they appear here with name, phone, and seats.' }
      : tab === 'waitlist'
      ? { h: 'No one waiting', s: 'When the event fills, the waitlist forms here in join order.' }
      : { h: 'No cancellations', s: 'Cancelled registrations show here for your records.' };
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyH}>{copy.h}</Text>
      <Text style={styles.emptyS}>{copy.s}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 11,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabOn: { backgroundColor: '#F3EFE8' },
  tabText: { fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: '#6B6878' },
  tabTextOn: { color: '#1A0D06' },
  num: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    minWidth: 18,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 5,
    borderRadius: 99,
    overflow: 'hidden',
    color: '#FF6B35',
    backgroundColor: 'rgba(255,107,53,0.16)',
  },
  numOn: { backgroundColor: '#FF6B35', color: '#1A0D06' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    color: '#F3EFE8',
    fontFamily: 'Outfit-Regular',
    fontSize: 13.5,
    padding: 0,
  },
  emptyWrap: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60 },
  emptyH: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 20, color: '#F3EFE8', marginBottom: 6 },
  emptyS: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#9C99A6', textAlign: 'center', lineHeight: 19 },
});
