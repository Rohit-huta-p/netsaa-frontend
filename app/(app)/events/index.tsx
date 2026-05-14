// app/(app)/events/index.tsx
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    useWindowDimensions,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Calendar, Users, Filter, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { useEventsList } from '@/hooks/useEvents';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlatform } from '@/utils/platform';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import AppScrollView from '@/components/AppScrollView';
import { EventFilterModal } from '@/components/events/EventFilterModal';
import {
    INITIAL_EVENT_FILTERS,
    countActiveEventFilters,
    EVENT_CATEGORIES,
} from '@/lib/constants/eventFilters';
import { EventFilterState } from '@/types/eventFilters';
import type { EventDoc } from '@/services/eventService';

/* ------------------------------------------------------------------ */
/* VisualEventCard — adapted to the new EventDoc schema (Plan 7)       */
/* ------------------------------------------------------------------ */

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000';

const VisualEventCard = ({ event, onPress }: { event: EventDoc; onPress: () => void }) => {
    const hero =
        (event.media && event.media.find((m) => m.isHero)) ||
        (event.media && event.media[0]);
    const imageUri = hero?.thumbnailUrl || hero?.url || FALLBACK_IMAGE;

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
            className="group bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden flex-col mb-6"
        >
            {/* Image Section */}
            <View className="relative w-full aspect-[4/3] overflow-hidden">
                <Image
                    source={{ uri: imageUri }}
                    className="w-full h-full opacity-90"
                    resizeMode="cover"
                />

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
/* Main Events page — mirrors the v1 main-branch editorial design.     */
/* ------------------------------------------------------------------ */

export default function EventsPage() {
    const { isWeb } = usePlatform();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const userId = useAuthStore((s) => s.user?._id);

    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;

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
     * Map the rich EventFilterState shape from the v1 design onto the new
     * /api/events list params. Today the new backend supports `topicTag`,
     * `city`, `mode`, `skill`, `q`, `page`, `limit`. Anything beyond that
     * gets ignored gracefully; richer filters can be wired later.
     */
    const listParams = useMemo(() => {
        const f = searchState.filters;
        const topicTag = f?.advanced?.category?.categories?.[0]?.toLowerCase();
        const city = f?.advanced?.location?.city || undefined;
        return {
            q: debouncedQuery || undefined,
            topicTag: topicTag === undefined || topicTag === 'all events' ? undefined : topicTag,
            city,
            page: searchState.page,
            limit: 20,
        };
    }, [debouncedQuery, searchState.filters, searchState.page]);

    const { data, isLoading: listLoading, error: listError } = useEventsList(listParams);
    const eventsList: EventDoc[] = data?.events ?? [];

    const [showFilterModal, setShowFilterModal] = useState(false);

    const filters = ['All Events', ...EVENT_CATEGORIES];
    const activeCategoryPill =
        searchState.filters?.advanced.category.categories?.[0] || 'All Events';
    const activeFilterCount = searchState.filters
        ? countActiveEventFilters(searchState.filters)
        : 0;

    const handleEventPress = (id: string) => {
        if (isWeb) {
            setSelectedEventId(id);
            router.push(`/events/${id}`);
        } else {
            router.push(`/events/${id}`);
        }
    };

    const handleCategoryPillPress = (category: string) => {
        setSearchState((prev) => {
            const currentFilters = prev.filters || INITIAL_EVENT_FILTERS;
            return {
                ...prev,
                page: 1,
                filters: {
                    ...currentFilters,
                    advanced: {
                        ...currentFilters.advanced,
                        category: {
                            ...currentFilters.advanced.category,
                            categories: category === 'All Events' ? [] : [category],
                        },
                    },
                },
            };
        });
    };

    const handleApplyEventFilters = (newFilters: EventFilterState | null) => {
        setSearchState((prev) => ({
            ...prev,
            filters: newFilters,
            page: 1,
        }));
    };

    return (
        <View className="flex-1 bg-black">
            {/* Background ambient effects */}
            <View className="absolute top-[10%] -left-[10%] w-[600px] h-[600px] bg-rose-900/20 rounded-full opacity-50 blur-3xl pointer-events-none" />
            <View className="absolute bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-orange-900/10 rounded-full opacity-30 blur-3xl pointer-events-none" />

            <SafeAreaView className="flex-1" edges={['top']}>
                <AppScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="px-6 pt-10 pb-8 w-full md:w-[80%] mx-auto">
                        {/* Hero Typography */}
                        <View className="mb-12">
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
                                        <Text className="text-white text-xs font-black uppercase tracking-widest">
                                            Host
                                        </Text>
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
                                From underground jazz clubs to national stadiums. Discover and book
                                tickets to the most exclusive artistic events across India.
                            </Text>
                        </View>

                        {/* Search & Filters Row */}
                        <View className="flex-col md:flex-row gap-6 mb-12">
                            <View className="flex-row gap-4 flex-1">
                                {/* Search Input */}
                                <View className="relative h-14 bg-zinc-900/50 border border-white/5 rounded-2xl flex-row items-center px-4 flex-1">
                                    <Search size={20} color="#71717a" />
                                    <TextInput
                                        placeholder="Search events, cities..."
                                        placeholderTextColor="#71717a"
                                        className="flex-1 ml-3 text-white text-lg font-light h-full"
                                        value={searchState.q}
                                        onChangeText={(text) =>
                                            setSearchState((prev) => ({
                                                ...prev,
                                                q: text,
                                                page: 1,
                                            }))
                                        }
                                    />
                                </View>

                                {/* Filters Button */}
                                <TouchableOpacity
                                    onPress={() => setShowFilterModal(true)}
                                    className={`h-14 px-6 rounded-2xl flex-row items-center gap-2 border ${
                                        activeFilterCount > 0
                                            ? 'bg-white border-white'
                                            : 'bg-zinc-900/50 border-white/10'
                                    }`}
                                >
                                    <Filter
                                        size={18}
                                        color={activeFilterCount > 0 ? '#000' : '#fff'}
                                    />
                                    {activeFilterCount > 0 && (
                                        <View className="bg-black rounded-full w-5 h-5 items-center justify-center">
                                            <Text className="text-white text-[10px] font-black">
                                                {activeFilterCount}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Category Pills */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-grow-0"
                                contentContainerStyle={{ gap: 8 }}
                            >
                                {filters.map((filter) => {
                                    const isActive = filter === activeCategoryPill;
                                    return (
                                        <TouchableOpacity
                                            key={filter}
                                            onPress={() => handleCategoryPillPress(filter)}
                                            className={`h-14 px-6 rounded-2xl items-center justify-center border ${
                                                isActive
                                                    ? 'bg-white border-transparent'
                                                    : 'bg-transparent border-white/10'
                                            }`}
                                        >
                                            <Text
                                                className={`text-[10px] font-black uppercase tracking-widest ${
                                                    isActive ? 'text-black' : 'text-zinc-500'
                                                }`}
                                            >
                                                {filter}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Events Grid */}
                        {listLoading ? (
                            <View className="py-20 items-center justify-center">
                                <LoadingAnimation
                                    source="https://lottie.host/a9975e00-d157-4513-b40f-77f83c2039be/fJeNBIUK06.lottie"
                                    width={200}
                                    height={200}
                                />
                                <Text className="text-zinc-500 mt-4 text-xs font-medium">
                                    Loading events...
                                </Text>
                            </View>
                        ) : listError ? (
                            <View className="py-20 items-center justify-center">
                                <Text className="text-red-500 font-bold">Unable to load events.</Text>
                            </View>
                        ) : eventsList.length === 0 ? (
                            <View className="py-20 items-center justify-center">
                                <Text className="text-zinc-500 text-xl font-bold mb-2">
                                    No events found.
                                </Text>
                                <Text className="text-zinc-600 text-sm">
                                    Try adjusting your search or filters.
                                </Text>
                            </View>
                        ) : (
                            // Responsive Grid Wrapper. Tailwind grid classes hydrate on web via
                            // NativeWind; native falls back to flex-column (1 col), which is the
                            // desired MVP layout on mobile.
                            <View className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                                {eventsList.map((event) => (
                                    <VisualEventCard
                                        key={event._id}
                                        event={event}
                                        onPress={() => handleEventPress(event._id)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                </AppScrollView>

                <EventFilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    filters={searchState.filters || INITIAL_EVENT_FILTERS}
                    onApplyFilters={handleApplyEventFilters}
                    activeFilterCount={activeFilterCount}
                />
            </SafeAreaView>
        </View>
    );
}
