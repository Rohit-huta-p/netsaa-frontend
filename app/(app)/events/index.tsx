// app/(app)/events/index.tsx — the events board, A·Minimal
// (DOCS/04-design/mockups/event-board-aminimal.html, locked 2026-10-21).
// Sibling of the gig board: a flat filtered feed of Marquee poster cards in a
// 2-up grid (stepping to 3→4 columns on wider screens). Quiet masthead, a
// search · sort · filter-funnel toolbar, craft tabs with a trailing "More"
// pill, and a single bottom-sheet for the refine filters (Event type · Location
// · When · Format · Price). Pay is a plain fact (pay-as-fact rule).
//
// The data path (useEventsList → GET /v1/events) and the server-mapped filter
// wiring (category · city · format · when · price · sort) are unchanged from the
// previous screen. Event type is the one ADDED facet — a searchable multi-select
// applied client-side over the loaded page (the backend honours eventType only
// as a single exact match; see types/eventFilters.ts). price_low / popular sort
// client-side, exactly as before.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, X, Filter, SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useEventsList } from '@/hooks/useEvents';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlatform } from '@/utils/platform';
import { useDebounce } from '@/hooks/useDebounce';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import AppScrollView from '@/components/AppScrollView';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import {
    CRAFT_OPTIONS,
    WHEN_OPTIONS,
    craftValue,
    setCraft,
    sortValue,
    setSort,
    whenValue,
    eventTypeValues,
    countEventFacets,
    distinctEventTypeOptions,
} from '@/components/events/discovery/eventFilterOptions';
import { INITIAL_EVENT_FILTERS } from '@/lib/constants/eventFilters';
import { EventFilterState } from '@/types/eventFilters';
import type { EventDoc } from '@/services/eventService';
import { C, F, INK } from '@/components/events/board/theme';
import { EventMarqueeCard } from '@/components/events/board/EventMarqueeCard';
import { EventSortMenu } from '@/components/events/board/EventSortMenu';
import { EventFilterSheet } from '@/components/events/board/EventFilterSheet';

/**
 * Translate a "When" chip into an ISO [startsAfter, startsBefore] window over
 * the event's startsAt. Returns both undefined for 'any'/undefined.
 */
function timeFrameWindow(
    tf?: 'today' | 'this_weekend' | 'next_7' | 'this_month',
): { startsAfter?: string; startsBefore?: string } {
    if (!tf) return {};
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    switch (tf) {
        case 'today':
            return { startsAfter: startOfToday.toISOString(), startsBefore: endOfToday.toISOString() };
        case 'this_weekend': {
            const day = now.getDay(); // 0=Sun … 6=Sat
            const sat = new Date(startOfToday);
            if (day === 0) sat.setDate(sat.getDate() - 1);
            else sat.setDate(sat.getDate() + ((6 - day + 7) % 7));
            const sun = new Date(sat);
            sun.setDate(sat.getDate() + 1);
            sun.setHours(23, 59, 59, 999);
            return { startsAfter: sat.toISOString(), startsBefore: sun.toISOString() };
        }
        case 'next_7': {
            const in7 = new Date(now);
            in7.setDate(in7.getDate() + 7);
            return { startsAfter: now.toISOString(), startsBefore: in7.toISOString() };
        }
        case 'this_month': {
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            return { startsAfter: now.toISOString(), startsBefore: endOfMonth.toISOString() };
        }
        default:
            return {};
    }
}

/* ── small toolbar / tab chrome ─────────────────────────────────────────── */

// Funnel button in the toolbar (one of two entry points into the filter sheet).
function FilterButton({ count, onPress }: { count: number; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={[s.iconBtn, count > 0 && s.iconBtnOn]} hitSlop={4} accessibilityLabel="Filters">
            <Filter size={17} color={count > 0 ? C.orange : C.cream} />
            {count > 0 ? (
                <View style={s.fbBadge}>
                    <Text style={s.fbBadgeTxt}>{count}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

// "More" pill — the last craft tab (non-pinned, scrolls with the row); the
// second entry point into the filter sheet.
function MorePill({ count, onPress }: { count: number; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} style={s.more} accessibilityLabel="More filters">
            <SlidersHorizontal size={13} color={C.t2} />
            <Text style={s.moreTxt}>MORE</Text>
            {count > 0 ? (
                <View style={s.moreBadge}>
                    <Text style={s.moreBadgeTxt}>{count}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

export default function EventsPage() {
    const { isWeb } = usePlatform();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const userId = useAuthStore((state) => state.user?._id);
    const tabBarHeight = useMobileTabBarHeight();
    const { setSelectedEventId } = useUiStore();

    const isSm = width < 768;
    // Card columns step 2 → 3 → 4 with width (native gets the same progression).
    const cols = width >= 1440 ? 4 : width >= 1024 ? 3 : 2;

    const [searchState, setSearchState] = useState<{ q: string; filters: EventFilterState; page: number }>({
        q: '',
        filters: INITIAL_EVENT_FILTERS,
        page: 1,
    });
    const [showSheet, setShowSheet] = useState(false);
    const [isPageReady, setIsPageReady] = useState(false);

    // Decouple the text field from the query key (smooth typing) — a local input
    // state is debounced into searchState.q, so each keystroke doesn't rebuild the
    // query. Combined with useEventsList's keepPreviousData, the list never tears
    // down to a loader mid-search. Mirrors the gig board.
    const [inputQuery, setInputQuery] = useState('');
    const debouncedQuery = useDebounce(inputQuery, 500);
    useEffect(() => {
        setSearchState((prev) => ({ ...prev, q: debouncedQuery.trim(), page: 1 }));
    }, [debouncedQuery]);

    const filters = searchState.filters;

    // Map the EventFilterState onto the /v1/events list params. eventType is NOT
    // sent (client-side facet — see below); price_low/popular sort client-side.
    const listParams = useMemo(() => {
        const adv = filters.advanced;
        const category =
            adv.category.categories && adv.category.categories.length > 0
                ? adv.category.categories.map((c) => c.toLowerCase()).join(',')
                : undefined;
        const city = adv.location.city && adv.location.city !== 'any' ? adv.location.city : undefined;
        const format =
            adv.location.format === 'in_person' || adv.location.format === 'online' ? adv.location.format : undefined;
        const mode =
            adv.pricing.mode === 'free'
                ? ('free_rsvp' as const)
                : adv.pricing.mode === 'paid'
                    ? ('paid_ticket' as const)
                    : undefined;
        const { startsAfter, startsBefore } = timeFrameWindow(adv.timing.timeFrame);
        const sort = adv.sorting.sortBy === 'soonest' ? ('soonest' as const) : undefined;

        return {
            q: searchState.q || undefined,
            category,
            city,
            format,
            mode,
            startsAfter,
            startsBefore,
            sort,
            page: searchState.page,
            limit: 20,
        };
    }, [searchState.q, filters, searchState.page]);

    const { data, isLoading, error, isFetching } = useEventsList(listParams);
    const eventsList: EventDoc[] = data?.events ?? [];

    // First-load gate (fresh start on each mount), then the list stays mounted.
    useEffect(() => {
        if (!isLoading && !isPageReady && (data || error)) {
            const t = setTimeout(() => setIsPageReady(true), 100);
            return () => clearTimeout(t);
        }
    }, [isLoading, data, error, isPageReady]);

    // Client-side: event-type any-of filter + price_low/popular sort over the page.
    const visibleEvents = useMemo(() => {
        const types = eventTypeValues(filters);
        let arr = types.length ? eventsList.filter((e) => e.eventType && types.includes(e.eventType)) : eventsList;
        const sortBy = filters.advanced.sorting.sortBy;
        if (sortBy === 'popular') {
            arr = [...arr].sort((a, b) => (b.capacity?.registeredCount ?? 0) - (a.capacity?.registeredCount ?? 0));
        } else if (sortBy === 'price_low') {
            arr = [...arr].sort((a, b) => (a.pricing?.amount ?? 0) - (b.pricing?.amount ?? 0));
        }
        return arr;
    }, [eventsList, filters]);

    // Options for the sheet's event-type multi-select, derived from the data.
    const eventTypeOptions = useMemo(() => distinctEventTypeOptions(eventsList), [eventsList]);

    const facetCount = countEventFacets(filters);
    const activeCraft = craftValue(filters);
    const sortV = sortValue(filters);

    const updateFilters = useCallback(
        (next: EventFilterState) => setSearchState((prev) => ({ ...prev, filters: next, page: 1 })),
        [],
    );
    const onSelectSort = useCallback((v: string) => updateFilters(setSort(filters, v)), [filters, updateFilters]);

    const handleEventPress = (id: string) => {
        if (isWeb) setSelectedEventId(id);
        router.push(`/events/${id}`);
    };

    if (!isPageReady) return <AppLoadingScreen />;

    const n = visibleEvents.length;
    const whenV = whenValue(filters);
    const countSuffix =
        whenV !== 'any' ? (WHEN_OPTIONS.find((w) => w.value === whenV)?.label ?? 'FOUND').toUpperCase() : 'FOUND';

    /* ------------------------------ grid ------------------------------ */
    const renderGrid = () => {
        if (error) {
            return (
                <View style={s.center}>
                    <Text style={s.centerTitle}>Couldn't load events</Text>
                    <Text style={s.centerSub}>Check your connection and try again.</Text>
                </View>
            );
        }
        if (n === 0) {
            const q = searchState.q.trim();
            return (
                <View style={s.center}>
                    <Text style={s.centerTitle}>
                        {q ? `No events for “${q}”` : facetCount > 0 ? 'No events match your filters' : 'No events yet'}
                    </Text>
                    <Text style={s.centerSub}>
                        {q || facetCount > 0 ? 'Try a different search or clear your filters.' : 'Check back soon for new events.'}
                    </Text>
                </View>
            );
        }
        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginTop: 8 }}>
                {visibleEvents.map((event) => (
                    <View key={event._id} style={{ width: `${100 / cols}%`, paddingHorizontal: 6 }}>
                        <EventMarqueeCard event={event} onPress={() => handleEventPress(event._id)} />
                    </View>
                ))}
            </View>
        );
    };

    const craftTabs = [{ value: 'any', label: 'All' }, ...CRAFT_OPTIONS.filter((o) => o.value !== 'any')];

    return (
        <View style={{ flex: 1, backgroundColor: C.canvas }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <AppScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: isSm ? tabBarHeight + 24 : 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[s.page, { paddingHorizontal: isSm ? 20 : 32 }]}>
                        {/* Masthead */}
                        <View style={s.header}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.eyebrow}>DISCOVER · EVENTS</Text>
                                <Text style={s.title}>What's on</Text>
                                <Text style={s.sub}>Workshops, shows &amp; auditions.</Text>
                            </View>
                            {userId ? (
                                <Pressable onPress={() => router.push('/events/compose')} hitSlop={8} style={s.host}>
                                    <Plus size={13} color={C.orange} />
                                    <Text style={s.hostTxt}>HOST</Text>
                                </Pressable>
                            ) : null}
                        </View>

                        {/* Toolbar: search · sort · filter funnel */}
                        <View style={s.toolbar}>
                            <View style={s.search}>
                                <Search size={18} color={isFetching && inputQuery ? C.orange : C.t3} />
                                <TextInput
                                    value={inputQuery}
                                    onChangeText={setInputQuery}
                                    placeholder="Search events, cities…"
                                    placeholderTextColor={C.t3}
                                    style={s.searchInput}
                                    returnKeyType="search"
                                />
                                {inputQuery.length > 0 ? (
                                    <Pressable onPress={() => setInputQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                                        <X size={16} color={C.t2} />
                                    </Pressable>
                                ) : null}
                            </View>
                            <EventSortMenu value={sortV} onSelect={onSelectSort} />
                            <FilterButton count={facetCount} onPress={() => setShowSheet(true)} />
                        </View>

                        {/* Craft tabs + trailing More pill */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
                            style={s.craftRow}
                        >
                            {craftTabs.map((o) => {
                                const active = activeCraft === o.value;
                                return (
                                    <Pressable
                                        key={o.value}
                                        onPress={() => updateFilters(setCraft(filters, o.value))}
                                        style={[s.craft, active && s.craftOn]}
                                    >
                                        <Text style={[s.craftTxt, active && s.craftTxtOn]}>{o.label}</Text>
                                    </Pressable>
                                );
                            })}
                            <MorePill count={facetCount} onPress={() => setShowSheet(true)} />
                        </ScrollView>

                        {/* Count row */}
                        <View style={s.countRow}>
                            <Text style={s.count}>
                                <Text style={s.countB}>{n}</Text>
                                {` ${n === 1 ? 'EVENT' : 'EVENTS'} · ${countSuffix}`}
                            </Text>
                            <View style={s.live}>
                                {isFetching ? (
                                    <ActivityIndicator size="small" color={C.green} />
                                ) : (
                                    <>
                                        <View style={s.dot} />
                                        <Text style={s.liveTxt}>LIVE</Text>
                                    </>
                                )}
                            </View>
                        </View>

                        {renderGrid()}
                    </View>
                </AppScrollView>

                <EventFilterSheet
                    visible={showSheet}
                    onClose={() => setShowSheet(false)}
                    filters={filters}
                    onApplyFilters={updateFilters}
                    eventTypeOptions={eventTypeOptions}
                />
            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    page: { width: '100%', maxWidth: 1100, alignSelf: 'center', paddingTop: 12 },

    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingTop: 18 },
    eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: C.t3 },
    title: { fontFamily: F.serif, fontSize: 26, letterSpacing: -0.4, color: C.cream, marginTop: 7 },
    sub: { fontFamily: F.body, fontSize: 12.5, color: C.t2, marginTop: 6, lineHeight: 19 },
    host: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 13,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,107,53,0.35)',
        backgroundColor: 'rgba(255,107,53,0.08)',
        marginTop: 2,
    },
    hostTxt: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.orange },

    toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
    search: {
        flex: 1,
        height: 46,
        backgroundColor: C.well,
        borderWidth: 1,
        borderColor: C.hair,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 10,
    },
    searchInput: { flex: 1, color: C.cream, fontFamily: F.body, fontSize: 14, padding: 0 },

    iconBtn: {
        width: 46,
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.hair,
        backgroundColor: C.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtnOn: { borderColor: 'rgba(255,107,53,0.35)' },
    fbBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 17,
        height: 17,
        paddingHorizontal: 4,
        borderRadius: 9,
        backgroundColor: C.orange,
        borderWidth: 2,
        borderColor: C.canvas,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fbBadgeTxt: { fontFamily: F.bold, fontSize: 9, color: INK },

    craftRow: { marginTop: 16, flexGrow: 0 },
    craft: {
        height: 33,
        paddingHorizontal: 14,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: C.hair,
        alignItems: 'center',
        justifyContent: 'center',
    },
    craftOn: { backgroundColor: C.orange, borderColor: C.orange },
    craftTxt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.t2 },
    craftTxtOn: { color: INK, fontFamily: F.bold },

    more: {
        height: 33,
        paddingHorizontal: 13,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: C.hair,
        backgroundColor: C.chip,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    moreTxt: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.t1 },
    moreBadge: {
        minWidth: 15,
        height: 15,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: C.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreBadgeTxt: { fontFamily: F.bold, fontSize: 9, color: INK },

    countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 2 },
    count: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.6, color: C.t3 },
    countB: { color: C.t1, fontFamily: F.bold },
    live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
    liveTxt: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.4, color: C.green },

    center: { paddingVertical: 60, alignItems: 'center', gap: 8 },
    centerTitle: { fontFamily: F.serif, fontSize: 18, color: C.cream, textAlign: 'center' },
    centerSub: { fontFamily: F.body, fontSize: 13, color: C.t2, textAlign: 'center' },
});
