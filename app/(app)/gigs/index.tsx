import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, TrendingUp, Sparkles, SlidersHorizontal } from 'lucide-react-native';
import { useGigs, useGig } from '@/hooks/useGigs';
import { useDebounce } from '@/hooks/useDebounce';
import { GigCard } from '@/components/gigs/GigCard';
import { GigDetails } from '@/components/gigs/GigDetails';
import AppScrollView from '@/components/AppScrollView';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { GigFilterModal } from '@/components/gigs/GigFilterModal';
import {
    ACCENT,
    ACTIVE_BG,
    ACTIVE_BORDER,
    ACTIVE_FG,
    ARTIST_OPTIONS,
    artistValues,
    setArtist,
    patchSection,
    countGigFacets,
    emptyGigFilters,
} from '@/components/gigs/discovery/gigFilterOptions';
import { FilterState } from '@/types/filters';

// Wrapper component to fetch full gig details (including viewerContext) on desktop
const DesktopGigPreview = ({ gigId, placeholderData }: { gigId: string, placeholderData: any }) => {
    const { data: fullGig, isLoading } = useGig(gigId);

    // Use full details if available, otherwise fall back to list data (placeholder)
    // We prioritize fullGig because it has viewerContext.hasApplied
    const gigToRender = fullGig || placeholderData;

    if (isLoading && !gigToRender) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={ACCENT} />
            </View>
        );
    }

    return <GigDetails gig={gigToRender} />;
};

export default function GigsListPage() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const tabBarHeight = useMobileTabBarHeight();

    // Cross-platform breakpoints off measured width (works on web AND native).
    // < 768 → Filters button is icon-only. Master-detail split (list + preview)
    // still only kicks in at ≥ 1024.
    const isSm = width < 768;
    const isDesktopLayout = width >= 1024;

    // Single source of truth for gig search
    const [searchState, setSearchState] = useState<{
        q: string;
        filters: FilterState | null;
        page: number;
    }>({
        q: '',
        filters: null,
        page: 1,
    });

    // UI states
    const [selectedGig, setSelectedGig] = useState<any>(null);
    const [isPageReady, setIsPageReady] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Local input state for controlled TextInput (before debounce)
    const [inputQuery, setInputQuery] = useState('');
    const debouncedQuery = useDebounce(inputQuery, 500);

    // Update searchState.q when debounced query changes
    React.useEffect(() => {
        setSearchState((prev) => ({
            ...prev,
            q: debouncedQuery.trim(),
            page: 1, // Reset to page 1 on new search
        }));
    }, [debouncedQuery]);

    // Pass searchState directly to useGigs (unchanged data path)
    const { data: gigsData, isLoading, error, isFetching } = useGigs({
        q: searchState.q,
        filters: searchState.filters || undefined,
        page: searchState.page,
        pageSize: 20,
    });

    // Handle page ready state
    React.useEffect(() => {
        if (!isLoading && !isPageReady && (gigsData || error)) {
            // Small delay to allow react-native to calculate layout and render
            const timer = setTimeout(() => {
                setIsPageReady(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading, gigsData, error]);

    // The filter surfaces read/write a non-null FilterState; the raw
    // searchState.filters stays null-until-touched so useGigs keeps hitting the
    // plain gigs list until a filter is actually set.
    const filtersState = searchState.filters ?? emptyGigFilters();

    // Craft tabs write live; the sheet applies its own draft on Apply.
    const updateFilters = useCallback((next: FilterState) => {
        setSearchState((prev) => ({ ...prev, filters: next, page: 1 }));
    }, []);

    const handleApplyFilters = useCallback((next: FilterState | null) => {
        setSearchState((prev) => ({ ...prev, filters: next ?? emptyGigFilters(), page: 1 }));
    }, []);

    const facetCount = countGigFacets(filtersState);
    const activeArtists = artistValues(filtersState);

    React.useEffect(() => {
        // Only auto-select on desktop layout
        if (isDesktopLayout && gigsData && gigsData.length > 0 && !selectedGig) {
            setSelectedGig(gigsData[0]);
        }
    }, [gigsData, isDesktopLayout]);

    const handleGigPress = (gig: any) => {
        // Side-by-side preview only on desktop (>= 1024px); otherwise navigate.
        if (isDesktopLayout) {
            setSelectedGig(gig);
        } else {
            router.push(`/gigs/${gig._id}`);
        }
    };

    if (!isPageReady) {
        return <AppLoadingScreen />;
    }

    /* ------------------------------ board ------------------------------ */
    const renderBoard = () => {
        if (isLoading && isPageReady) {
            return (
                <View className="flex-1 justify-center items-center py-20">
                    <ActivityIndicator size="large" color={ACCENT} />
                    <Text className="text-zinc-500 mt-4 text-xs font-medium">Updating results...</Text>
                </View>
            );
        }
        if (error) {
            return (
                <View className="flex-1 justify-center items-center py-20 px-8">
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-red-500/10">
                        <Sparkles size={32} color="#EF4444" />
                    </View>
                    <Text className="text-white font-bold text-xl text-center mb-2">Oops!</Text>
                    <Text className="text-zinc-400 text-center">
                        Unable to load gigs. Please check your connection.
                    </Text>
                </View>
            );
        }
        if (!gigsData || gigsData.length === 0) {
            return (
                <View className="flex-1 justify-center items-center py-20 px-8">
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-zinc-800/50">
                        <Sparkles size={32} color="#71717A" />
                    </View>
                    <Text className="text-white font-bold text-xl text-center mb-2">No Gigs Yet</Text>
                    <Text className="text-zinc-400 text-center">Check back soon for new opportunities.</Text>
                </View>
            );
        }
        return (
            <View className="grid grid-cols-1 lg:grid-cols-8 gap-12">
                {/* LIST VIEW */}
                <View className="col-span-2">
                    <View className="flex-row items-center justify-between px-2 mb-4">
                        <Text className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.3em]">
                            {gigsData.length} {gigsData.length === 1 ? 'result' : 'results'}
                            {(searchState.q || facetCount > 0) && ' found'}
                        </Text>
                        <View className="flex-row items-center gap-1">
                            {isFetching ? (
                                <ActivityIndicator size="small" color="#3B82F6" />
                            ) : (
                                <>
                                    <TrendingUp size={12} color="#3B82F6" />
                                    <Text className="text-blue-400 text-[10px] font-black uppercase">Live Feed</Text>
                                </>
                            )}
                        </View>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 24 }}
                        style={{ maxHeight: 900 }}
                    >
                        {gigsData.map((gig: any) => (
                            <GigCard
                                key={gig._id}
                                gig={gig}
                                onPress={() => handleGigPress(gig)}
                                isSelected={isDesktopLayout && selectedGig?._id === gig._id}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* DETAIL VIEW - DESKTOP ONLY (>= 1024px) */}
                {isDesktopLayout && selectedGig && (
                    <View className="col-span-6">
                        <View className="bg-zinc-900/40 border border-white/10 rounded-[4rem] overflow-hidden min-h-[900px]">
                            <DesktopGigPreview gigId={selectedGig._id} placeholderData={selectedGig} />
                        </View>
                    </View>
                )}
            </View>
        );
    };

    /* ------------------------------ main column ------------------------------ */
    const renderMain = () => (
        <View>
            {/* HERO + TOOLBAR */}
            <View className="pt-16 pb-8 px-6">
                <View className="container mx-auto max-w-7xl w-full">
                    <View className="mb-8 max-w-2xl">
                        <Text className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">
                            THE GIG BOARD.
                        </Text>
                        <Text className="text-xl text-zinc-500 font-light">
                            Explore hand-picked professional opportunities in your city.
                        </Text>
                    </View>

                    {/* Toolbar — search (dominant) + single Filters button (opens sheet) */}
                    <View className="flex-row items-center gap-3">
                        <View className="h-11 flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl flex-row items-center px-4">
                            <Search size={20} color={isFetching ? ACCENT : '#71717a'} />
                            <TextInput
                                placeholder="Search gigs..."
                                placeholderTextColor="#71717a"
                                className="flex-1 ml-3 text-white text-base font-light h-full"
                                value={inputQuery}
                                onChangeText={setInputQuery}
                                returnKeyType="search"
                            />
                            {isFetching && inputQuery ? (
                                <ActivityIndicator size="small" color={ACCENT} />
                            ) : null}
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowFilterModal(true)}
                            className={`h-11 rounded-2xl flex-row items-center justify-center gap-2 border ${isSm ? 'px-3' : 'px-4'} ${facetCount > 0 ? '' : 'bg-zinc-900/50 border-white/10'}`}
                            style={
                                facetCount > 0
                                    ? { backgroundColor: ACTIVE_BG, borderColor: ACTIVE_BORDER }
                                    : undefined
                            }
                        >
                            <SlidersHorizontal size={18} color={facetCount > 0 ? ACTIVE_FG : '#fff'} />
                            {!isSm && (
                                <Text
                                    className="text-xs font-black uppercase tracking-widest"
                                    style={{ color: facetCount > 0 ? ACTIVE_FG : '#fff' }}
                                >
                                    Filters
                                </Text>
                            )}
                            {facetCount > 0 && (
                                <View
                                    className="rounded-full w-5 h-5 items-center justify-center"
                                    style={{ backgroundColor: ACTIVE_FG }}
                                >
                                    <Text className="text-[10px] font-black" style={{ color: '#0a0a0a' }}>
                                        {facetCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Craft tabs — gigs' primary axis (Artist type, multi-select). "All" clears it. */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-grow-0 mt-4"
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {[{ value: 'all', label: 'All' }, ...ARTIST_OPTIONS].map((o) => {
                            const isActive =
                                o.value === 'all' ? activeArtists.length === 0 : activeArtists.includes(o.value);
                            return (
                                <TouchableOpacity
                                    key={o.value}
                                    onPress={() =>
                                        updateFilters(
                                            o.value === 'all'
                                                ? patchSection(filtersState, 'artistType', { artistTypes: [] })
                                                : setArtist(filtersState, o.value)
                                        )
                                    }
                                    className={`h-8 px-3 rounded-xl items-center justify-center border ${isActive ? '' : 'bg-transparent border-white/10'}`}
                                    style={
                                        isActive
                                            ? { backgroundColor: ACTIVE_BG, borderColor: ACTIVE_BORDER }
                                            : undefined
                                    }
                                >
                                    <Text
                                        className={`text-[10px] font-black uppercase tracking-widest ${isActive ? '' : 'text-zinc-500'}`}
                                        style={isActive ? { color: ACTIVE_FG } : undefined}
                                    >
                                        {o.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            {/* BOARD */}
            <View className="w-[90%] mx-auto pb-12">
                {renderBoard()}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-black overflow-hidden">
            <SafeAreaView className="flex-1" edges={['top']}>
                <AppScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: isSm ? tabBarHeight + 24 : 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {renderMain()}
                </AppScrollView>

                {/* Filters bottom sheet (holds all filters + sort) */}
                <GigFilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    filters={filtersState}
                    onApplyFilters={handleApplyFilters}
                />
            </SafeAreaView>
        </View>
    );
}
