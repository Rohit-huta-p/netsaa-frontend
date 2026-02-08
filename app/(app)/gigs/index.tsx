import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Filter, TrendingUp, Sparkles } from 'lucide-react-native';
import { SequentialLoadingAnimation } from '@/components/ui/SequentialLoadingAnimation';
import { useGigs, useGig } from '@/hooks/useGigs';
import { useDebounce } from '@/hooks/useDebounce';
import { GigCard } from '@/components/gigs/GigCard';
import { GigDetails } from '@/components/gigs/GigDetails';
import { BackgroundElements } from '@/components/ui/BackgroundElements';
import AppScrollView from '@/components/AppScrollView';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { FilterModal } from '@/components/gigs/FilterModal';
import { FilterState } from '@/types/filters';
import { countActiveFilters } from '@/lib/constants/filters';

const isWeb = Platform.OS === 'web';

// Wrapper component to fetch full gig details (including viewerContext) on desktop
const DesktopGigPreview = ({ gigId, placeholderData }: { gigId: string, placeholderData: any }) => {
    const { data: fullGig, isLoading } = useGig(gigId);

    // Use full details if available, otherwise fall back to list data (placeholder)
    // We prioritize fullGig because it has viewerContext.hasApplied
    const gigToRender = fullGig || placeholderData;

    if (isLoading && !gigToRender) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    return <GigDetails gig={gigToRender} />;
};

export default function GigsListPage() {
    const router = useRouter();
    const { width } = useWindowDimensions();
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
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Local input state for controlled TextInput (before debounce)
    const [inputQuery, setInputQuery] = useState('');

    // Debounce the input query and update searchState
    const debouncedQuery = useDebounce(inputQuery, 500);

    // Update searchState.q when debounced query changes
    React.useEffect(() => {
        setSearchState((prev) => ({
            ...prev,
            q: debouncedQuery.trim(),
            page: 1, // Reset to page 1 on new search
        }));
    }, [debouncedQuery]);

    // Determine if we should show side-by-side layout (desktop only)
    const isDesktopLayout = width >= 1024;

    // Pass searchState directly to useGigs
    const { data: gigsData, isLoading, error, isFetching } = useGigs({
        q: searchState.q,
        filters: searchState.filters || undefined,
        page: searchState.page,
        pageSize: 20,
    });

    const activeFilterCount = searchState.filters ? countActiveFilters(searchState.filters) : 0;

    React.useEffect(() => {
        // Only auto-select on desktop layout
        if (isDesktopLayout && gigsData && gigsData.length > 0 && !selectedGig) {
            setSelectedGig(gigsData[0]);
        }
    }, [gigsData, isDesktopLayout]);

    const handleGigPress = (gig: any) => {
        // Navigate to detail page on mobile, tablets, and small screens
        // Show side-by-side only on desktop (>= 1024px)
        if (isDesktopLayout) {
            setSelectedGig(gig);
        } else {
            router.push(`/gigs/${gig._id}`);
        }
    };

    const handleApplyFilters = useCallback((newFilters: FilterState) => {
        setSearchState((prev) => ({
            ...prev,
            filters: newFilters,
            page: 1, // Reset to page 1 on filter change
        }));
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
            {/* <BackgroundElements /> */}
            <AppScrollView className="flex-1">
                {/* HERO SECTION - COMPACT */}
                <View className="pt-32 pb-12 px-6 border-b border-white/5">
                    <View className="container mx-auto max-w-7xl">
                        <View className="flex-row items-end justify-between mb-10">
                            <View className="flex-1 max-w-2xl">
                                <Text className="text-4xl md:text-6xl font-black tracking-tighter mb-6 text-white">
                                    THE GIG BOARD.
                                </Text>
                                <Text className="text-xl text-zinc-500 font-light">
                                    Explore hand-picked professional opportunities in your city.
                                </Text>
                            </View>
                        </View>

                        {/* SEARCH & FILTERS */}
                        <View className="flex-col md:flex-row gap-4 w-full">
                            {/* Search */}
                            <View className="relative flex-1 lg:w-80">
                                <View className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
                                    <Search size={20} color={isFetching ? "#8B5CF6" : "rgba(255, 255, 255, 0.4)"} />
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
                                {/* Search indicator */}
                                {isFetching && inputQuery && (
                                    <View className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <ActivityIndicator size="small" color="#8B5CF6" />
                                    </View>
                                )}
                            </View>

                            {/* Filter Button */}
                            <TouchableOpacity
                                onPress={() => setShowFilterModal(true)}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(255, 255, 255, 0.08)',
                                    height: 56,
                                    paddingHorizontal: 24,
                                    borderRadius: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                <Filter size={20} color="#FFFFFF" />
                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '500' }}>
                                    Filters
                                </Text>
                                {activeFilterCount > 0 && (
                                    <View style={{
                                        backgroundColor: '#8B5CF6',
                                        borderRadius: 12,
                                        width: 24,
                                        height: 24,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                                            {activeFilterCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* BOARD SECTION */}
                <View className="w-[90%] mx-auto py-12  ">
                    <View className="flex-1">
                        {isLoading ? (
                            <View className="flex-1 justify-center items-center py-20">
                                <LoadingAnimation
                                    source="https://lottie.host/ecebcd4d-d1c9-4e57-915f-d3f61705a717/VFWGhqMAX0.lottie"
                                    width={300}
                                    height={300}
                                />
                                {/* // {
                                //     source: "https://lottie.host/feea2e9b-b1c6-492f-bfa3-95feca9f20a0/1NoVsp8rDk.lottie",
                                //     width: 200,
                                //     height: 200,
                                // }, */}
                                <Text className="text-zinc-500 mt-4 text-xs font-medium">
                                    Loading opportunities...
                                </Text>
                            </View>
                        ) : error ? (
                            <View className="flex-1 justify-center items-center py-20 px-8">
                                <View className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-red-500/10">
                                    <Sparkles size={32} color="#EF4444" />
                                </View>
                                <Text className="text-white font-bold text-xl text-center mb-2">Oops!</Text>
                                <Text className="text-zinc-400 text-center">
                                    Unable to load gigs. Please check your connection.
                                </Text>
                            </View>
                        ) : !gigsData || gigsData.length === 0 ? (
                            <View className="flex-1 justify-center items-center py-20 px-8">
                                <View className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-zinc-800/50">
                                    <Sparkles size={32} color="#71717A" />
                                </View>
                                <Text className="text-white font-bold text-xl text-center mb-2">No Gigs Yet</Text>
                                <Text className="text-zinc-400 text-center">
                                    Check back soon for new opportunities.
                                </Text>
                            </View>
                        ) : (
                            <View className="grid grid-cols-1 lg:grid-cols-8 gap-12">
                                {/* LIST VIEW */}
                                <View className="col-span-2">
                                    <View className="flex-row items-center justify-between px-2 mb-4">
                                        <Text className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.3em]">
                                            {gigsData.length} {gigsData.length === 1 ? 'result' : 'results'}
                                            {(searchState.q || activeFilterCount > 0) && ' found'}
                                        </Text>
                                        <View className="flex-row items-center gap-1">
                                            {isFetching ? (
                                                <ActivityIndicator size="small" color="#3B82F6" />
                                            ) : (
                                                <>
                                                    <TrendingUp size={12} color="#3B82F6" />
                                                    <Text className="text-blue-400 text-[10px] font-black uppercase">
                                                        Live Feed
                                                    </Text>
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
                                            <>
                                                <GigCard
                                                    key={gig._id}
                                                    gig={gig}
                                                    onPress={() => handleGigPress(gig)}
                                                    isSelected={isDesktopLayout && selectedGig?._id === gig._id}
                                                />
                                            </>
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
                        )}
                    </View>
                </View>

                {/* Filter Modal */}
                <FilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    filters={searchState.filters || {
                        quick: null,
                        advanced: {
                            trust: {},
                            compensation: {},
                            artistType: {},
                            experience: {},
                            location: {},
                            timing: {},
                            eventType: {},
                            requirements: {},
                            sorting: { sortBy: 'relevance' },
                        },
                    }}
                    onApplyFilters={handleApplyFilters}
                    activeFilterCount={activeFilterCount}
                />
            </AppScrollView>
        </View>
    );
}