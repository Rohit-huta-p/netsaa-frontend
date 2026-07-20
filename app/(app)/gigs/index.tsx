import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, TrendingUp, Sparkles } from 'lucide-react-native';
import { useGigs, useGig } from '@/hooks/useGigs';
import { useDebounce } from '@/hooks/useDebounce';
import { GigCard } from '@/components/gigs/GigCard';
import { GigDetails } from '@/components/gigs/GigDetails';
import { HirerMirrorNudge } from '@/components/profile/completion';
import AppScrollView from '@/components/AppScrollView';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { GigFacetRail } from '@/components/gigs/discovery/GigFacetRail';
import { GigRemote } from '@/components/gigs/discovery/GigRemote';
import {
    ACCENT,
    ACTIVE_BG,
    ACTIVE_BORDER,
    ACTIVE_FG,
    SORT_OPTIONS,
    sortValue,
    setSort,
    describeGigFilters,
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
    // < 768 → search + Remote pill (mobile). ≥ 768 → Facet Rail + board.
    // Master-detail split (list + preview) still only kicks in at ≥ 1024.
    const isSm = width < 768;
    const isWide = !isSm;
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

    // Every surface (Rail · Remote · sort lenses) writes back through here.
    const updateFilters = useCallback((next: FilterState) => {
        setSearchState((prev) => ({ ...prev, filters: next, page: 1 }));
    }, []);

    const facetCount = countGigFacets(filtersState);
    const readoutParts = describeGigFilters(filtersState);
    const sortLabel = SORT_OPTIONS.find((s) => s.value === sortValue(filtersState))?.label ?? 'Relevant';

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
                        {gigsData.map((gig: any, i: number) => (
                            <React.Fragment key={gig._id}>
                                <GigCard
                                    gig={gig}
                                    onPress={() => handleGigPress(gig)}
                                    isSelected={isDesktopLayout && selectedGig?._id === gig._id}
                                />
                                {/* Surface B — the Mirror, an interstitial after the first few cards (self-gates) */}
                                {i === 2 && <HirerMirrorNudge />}
                            </React.Fragment>
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
            {/* HERO + SEARCH */}
            <View className="pt-16 pb-8 px-6" style={{ position: 'relative', zIndex: 30 }}>
                <View className="container mx-auto max-w-7xl w-full">
                    <View className="mb-8 max-w-2xl">
                        <Text className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">
                            THE GIG BOARD.
                        </Text>
                        <Text className="text-xl text-zinc-500 font-light">
                            Explore hand-picked professional opportunities in your city.
                        </Text>
                    </View>

                    {/* Search — the dominant, universal filter */}
                    <View className="relative w-full">
                        <View className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
                            <Search size={20} color={isFetching ? ACCENT : 'rgba(255, 255, 255, 0.4)'} />
                        </View>
                        <TextInput
                            placeholder="Search gigs..."
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            style={{
                                width: '100%',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                                height: 56,
                                paddingLeft: 48,
                                paddingRight: 16,
                                borderRadius: 12,
                                color: '#FFFFFF',
                                fontSize: 16,
                            }}
                            value={inputQuery}
                            onChangeText={setInputQuery}
                            returnKeyType="search"
                        />
                        {isFetching && inputQuery && (
                            <View className="absolute right-4 top-1/2 -translate-y-1/2">
                                <ActivityIndicator size="small" color={ACCENT} />
                            </View>
                        )}
                    </View>

                    {/* Desktop: readout + sort lenses. Mobile: sort lives in the Remote. */}
                    {isWide && (
                        <View className="flex-row items-center justify-between mt-5" style={{ gap: 12 }}>
                            <Text className="text-zinc-500 text-xs flex-1" numberOfLines={1}>
                                Showing {readoutParts.length ? readoutParts.join('  ·  ') : 'all gigs'}
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
                </View>
            </View>

            {/* Mobile: the Remote sits between the search and the board, right-aligned.
                Its own zIndex + elevation lift the open overlay above the board. */}
            {!isWide && (
                <View className="px-6" style={{ zIndex: 30 }}>
                    <View className="container mx-auto max-w-7xl w-full">
                        <GigRemote filters={filtersState} onChange={updateFilters} />
                    </View>
                </View>
            )}

            {/* BOARD — pinned explicitly below the Remote overlay. */}
            <View className="w-[90%] mx-auto pb-12" style={{ zIndex: 0 }}>
                {renderBoard()}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-black overflow-hidden">
            <SafeAreaView className="flex-1" edges={['top']}>
                {isWide ? (
                    // Desktop / tablet — persistent Facet Rail + scrolling board.
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <GigFacetRail
                            filters={filtersState}
                            onChange={updateFilters}
                            resultCount={gigsData?.length}
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
                    // Mobile — search + inline Remote (right-aligned under search).
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
