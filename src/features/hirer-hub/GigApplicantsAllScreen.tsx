// src/features/hirer-hub/GigApplicantsAllScreen.tsx
//
// The "See all" full applicant list for a gig, reached from the hub's capped
// stage preview (HubApplicantsSection / HubTeamSection "See all N" row). Same
// three stage tabs + card rows as the hub, but UNCAPPED and paginated
// (client-side infinite scroll over the already-loaded useGigHubData — a cache
// hit, no re-fetch). Shares the applicant-action controller + modals with the
// hub (useGigApplicantActions / GigApplicantActionModals) so Pass / Shortlist /
// Hire / Message / Remove and the swipeable profile modal behave identically.
//
// Filter + sort (DOCS/04-design/mockups/applicant-filters-SPEC.md): a filter bar
// under the stage tabs (quick Sort · Filters sheet · removable chips · live
// "Showing N of M"). All client-side over the loaded pool via the pure
// filterAndSortApplicants core. The bar shows once a stage has 3+ applicants (or
// any filter is active). The venue city is pre-selected as the local default.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '@/stores/authStore';

import { useGigHubData, type HubStage } from './hooks/useGigHubData';
import { useGigApplicantActions } from './hooks/useGigApplicantActions';
import { GigApplicantActionModals } from './components/GigApplicantActionModals';
import { HubStageTabs } from './components/HubStageTabs';
import { HubApplicantRow } from './components/HubApplicantRow';
import { HubTeamSection } from './components/HubTeamSection';
import { ApplicantFilterBar, nextSort } from './components/ApplicantFilterBar';
import { ApplicantFilterSheet } from './components/ApplicantFilterSheet';
import { HubApplicantSearch } from './components/HubApplicantSearch';
import {
    EMPTY_FILTERS, filterAndSortApplicants, deriveFilterOptions, normalizeCityKey,
    countActiveFilters, activeFilterChips, hasAnyFilter, removeChip, setName,
    type ApplicantFilters, type ApplicantSort,
} from './utils/applicantFilters';

const COLORS = { bg: '#121216', text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', orange: '#FF6B35', sel: '#DFDBD2', selTx: '#1A1A1F' };
const PAGE = 20;

const EMPTY_LABEL: Record<HubStage, string> = {
    applied: 'No applicants in this stage yet.',
    shortlisted: 'No picks yet — shortlist applicants to line up your hires.',
    hired: 'No one hired yet.',
};

export function GigApplicantsAllScreen({ gigId, initialStage = 'applied', initialName = '' }: { gigId: string; initialStage?: HubStage; initialName?: string }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const data = useGigHubData(gigId);

    const [activeStage, setActiveStage] = useState<HubStage>(initialStage);
    // Seed the name filter from an incoming hub search (?q), so See-all opens on
    // the same matches the owner was looking at.
    const [filters, setFilters] = useState<ApplicantFilters>(
        initialName ? { ...EMPTY_FILTERS, name: initialName } : EMPTY_FILTERS,
    );
    const [sort, setSort] = useState<ApplicantSort>('recency');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE);
    const actions = useGigApplicantActions(gigId, data.gig, data);
    const currentUserId = useAuthStore((s) => s.user?._id);

    // Reversible Pass (mirrors HubApplicantsSection): keep a passed card visible
    // + dimmed with Undo for the session.
    const [passedById, setPassedById] = useState<Record<string, any>>({});

    const switchStage = useCallback((s: HubStage) => {
        setActiveStage(s);
        setVisibleCount(PAGE);
        setPassedById({}); // Undo is per-stage; don't leak a passed card across stages
    }, []);

    const venueCity = data.gig?.location?.city as string | undefined;

    // The UNFILTERED list for the active stage (hired = the cast). Filtering +
    // sorting happen on top of this; the bar gate and "of M" total read it.
    const base = useMemo<any[]>(() => {
        if (activeStage === 'hired') return (data.teamRows ?? []).map((r: any) => r.application);
        return (activeStage === 'shortlisted' ? data.shortlistedApplicants : data.appliedApplicants) ?? [];
    }, [activeStage, data.appliedApplicants, data.shortlistedApplicants, data.teamRows]);

    // Gig's own styles (if any) float to the front of the Styles options.
    const gigStyles = useMemo<string[]>(() => {
        const g: any = data.gig;
        const arr = g?.styles ?? g?.specialities ?? [];
        return Array.isArray(arr) ? arr : [];
    }, [data.gig]);

    // Cities / Styles / Experience options + counts, derived from the pool.
    const options = useMemo(() => deriveFilterOptions(base, { gigStyles }), [base, gigStyles]);

    // Filter + sort. Hired isn't filtered (the cast renders via HubTeamSection).
    const filtered = useMemo(
        () => (activeStage === 'hired' ? base : filterAndSortApplicants(base, filters, sort, venueCity)),
        [activeStage, base, filters, sort, venueCity],
    );

    // Pre-select the venue city once the gig + pool have loaded (the "local"
    // default). Guarded: seeds at most once, only if the normalized venue city
    // actually occurs in the pool — so a deep-link open never lands empty, and a
    // user who clears it (or Clear all) keeps it cleared.
    // When arriving with an incoming name query (?q from the hub), skip the
    // venue-city auto-select — honour the search as-is, since name ∩ city would
    // silently hide matches from other cities.
    const seededRef = useRef<boolean>(!!initialName);
    useEffect(() => {
        if (seededRef.current || !data.gig) return;
        const vk = normalizeCityKey(venueCity);
        if (!vk) { seededRef.current = true; return; }
        if (options.cities.length === 0) return; // pool not ready yet — wait
        if (options.cities.some((c) => c.value === vk)) setFilters((f) => ({ ...f, cities: [vk] }));
        seededRef.current = true;
    }, [data.gig, venueCity, options.cities]);

    // Reset paging when the filter or sort changes (the window no longer maps).
    useEffect(() => { setVisibleCount(PAGE); }, [filters, sort]);

    const active = useMemo(() => filtered.filter((a: any) => !passedById[a._id]), [filtered, passedById]);
    const passedList = useMemo(() => Object.values(passedById), [passedById]);
    // Passed cards stay pinned (dimmed, with Undo) regardless of the filter, so a
    // Pass is reversible however the list is filtered/paged.
    const displayed = useMemo(() => [...active, ...passedList], [active, passedList]);
    const visible = useMemo(() => [...active.slice(0, visibleCount), ...passedList], [active, visibleCount, passedList]);
    const onEndReached = () => { if (visibleCount < active.length) setVisibleCount((c) => c + PAGE); };

    const handlePass = (id: string) => {
        const app = base.find((a: any) => a._id === id); // unfiltered lookup — survives filter changes
        if (app) setPassedById((p) => ({ ...p, [id]: app }));
        actions.handleQuickReject(id);
    };
    const handleUndo = (id: string) => {
        setPassedById((p) => { const n = { ...p }; delete n[id]; return n; });
        actions.handleUndoPass(id);
    };

    // Tap a card → profile modal over the FULL filtered stage list (swipe through).
    const onTapRow = (id: string) => actions.openProfileModal(displayed, id);

    if (data.isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.orange} />
            </View>
        );
    }
    if (data.error || !data.gig) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: COLORS.text1 }}>Couldn't load applicants.</Text>
            </View>
        );
    }
    const gig = data.gig;
    // Owner-only surface (the server also 403s non-owners on the applications
    // endpoint). Bounce anyone else back to the public gig page.
    const organizerId = typeof gig.organizerId === 'object' ? gig.organizerId?._id : gig.organizerId;
    const isOwner = !!currentUserId && !!organizerId && String(currentUserId) === String(organizerId);
    if (!isOwner) return <Redirect href={`/(app)/gigs/${gigId}` as any} />;

    const lsecLabel =
        activeStage === 'hired' ? `The cast · ${base.length}`
            : activeStage === 'shortlisted' ? `Your picks · ${base.length}`
                : `New applicants · ${base.length}`;

    // The filter bar surfaces once a stage is crowded (3+), or whenever a filter
    // is active (so it never vanishes mid-filter and strand the owner) — gated on
    // the UNFILTERED count. Hired (the cast) stays simple.
    const showFilterBar = activeStage !== 'hired' && (base.length >= 3 || hasAnyFilter(filters));
    // Name is now a visible field (not a sheet filter), so Filters' badge + chips
    // count only the structured facets; `facetCount` is the non-name active count.
    const nameQ = filters.name.trim();
    const facetCount = countActiveFilters(filters) - (nameQ ? 1 : 0);

    // Name-aware zero-result state. On See-all the venue city is pre-selected, so
    // a name matching only out-of-town applicants returns nothing under the AND
    // combine (the hub has no city default, so it would find them). Offer to drop
    // the facets while KEEPING the name. Order: name+facets → name-only → facets.
    const emptyCopy: { msg: string; label: string | null; onPress: () => void } =
        nameQ && facetCount > 0
            ? { msg: `No applicants match “${nameQ}” within your filters.`, label: 'Clear filters, keep name', onPress: () => setFilters((f) => ({ ...EMPTY_FILTERS, name: f.name })) }
            : nameQ
                ? { msg: `No applicants match “${nameQ}”.`, label: 'Clear search', onPress: () => setFilters((f) => setName(f, '')) }
                : facetCount > 0
                    ? { msg: 'No applicants match these filters.', label: 'Clear filters', onPress: () => setFilters(EMPTY_FILTERS) }
                    : { msg: EMPTY_LABEL[activeStage], label: null, onPress: () => {} };

    const header = (
        <View>
            <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace(`/(app)/gigs/${gigId}` as any))} accessibilityLabel="Back" hitSlop={12}>
                    <ChevronLeft size={22} color={COLORS.text1} />
                </TouchableOpacity>
                <Text style={{ flex: 1, fontFamily: 'Outfit-Bold', fontSize: 17, color: COLORS.text0 }} numberOfLines={1}>
                    All applicants
                </Text>
            </View>
            <HubStageTabs counts={data.stageCounts} activeStage={activeStage} onSelectStage={switchStage} marginHorizontal={20} marginTop={14} />
            {showFilterBar ? (
                <>
                    {/* Visible name search, under the stage tabs — the same control
                        as the hub. Bound to filters.name; the sheet holds only the
                        structured facets (Cities / Styles / Experience / Quality). */}
                    <HubApplicantSearch
                        value={filters.name}
                        onChangeText={(t) => setFilters((f) => setName(f, t))}
                        onClear={() => setFilters((f) => setName(f, ''))}
                        marginHorizontal={20}
                        marginTop={14}
                    />
                    <ApplicantFilterBar
                        sort={sort}
                        activeCount={facetCount}
                        chips={activeFilterChips(filters).filter((c) => c.kind !== 'name')}
                        shown={filtered.length}
                        total={base.length}
                        onCycleSort={() => setSort((x) => nextSort(x))}
                        onOpenSheet={() => setSheetOpen(true)}
                        onRemoveChip={(chip) => setFilters((f) => removeChip(f, chip))}
                    />
                </>
            ) : (
                <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 2 }}>
                    <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.text2 }}>
                        {lsecLabel}
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top }}>
            {activeStage === 'hired' ? (
                <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
                    {header}
                    <HubTeamSection
                        teamRows={data.teamRows}
                        slotsTotal={data.kpis.slotsTotal}
                        venueCity={gig.location?.city}
                        onTapApplicant={onTapRow}
                        onViewProfile={onTapRow}
                        pulseId={actions.pulseId ?? undefined}
                        onShare={actions.handleShareApplicant}
                        onMessage={actions.handleMessageApplicant}
                        onRemove={actions.handleRemoveHire}
                        onFillSlot={() => switchStage('shortlisted')}
                    />
                </ScrollView>
            ) : (
                <FlatList
                    data={visible}
                    keyExtractor={(a) => a._id}
                    ListHeaderComponent={header}
                    renderItem={({ item }) => (
                        <View style={{ paddingHorizontal: 24 }}>
                            <HubApplicantRow
                                application={item}
                                venueCity={gig.location?.city}
                                isPassed={!!passedById[item._id]}
                                pulse={item._id === actions.pulseId}
                                onTap={onTapRow}
                                onViewProfile={onTapRow}
                                onPass={handlePass}
                                onUndoPass={handleUndo}
                                onShortlist={actions.handleQuickShortlist}
                                onHire={actions.handleQuickHire}
                                onMessage={actions.handleMessageApplicant}
                                onShare={actions.handleShareApplicant}
                            />
                        </View>
                    )}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.6}
                    // Keep the search field's keyboard up when tapping a result row.
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={{ paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center', gap: 14 }}>
                            <Text style={{ color: COLORS.text2, fontSize: 13, textAlign: 'center' }}>
                                {emptyCopy.msg}
                            </Text>
                            {emptyCopy.label ? (
                                <TouchableOpacity
                                    onPress={emptyCopy.onPress}
                                    accessibilityLabel={emptyCopy.label}
                                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: COLORS.sel }}
                                >
                                    <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 12.5, color: COLORS.selTx }}>{emptyCopy.label}</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    }
                    ListFooterComponent={
                        visibleCount < active.length
                            ? <ActivityIndicator color={COLORS.orange} style={{ marginVertical: 20 }} />
                            : <View style={{ height: insets.bottom + 40 }} />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            <GigApplicantActionModals actions={actions} gig={gig} data={data} />

            <ApplicantFilterSheet
                visible={sheetOpen}
                onClose={() => setSheetOpen(false)}
                filters={filters}
                onChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                options={options}
                resultCount={filtered.length}
                // "Clear all" resets the sheet's facets but keeps the name — the
                // visible search field owns the name now (its own × clears it).
                onClear={() => setFilters((f) => ({ ...EMPTY_FILTERS, name: f.name }))}
            />
        </View>
    );
}

export default GigApplicantsAllScreen;
