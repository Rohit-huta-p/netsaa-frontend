// app/(app)/search/index.tsx
//
// The full search surface (A·Minimal — DOCS/04-design/mockups/search-aminimal.html).
// Owns the input, the idle zero-state, live results as you type, and the
// sectioned / scoped results. One UI (the top-bar magnifier just routes here).
//
// Driven by a controlled, debounced query:
//   • idle   (< 2 chars) → IdleState (recent · browse · cities · PYMK)
//   • active (≥ 2 chars) → ScopeTabs + body { skeleton | error | empty | data }
//       - All    → top-3 per type under a SectionHeader + "See all"
//       - scoped → the full list for that type
// Counts come from each type's meta.total (fixes the old always-"00" counts);
// the three typed hooks are the single data path (fixes the two-UI split).

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AppScrollView from '@/components/AppScrollView';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSearchPeople, useSearchGigs, useSearchEvents } from '@/hooks/useSearchQueries';
import connectionService from '@/services/connectionService';

import { C } from '@/components/search/board/theme';
import { SearchField } from '@/components/search/board/SearchField';
import { ScopeTabs, Scope } from '@/components/search/board/ScopeTabs';
import { SectionHeader } from '@/components/search/board/SectionHeader';
import { PersonRow, GigRow, EventRow, ConnectionStatus } from '@/components/search/board/ResultRows';
import { IdleState } from '@/components/search/board/IdleState';
import { SearchSkeleton } from '@/components/search/board/SearchSkeleton';
import { EmptyState } from '@/components/search/board/EmptyState';
import { ErrorState } from '@/components/search/board/ErrorState';
import { Flourish } from '@/components/search/board/Flourish';
import { getRecent, addRecent, removeRecent, clearRecent } from '@/components/search/board/RecentSearches';

const PREVIEW_COUNT = 3;

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();

  const [query, setQuery] = useState((params.q as string) || '');
  const [scope, setScope] = useState<Scope>('All');
  const [recent, setRecent] = useState<string[]>([]);

  const dq = useDebouncedValue(query.trim(), 250);
  const active = dq.length >= 2;

  // ─── recent searches (AsyncStorage) ──────────────────────────────────────
  useEffect(() => {
    getRecent().then(setRecent);
  }, []);

  const remember = (q: string) => addRecent(q).then(setRecent);

  // ─── connection status for People rows ───────────────────────────────────
  const [sent, setSent] = useState<string[]>([]);
  const [connected, setConnected] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const [s, c] = await Promise.all([
          connectionService.getSentConnectionRequests(),
          connectionService.getConnections(),
        ]);
        setSent(s.map((r: any) => r.recipientId?._id || r.recipientId).filter(Boolean));
        setConnected(
          c.flatMap((x: any) => [x.requesterId?._id, x.recipientId?._id].filter(Boolean)),
        );
      } catch {
        /* status is best-effort — rows just default to "none" */
      }
    })();
  }, []);
  const statusOf = (id: string): ConnectionStatus =>
    connected.includes(id) ? 'connected' : sent.includes(id) ? 'pending' : 'none';

  // ─── data (three typed hooks; gated ≥2 chars via `enabled` in the hooks) ──
  const peopleQ = useSearchPeople(dq);
  const gigsQ = useSearchGigs(dq);
  const eventsQ = useSearchEvents(dq);

  const people = peopleQ.data?.results ?? [];
  const gigs = gigsQ.data?.results ?? [];
  const events = eventsQ.data?.results ?? [];

  const peopleTotal = peopleQ.data?.meta?.total ?? (peopleQ.data ? people.length : undefined);
  const gigsTotal = gigsQ.data?.meta?.total ?? (gigsQ.data ? gigs.length : undefined);
  const eventsTotal = eventsQ.data?.meta?.total ?? (eventsQ.data ? events.length : undefined);

  const counts = useMemo(() => {
    const sum = [peopleTotal, gigsTotal, eventsTotal].filter((n): n is number => typeof n === 'number');
    return {
      All: sum.length ? sum.reduce((a, b) => a + b, 0) : undefined,
      People: peopleTotal,
      Gigs: gigsTotal,
      Events: eventsTotal,
    };
  }, [peopleTotal, gigsTotal, eventsTotal]);

  const anyResults = people.length + gigs.length + events.length > 0;
  const loading =
    (peopleQ.isLoading || gigsQ.isLoading || eventsQ.isLoading) && !anyResults;
  const errored =
    peopleQ.isError && gigsQ.isError && eventsQ.isError && !anyResults;
  const empty = !loading && !errored && peopleQ.data && gigsQ.data && eventsQ.data && !anyResults;

  const retry = () => {
    peopleQ.refetch();
    gigsQ.refetch();
    eventsQ.refetch();
  };

  // ─── navigation helpers ───────────────────────────────────────────────────
  const openProfile = (id: string) => router.push(`/(app)/profile/${id}` as any);
  const openGig = (id: string) => router.push(`/(app)/gigs/${id}` as any);
  const openEvent = (id: string) => router.push(`/(app)/events/${id}` as any);

  const runQuery = (q: string) => {
    setQuery(q);
    setScope('All');
    remember(q);
  };

  // ─── body ─────────────────────────────────────────────────────────────────
  const renderActiveBody = () => {
    if (loading) return <SearchSkeleton />;
    if (errored) return <ErrorState onRetry={retry} />;
    if (empty) return <EmptyState query={dq} onCraft={runQuery} onCity={runQuery} />;

    if (scope === 'All') {
      const sections: React.ReactNode[] = [];
      if (people.length > 0)
        sections.push(
          <View key="people">
            <SectionHeader
              title="People"
              entries={peopleTotal}
              onSeeAll={() => setScope('People')}
              first={sections.length === 0}
            />
            {people.slice(0, PREVIEW_COUNT).map((p: any) => (
              <PersonRow
                key={p._id || p.id}
                item={p}
                status={statusOf(p._id || p.id)}
                onPress={() => openProfile(p._id || p.id)}
              />
            ))}
          </View>,
        );
      if (gigs.length > 0)
        sections.push(
          <View key="gigs">
            <SectionHeader
              title="Gigs"
              entries={gigsTotal}
              onSeeAll={() => setScope('Gigs')}
              first={sections.length === 0}
            />
            {gigs.slice(0, PREVIEW_COUNT).map((g: any) => (
              <GigRow key={g._id || g.id} item={g} onPress={() => openGig(g._id || g.id)} />
            ))}
          </View>,
        );
      if (events.length > 0)
        sections.push(
          <View key="events">
            <SectionHeader
              title="Events"
              entries={eventsTotal}
              onSeeAll={() => setScope('Events')}
              first={sections.length === 0}
            />
            {events.slice(0, PREVIEW_COUNT).map((e: any) => (
              <EventRow key={e._id || e.id} item={e} onPress={() => openEvent(e._id || e.id)} />
            ))}
          </View>,
        );
      return (
        <>
          {sections}
          <Flourish />
        </>
      );
    }

    const note = dq.toUpperCase();
    if (scope === 'People')
      return (
        <>
          <SectionHeader title={`${peopleTotal ?? people.length} people`} note={note} first />
          {people.map((p: any) => (
            <PersonRow
              key={p._id || p.id}
              item={p}
              status={statusOf(p._id || p.id)}
              onPress={() => openProfile(p._id || p.id)}
            />
          ))}
          <Flourish />
        </>
      );
    if (scope === 'Gigs')
      return (
        <>
          <SectionHeader title={`${gigsTotal ?? gigs.length} gigs`} note={note} first />
          {gigs.map((g: any) => (
            <GigRow key={g._id || g.id} item={g} onPress={() => openGig(g._id || g.id)} />
          ))}
          <Flourish />
        </>
      );
    return (
      <>
        <SectionHeader title={`${eventsTotal ?? events.length} events`} note={note} first />
        {events.map((e: any) => (
          <EventRow key={e._id || e.id} item={e} onPress={() => openEvent(e._id || e.id)} />
        ))}
        <Flourish />
      </>
    );
  };

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={s.flex}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          onBack={() => router.back()}
          onSubmit={() => dq.length >= 2 && remember(dq)}
        />

        {active ? (
          <>
            <ScopeTabs value={scope} counts={counts} onChange={setScope} />
            <AppScrollView style={s.flex} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
              {renderActiveBody()}
            </AppScrollView>
          </>
        ) : (
          <AppScrollView style={s.flex} contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
            <IdleState
              recent={recent}
              onRecentPress={runQuery}
              onRecentRemove={(q) => removeRecent(q).then(setRecent)}
              onClearRecent={() => clearRecent().then(() => setRecent([]))}
              onCraft={runQuery}
              onCity={runQuery}
              onOpenProfile={openProfile}
            />
          </AppScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  flex: { flex: 1 },
  pad: { paddingHorizontal: 18, paddingBottom: 40 },
});
