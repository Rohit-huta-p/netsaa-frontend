// app/(app)/events/index.tsx
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Calendar, Users, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useEventsList } from '@/hooks/useEvents';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlatform } from '@/utils/platform';
import { useDebounce } from '@/hooks/useDebounce';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import AppScrollView from '@/components/AppScrollView';
import { EventRemote } from '@/components/events/discovery/EventRemote';
import { EventFacetRail } from '@/components/events/discovery/EventFacetRail';
import {
    ACTIVE_BG,
    ACTIVE_BORDER,
    ACTIVE_FG,
    SORT_OPTIONS,
    sortValue,
    setSort,
    describeFilters,
} from '@/components/events/discovery/eventFilterOptions';
import { INITIAL_EVENT_FILTERS } from '@/lib/constants/eventFilters';
import { EventFilterState } from '@/types/eventFilters';
import type { EventDoc } from '@/services/eventService';

/* ------------------------------------------------------------------ */
/* VisualEventCard — adapted to the new EventDoc schema (Plan 7)       */
/* ------------------------------------------------------------------ */

// Branded placeholder shown when an event has no image (no fake stock photos).
const NETSA_FALLBACK = require('@/../assets/netsa-logo-fallback.png');

/**
 * Translate a "When" chip into an ISO [startsAfter, startsBefore] window over
 * the event's startsAt. Returns both undefined for 'any'/undefined.
 *   today        → start-of-today … end-of-today
 *   this_weekend → upcoming Sat 00:00 … that Sun 23:59:59
 *   next_7       → now … now + 7 days
 *   this_month   → now … last day of current month 23:59:59
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
            // Upcoming Saturday (if today is Sat/Sun, use the current weekend).
            const day = now.getDay(); // 0=Sun … 6=Sat
            const sat = new Date(startOfToday);
            if (day === 0) {
                // Sunday → weekend started yesterday; anchor Saturday to -1 day.
                sat.setDate(sat.getDate() - 1);
            } else {
                sat.setDate(sat.getDate() + ((6 - day + 7) % 7));
            }
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

const VisualEventCard = ({ event, onPress }: { event: EventDoc; onPress: () => void }) => {
    const hero =
        (event.media && event.media.find((m) => m.isHero)) ||
        (event.media && event.media[0]);
    const imageUri = hero?.thumbnailUrl || hero?.url;

    const isPaid =
        event.registrationMode === 'paid_ticket' && (event.pricing?.amount ?? 0) > 0;
    const priceDisplay = isPaid ? `₹ ${event.pricing!.amount}` : 'Free';

    const category = event.topicTags?.[0] ?? 'Event';

    const startDate = event.startsAt ? new Date(event.startsAt) : null;
    const dateDisplay = startDate
        ? startDate.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
        : 'TBA';

    const locationDisplay =
        event.location?.kind === 'online'
            ? 'Online'
            : event.location?.venueName ||
            event.location?.address?.split(',')[0] ||
            'Location TBA';

    const organizerName =
        typeof event.organizerId === 'object' && event.organizerId !== null
            ? (event.organizerId as any).name ?? 'Organizer'
            : 'Organizer';

    const attendees = event.capacity?.registeredCount ?? 0;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            className="group bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden flex-col mb-6"
        >
            {/* Image Section */}
            <View className="relative w-full aspect-[4/3] overflow-hidden">
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        className="w-full h-full opacity-90"
                        resizeMode="cover"
                    />
                ) : (
                    // No image → centered NETSA logo, a bit blurred, on a dark panel.
                    <View className="w-full h-full items-center justify-center bg-black">
                        <Image
                            source={NETSA_FALLBACK}
                            style={{ width: '52%', height: '52%', opacity: 0.4 }}
                            resizeMode="contain"
                            blurRadius={3}
                        />
                    </View>
                )}

                {/* Category Badge (Top Left) */}
                <View className="absolute top-4 left-4">
                    <View className="bg-black/60 px-3 py-1 rounded-full border border-white/20">
                        <Text className="text-white text-[10px] uppercase font-black tracking-widest">
                            {category}
                        </Text>
                    </View>
                </View>

                {/* Price Badge (Bottom Right) */}
                <View className="absolute bottom-4 right-4">
                    <View className="bg-white px-3 py-1 rounded-full">
                        <Text className="text-black text-xs font-black">{priceDisplay}</Text>
                    </View>
                </View>
            </View>

            {/* Content Section */}
            <View className="p-5 flex-1">
                <View className="flex-row justify-between items-start mb-2">
                    <Text
                        numberOfLines={2}
                        className="text-lg font-bold text-white leading-tight flex-1 mr-2"
                    >
                        {event.title}
                    </Text>
                </View>

                <Text className="text-xs text-zinc-500 font-medium mb-4">{organizerName}</Text>

                <View className="mt-auto space-y-3 gap-2">
                    <View className="flex-row items-center gap-2">
                        <Calendar size={14} color="#f43f5e" />
                        <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-tighter">
                            {dateDisplay}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <MapPin size={14} color="#f43f5e" />
                        <Text
                            numberOfLines={1}
                            className="text-zinc-400 text-[10px] font-bold uppercase tracking-tighter flex-1"
                        >
                            {locationDisplay}
                        </Text>
                    </View>

                    <View className="pt-4 mt-2 border-t border-white/5 flex-row items-center justify-end">
                        <View className="flex-row items-center gap-1">
                            <Users size={12} color="#71717a" />
                            <Text className="text-[10px] font-bold text-zinc-500">{attendees}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

/* ------------------------------------------------------------------ */
/* Main Events page — Ask bar (universal) + Remote (mobile) / Rail     */
/* (desktop). One EventFilterState drives all surfaces + the server.   */
/* ------------------------------------------------------------------ */

export default function EventsPage() {
    const { isWeb } = usePlatform();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const userId = useAuthStore((s) => s.user?._id);
    const tabBarHeight = useMobileTabBarHeight();

    // Cross-platform breakpoint off measured width (works on web AND native —
    // NativeWind `md:` only fires on web). < 768 → Ask bar + Remote (mobile,
    // has the tab bar). ≥ 768 → Ask bar + Facet Rail (tablet/desktop, no tab bar).
    const isSm = width < 768;
    const isWide = !isSm;
    // Card columns step 2 → 3 → 4 with width (native gets the same progression).
    const cols = width >= 1440 ? 4 : width >= 1024 ? 3 : 2;

    const { setSelectedEventId } = useUiStore();

    // Unified search state
    const [searchState, setSearchState] = useState<{
        q: string;
        filters: EventFilterState | null;
        page: number;
    }>({
        q: '',
        filters: INITIAL_EVENT_FILTERS,
        page: 1,
    });

    const debouncedQuery = useDebounce(searchState.q, 500);

    /**
     * Map the EventFilterState onto the /v1/events list params.
     * Backend supports: category (csv, any-of), city, format (location.kind),
     * mode (registrationMode), startsAfter/startsBefore (windows startsAt),
     * sort. price_low/popular stay client-side (see sortedEvents below).
     */
    const listParams = useMemo(() => {
        const f = searchState.filters;
        const adv = f?.advanced;

        const category =
            adv?.category?.categories && adv.category.categories.length > 0
                ? adv.category.categories.map((c) => c.toLowerCase()).join(',')
                : undefined;

        const city = adv?.location?.city && adv.location.city !== 'any' ? adv.location.city : undefined;

        const format =
            adv?.location?.format === 'in_person' || adv?.location?.format === 'online'
                ? adv.location.format
                : undefined;

        const mode =
            adv?.pricing?.mode === 'free'
                ? ('free_rsvp' as const)
                : adv?.pricing?.mode === 'paid'
                    ? ('paid_ticket' as const)
                    : undefined;

        const { startsAfter, startsBefore } = timeFrameWindow(adv?.timing?.timeFrame);

        const sort = adv?.sorting?.sortBy === 'soonest' ? ('soonest' as const) : undefined;

        return {
            q: debouncedQuery || undefined,
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
    }, [debouncedQuery, searchState.filters, searchState.page]);

    const { data, isLoading: listLoading, error: listError } = useEventsList(listParams);
    const eventsList: EventDoc[] = data?.events ?? [];

    // Client-side sort of the current page. `soonest` is already applied
    // server-side via listParams.sort, so it (and `relevance`) returns as-is;
    // only price_low / popular reorder here.
    const sortedEvents = useMemo(() => {
        const sortBy = searchState.filters?.advanced?.sorting?.sortBy;
        const arr = [...eventsList];
        switch (sortBy) {
            case 'popular':
                return arr.sort(
                    (a, b) => (b.capacity?.registeredCount ?? 0) - (a.capacity?.registeredCount ?? 0)
                );
            case 'price_low':
                return arr.sort(
                    (a, b) => ((a as any).pricing?.amount ?? 0) - ((b as any).pricing?.amount ?? 0)
                );
            default:
                return arr;
        }
    }, [eventsList, searchState.filters]);

    const filtersState = searchState.filters ?? INITIAL_EVENT_FILTERS;

    const handleEventPress = (id: string) => {
        if (isWeb) {
            setSelectedEventId(id);
            router.push(`/events/${id}`);
        } else {
            router.push(`/events/${id}`);
        }
    };

    // Every surface (Remote · Rail · sort lenses) writes back through here.
    const updateFilters = (next: EventFilterState) =>
        setSearchState((prev) => ({ ...prev, filters: next, page: 1 }));

    // Desktop readout — the "one state" connective tissue under the Ask bar.
    const readoutParts = describeFilters(filtersState);
    const sortLabel = SORT_OPTIONS.find((s) => s.value === sortValue(filtersState))?.label ?? 'Relevant';

    /* ------------------------------ grid ------------------------------ */
    const renderGrid = () => {
        if (listLoading) {
            return (
                <View className="py-20 items-center justify-center">
                    <LoadingAnimation
                        source="https://lottie.host/a9975e00-d157-4513-b40f-77f83c2039be/fJeNBIUK06.lottie"
                        width={200}
                        height={200}
                    />
                    <Text className="text-zinc-500 mt-4 text-xs font-medium">Loading events...</Text>
                </View>
            );
        }
        if (listError) {
            return (
                <View className="py-20 items-center justify-center">
                    <Text className="text-red-500 font-bold">Unable to load events.</Text>
                </View>
            );
        }
        if (eventsList.length === 0) {
            return (
                <View className="py-20 items-center justify-center">
                    <Text className="text-zinc-500 text-xl font-bold mb-2">No events found.</Text>
                    <Text className="text-zinc-600 text-sm">Try adjusting your search or filters.</Text>
                </View>
            );
        }
        return (
            // Flex grid that works on web AND native. Each card sits in a width-%
            // cell (50% → 2/row, 33.3% → 3/row); the -6 / +6 gutter keeps even
            // spacing and left-aligns an incomplete last row.
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 16 }}>
                {sortedEvents.map((event) => (
                    <View key={event._id} style={{ width: `${100 / cols}%`, paddingHorizontal: 6 }}>
                        <VisualEventCard event={event} onPress={() => handleEventPress(event._id)} />
                    </View>
                ))}
            </View>
        );
    };

    /* ------------------------------ main column ------------------------------ */
    const renderMain = () => (
        <View
            className="pt-10 pb-8"
            style={{ width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: isSm ? 20 : 32 }}
        >
            {/* Hero Typography */}
            <View className="mb-10">
                <View className="flex-row items-center justify-between mb-8">
                    <View className="self-start bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                        <Text className="text-zinc-400 text-[10px] uppercase tracking-[0.3em] font-bold">
                            The Event Discovery
                        </Text>
                    </View>
                    {userId ? (
                        <TouchableOpacity
                            onPress={() => router.push('/events/compose')}
                            hitSlop={10}
                            className="flex-row items-center gap-1.5 px-4 py-2 rounded-full bg-rose-500"
                        >
                            <Plus size={14} color="#fff" />
                            <Text className="text-white text-xs font-black uppercase tracking-widest">Host</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
                <Text className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-4">
                    EXPERIENCE THE
                </Text>
                <Text className="text-5xl md:text-7xl font-black text-rose-400 tracking-tighter leading-[0.9] mb-6">
                    MAGIC LIVE.
                </Text>
                <Text className="text-lg md:text-xl text-zinc-400 font-light italic max-w-2xl">
                    From underground jazz clubs to national stadiums. Discover and book tickets to the most
                    exclusive artistic events across India.
                </Text>
            </View>

            {/* Ask bar — the dominant, universal search */}
            <View className="mb-8">
                <View className="h-12 bg-zinc-900/50 border border-white/10 rounded-2xl flex-row items-center px-4">
                    <Search size={20} color="#71717a" />
                    <TextInput
                        placeholder="Search events, cities..."
                        placeholderTextColor="#71717a"
                        className="flex-1 ml-3 text-white text-base font-light h-full"
                        value={searchState.q}
                        onChangeText={(text) => setSearchState((prev) => ({ ...prev, q: text, page: 1 }))}
                    />
                </View>

                {/* Desktop: readout + sort lenses. Mobile: sort lives in the Remote. */}
                {isWide && (
                    <View className="flex-row items-center justify-between mt-5" style={{ gap: 12 }}>
                        <Text className="text-zinc-500 text-xs flex-1" numberOfLines={1}>
                            Showing {readoutParts.length ? readoutParts.join('  ·  ') : 'all events'}
                            {'  ·  '}
                            <Text style={{ color: ACTIVE_FG }}>{sortLabel.toLowerCase()}</Text>
                        </Text>
                        <View className="flex-row" style={{ gap: 6 }}>
                            {SORT_OPTIONS.map((o) => {
                                const active = sortValue(filtersState) === o.value;
                                return (
                                    <TouchableOpacity
                                        key={o.value}
                                        onPress={() => updateFilters(setSort(filtersState, o.value))}
                                        className="h-8 px-3 rounded-lg items-center justify-center border"
                                        style={
                                            active
                                                ? { backgroundColor: ACTIVE_BG, borderColor: ACTIVE_BORDER }
                                                : { borderColor: 'rgba(255,255,255,0.08)' }
                                        }
                                    >
                                        <Text
                                            className="text-[11px] font-bold uppercase tracking-wider"
                                            style={{ color: active ? ACTIVE_FG : '#71717a' }}
                                        >
                                            {o.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Mobile: the Remote sits inline, right-aligned under the search. */}
                {!isWide && (
                    <View className="mt-4">
                        <EventRemote filters={filtersState} onChange={updateFilters} />
                    </View>
                )}
            </View>

            {/* Events Grid */}
            {renderGrid()}
        </View>
    );

    return (
        <View className="flex-1 bg-black overflow-hidden">
            {/* Background ambient effects — clipped by the root's overflow-hidden so
                the off-screen blobs don't extend the page (web: no horizontal
                overflow → no zoom-out / white margin). */}
            <View className="absolute top-[10%] -left-[10%] w-[600px] h-[600px] bg-rose-900/20 rounded-full opacity-50 blur-3xl pointer-events-none" />
            <View className="absolute bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-orange-900/10 rounded-full opacity-30 blur-3xl pointer-events-none" />

            <SafeAreaView className="flex-1" edges={['top']}>
                {isWide ? (
                    // Desktop / tablet — persistent Facet Rail + scrolling grid.
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <EventFacetRail
                            filters={filtersState}
                            onChange={updateFilters}
                            resultCount={data?.total}
                        />
                        <AppScrollView
                            className="flex-1"
                            contentContainerStyle={{ paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {renderMain()}
                        </AppScrollView>
                    </View>
                ) : (
                    // Mobile — Ask bar + inline Remote (right-aligned under search).
                    <AppScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderMain()}
                    </AppScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}
