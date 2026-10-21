// app/(app)/gigs/index.tsx — the gig board, A·Minimal
// (DOCS/04-design/mockups/gig-board-aminimal.html). One board, two lenses:
//   • Roles   — flat list of compact gig cards
//   • Casting — wellfound-style, grouped by poster
// Both lenses are client-side transforms over the SAME gigsData; search, craft
// tabs, board sort, and the filter sheet all shape that one list. The data path
// (useGigs → search vs plain list) and the filter wiring (gigFilterOptions
// helpers + FilterState) are unchanged from the previous board.

import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    Pressable,
    TextInput,
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useGigs, useGig } from '@/hooks/useGigs';
import { useDebounce } from '@/hooks/useDebounce';
import { GigDetails } from '@/components/gigs/GigDetails';
import AppScrollView from '@/components/AppScrollView';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import { GigFilterModal } from '@/components/gigs/GigFilterModal';
import {
    ARTIST_OPTIONS,
    artistValues,
    setArtist,
    patchSection,
    countGigFacets,
    emptyGigFilters,
    sortValue,
    setSort,
} from '@/components/gigs/discovery/gigFilterOptions';
import { FilterState } from '@/types/filters';
import { SegTabs } from '@/components/dashboard/artist/home/ui';
import { C, F, INK } from '@/components/gigs/board/theme';
import { GigBoardCard } from '@/components/gigs/board/GigBoardCard';
import { CasterCard } from '@/components/gigs/board/CasterCard';
import { BoardSortMenu } from '@/components/gigs/board/BoardSortMenu';
import { MoreFiltersPill } from '@/components/gigs/board/MoreFiltersPill';
import { buildCasterGroups, distinctCraftOptions } from '@/components/gigs/board/casterGroups';

type Lens = 'roles' | 'casting';

// Fetch full gig details (incl. viewerContext) for the desktop preview pane.
const DesktopGigPreview = ({ gigId, placeholderData }: { gigId: string; placeholderData: any }) => {
    const { data: fullGig, isLoading } = useGig(gigId);
    const gigToRender = fullGig || placeholderData;
    if (isLoading && !gigToRender) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={C.orange} />
            </View>
        );
    }
    return <GigDetails gig={gigToRender} />;
};

export default function GigsListPage() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const tabBarHeight = useMobileTabBarHeight();

    const isSm = width < 768;
    const isDesktopLayout = width >= 1024;

    // Single source of truth for gig search (unchanged data path).
    const [searchState, setSearchState] = useState<{ q: string; filters: FilterState | null; page: number }>({
        q: '',
        filters: null,
        page: 1,
    });

    const [lens, setLens] = useState<Lens>('roles');
    const [selectedGig, setSelectedGig] = useState<any>(null);
    const [isPageReady, setIsPageReady] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    const [inputQuery, setInputQuery] = useState('');
    const debouncedQuery = useDebounce(inputQuery, 500);

    React.useEffect(() => {
        setSearchState((prev) => ({ ...prev, q: debouncedQuery.trim(), page: 1 }));
    }, [debouncedQuery]);

    const { data: gigsData, isLoading, error, isFetching } = useGigs({
        q: searchState.q,
        filters: searchState.filters || undefined,
        page: searchState.page,
        pageSize: 20,
    });

    React.useEffect(() => {
        if (!isLoading && !isPageReady && (gigsData || error)) {
            const timer = setTimeout(() => setIsPageReady(true), 100);
            return () => clearTimeout(timer);
        }
    }, [isLoading, gigsData, error]);

    // Filter surfaces read/write a non-null FilterState; searchState.filters stays
    // null-until-touched so useGigs keeps hitting the plain list until a filter is set.
    const filtersState = searchState.filters ?? emptyGigFilters();

    const updateFilters = useCallback((next: FilterState) => {
        setSearchState((prev) => ({ ...prev, filters: next, page: 1 }));
    }, []);
    const handleApplyFilters = useCallback((next: FilterState | null) => {
        setSearchState((prev) => ({ ...prev, filters: next ?? emptyGigFilters(), page: 1 }));
    }, []);

    const facetCount = countGigFacets(filtersState);
    const activeArtists = artistValues(filtersState);
    const sortV = sortValue(filtersState);
    const onSelectSort = useCallback(
        (v: string) => handleApplyFilters(setSort(filtersState, v)),
        [filtersState, handleApplyFilters]
    );

    // Lens derivations — pure transforms over the already-fetched list.
    const craftOptions = useMemo(() => distinctCraftOptions(gigsData || []), [gigsData]);
    const casterGroups = useMemo(
        () => (lens === 'casting' ? buildCasterGroups(gigsData || []) : []),
        [lens, gigsData]
    );

    React.useEffect(() => {
        if (isDesktopLayout && gigsData && gigsData.length > 0 && !selectedGig) {
            setSelectedGig(gigsData[0]);
        }
    }, [gigsData, isDesktopLayout]);

    const handleGigPress = (gig: any) => {
        if (isDesktopLayout) setSelectedGig(gig);
        else router.push(`/gigs/${gig._id}`);
    };

    if (!isPageReady) return <AppLoadingScreen />;

    const total = gigsData?.length ?? 0;
    const casters = casterGroups.length;

    /* ------------------------------ board content ------------------------------ */
    const renderBoardInner = () => {
        if (isLoading && isPageReady) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={C.orange} />
                    <Text style={styles.centerSub}>Updating…</Text>
                </View>
            );
        }
        if (error) {
            return (
                <View style={styles.center}>
                    <Text style={styles.centerTitle}>Couldn't load gigs</Text>
                    <Text style={styles.centerSub}>Check your connection and try again.</Text>
                </View>
            );
        }
        if (!gigsData || gigsData.length === 0) {
            return (
                <View style={styles.center}>
                    <Text style={styles.centerTitle}>No roles yet</Text>
                    <Text style={styles.centerSub}>Check back soon for new opportunities.</Text>
                </View>
            );
        }
        if (lens === 'roles') {
            return (
                <>
                    {gigsData.map((gig: any) => (
                        <GigBoardCard
                            key={gig._id}
                            gig={gig}
                            onPress={() => handleGigPress(gig)}
                            isSelected={isDesktopLayout && selectedGig?._id === gig._id}
                        />
                    ))}
                </>
            );
        }
        return (
            <>
                {casterGroups.map((grp) => (
                    <CasterCard
                        key={grp.id}
                        group={grp}
                        onPressRole={(g) => handleGigPress(g)}
                        onPressCaster={
                            grp.organizerId ? () => router.push(`/profile/${grp.organizerId}`) : undefined
                        }
                    />
                ))}
            </>
        );
    };

    /* ------------------------------ main ------------------------------ */
    const renderMain = () => (
        <View style={styles.page}>
            <View style={[styles.wrap, isDesktopLayout && styles.wrapDesktop]}>
                <View style={[styles.col, isDesktopLayout ? styles.colDesktop : styles.colMobile]}>
                    {/* Editorial header */}
                    <View style={styles.header}>
                        <Text style={styles.eyebrow}>DISCOVER · GIGS</Text>
                        <Text style={styles.title}>The gig board</Text>
                        <Text style={styles.sub}>Roles open to you right now.</Text>
                    </View>

                    {/* Roles / Casting lenses */}
                    <SegTabs<Lens>
                        value={lens}
                        options={[
                            { key: 'roles', label: 'Roles' },
                            { key: 'casting', label: 'Casting' },
                        ]}
                        onChange={setLens}
                    />

                    {/* Toolbar: search + sort */}
                    <View style={styles.toolbar}>
                        <View style={styles.search}>
                            <Search size={18} color={isFetching ? C.orange : C.t3} />
                            <TextInput
                                value={inputQuery}
                                onChangeText={setInputQuery}
                                placeholder="Search roles, skills…"
                                placeholderTextColor={C.t3}
                                style={styles.searchInput}
                                returnKeyType="search"
                            />
                            {isFetching && inputQuery ? <ActivityIndicator size="small" color={C.orange} /> : null}
                        </View>
                        <BoardSortMenu value={sortV} onSelect={onSelectSort} />
                    </View>

                    {/* Craft tabs + pinned More-filters pill */}
                    <View style={styles.craftRow}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                            style={{ flex: 1 }}
                        >
                            {[{ value: 'all', label: 'All' }, ...ARTIST_OPTIONS].map((o) => {
                                const isActive =
                                    o.value === 'all' ? activeArtists.length === 0 : activeArtists.includes(o.value);
                                return (
                                    <Pressable
                                        key={o.value}
                                        onPress={() =>
                                            updateFilters(
                                                o.value === 'all'
                                                    ? patchSection(filtersState, 'artistType', { artistTypes: [] })
                                                    : setArtist(filtersState, o.value)
                                            )
                                        }
                                        style={[styles.craft, isActive && styles.craftOn]}
                                    >
                                        <Text style={[styles.craftTxt, isActive && styles.craftTxtOn]}>{o.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                        <MoreFiltersPill count={facetCount} onPress={() => setShowFilterModal(true)} />
                    </View>

                    {/* Count row */}
                    <View style={styles.countRow}>
                        <Text style={styles.count}>
                            <Text style={styles.countB}>{total}</Text>
                            {` ${total === 1 ? 'ROLE' : 'ROLES'} · ${
                                lens === 'casting'
                                    ? `FROM ${casters} ${casters === 1 ? 'CASTER' : 'CASTERS'}`
                                    : 'FOUND'
                            }`}
                        </Text>
                        <View style={styles.live}>
                            {isFetching ? (
                                <ActivityIndicator size="small" color={C.green} />
                            ) : (
                                <>
                                    <View style={styles.dot} />
                                    <Text style={styles.liveTxt}>LIVE</Text>
                                </>
                            )}
                        </View>
                    </View>

                    <View style={{ marginTop: 8 }}>{renderBoardInner()}</View>
                </View>

                {/* Desktop master-detail preview */}
                {isDesktopLayout && selectedGig ? (
                    <View style={styles.detail}>
                        <View style={styles.detailInner}>
                            <DesktopGigPreview gigId={selectedGig._id} placeholderData={selectedGig} />
                        </View>
                    </View>
                ) : null}
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: C.canvas }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <AppScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: isSm ? tabBarHeight + 24 : 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {renderMain()}
                </AppScrollView>

                <GigFilterModal
                    visible={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    filters={filtersState}
                    onApplyFilters={handleApplyFilters}
                    craftOptions={craftOptions}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    page: { paddingHorizontal: 20, paddingTop: 10 },
    wrap: { width: '100%' },
    wrapDesktop: { flexDirection: 'row', gap: 24, justifyContent: 'center', alignItems: 'flex-start' },
    col: { width: '100%' },
    colMobile: { maxWidth: 600, alignSelf: 'center' },
    colDesktop: { width: 400 },
    detail: { flex: 1, maxWidth: 820 },
    detailInner: {
        borderWidth: 1,
        borderColor: C.hair,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: C.canvas,
        minHeight: 600,
    },

    header: { paddingTop: 18, marginBottom: 12 },
    eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: C.t3 },
    title: { fontFamily: F.serif, fontSize: 26, letterSpacing: -0.4, color: C.cream, marginTop: 7 },
    sub: { fontFamily: F.body, fontSize: 12.5, color: C.t2, marginTop: 6, lineHeight: 19 },

    toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
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

    craftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
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

    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        marginBottom: 4,
    },
    count: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.6, color: C.t3 },
    countB: { color: C.t1, fontFamily: F.bold },
    live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
    liveTxt: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.4, color: C.green },

    center: { paddingVertical: 60, alignItems: 'center', gap: 8 },
    centerTitle: { fontFamily: F.serif, fontSize: 18, color: C.cream },
    centerSub: { fontFamily: F.body, fontSize: 13, color: C.t2, textAlign: 'center' },
});
