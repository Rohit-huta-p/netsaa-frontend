// src/features/hirer-hub/GigApplicantsAllScreen.tsx
//
// The "See all" full applicant list for a gig, reached from the hub's capped
// stage preview (HubApplicantsSection / HubTeamSection "See all N" row). Same
// three stage tabs + card rows as the hub, but UNCAPPED and paginated
// (client-side infinite scroll over the already-loaded useGigHubData — a cache
// hit, no re-fetch). Shares the applicant-action controller + modals with the
// hub (useGigApplicantActions / GigApplicantActionModals) so Pass / Shortlist /
// Hire / Message / Remove and the swipeable profile modal behave identically.

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '@/stores/authStore';

import { useGigHubData, type HubStage } from './hooks/useGigHubData';
import { useGigApplicantActions } from './hooks/useGigApplicantActions';
import { GigApplicantActionModals } from './components/GigApplicantActionModals';
import { HubStageTabs } from './components/HubStageTabs';
import { HubApplicantRow } from './components/HubApplicantRow';
import { HubTeamSection } from './components/HubTeamSection';

const COLORS = { bg: '#121216', text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', orange: '#FF6B35', orangeTint: '#FFCBB2' };
const PAGE = 20;

type SortKey = 'rating' | 'recent';
const ratingOf = (a: any) => (typeof a?.artistSnapshot?.rating === 'number' && a.artistSnapshot.rating > 0 ? a.artistSnapshot.rating : -1);
const timeOf = (a: any) => { const t = new Date(a?.appliedAt ?? 0).getTime(); return Number.isFinite(t) ? t : 0; };
function sortApplicants(list: any[], key: SortKey): any[] {
    const arr = [...list];
    if (key === 'rating') arr.sort((a, b) => (ratingOf(b) - ratingOf(a)) || (timeOf(b) - timeOf(a)));
    else arr.sort((a, b) => timeOf(b) - timeOf(a));
    return arr;
}

const EMPTY_LABEL: Record<HubStage, string> = {
    applied: 'No applicants in this stage yet.',
    shortlisted: 'No picks yet — shortlist applicants to line up your hires.',
    hired: 'No one hired yet.',
};

export function GigApplicantsAllScreen({ gigId, initialStage = 'applied' }: { gigId: string; initialStage?: HubStage }) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const data = useGigHubData(gigId);

    const [activeStage, setActiveStage] = useState<HubStage>(initialStage);
    const [sortKey, setSortKey] = useState<SortKey>('rating');
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

    // The full sorted list for the active stage (hired = the cast).
    const fullList = useMemo(() => {
        if (activeStage === 'hired') return (data.teamRows ?? []).map((r: any) => r.application);
        const base = activeStage === 'shortlisted' ? data.shortlistedApplicants : data.appliedApplicants;
        return sortApplicants(base ?? [], sortKey);
    }, [activeStage, sortKey, data.appliedApplicants, data.shortlistedApplicants, data.teamRows]);

    const active = useMemo(() => fullList.filter((a: any) => !passedById[a._id]), [fullList, passedById]);
    const passedList = useMemo(() => Object.values(passedById), [passedById]);
    const displayed = useMemo(() => [...active, ...passedList], [active, passedList]);

    const handlePass = (id: string) => {
        const app = fullList.find((a: any) => a._id === id);
        if (app) setPassedById((p) => ({ ...p, [id]: app }));
        actions.handleQuickReject(id);
    };
    const handleUndo = (id: string) => {
        setPassedById((p) => { const n = { ...p }; delete n[id]; return n; });
        actions.handleUndoPass(id);
    };

    // Page the active list only; keep passed cards (dimmed, with Undo) pinned at
    // the end of the window so a Pass is reversible however far you've paged.
    const visible = useMemo(() => [...active.slice(0, visibleCount), ...passedList], [active, visibleCount, passedList]);
    const onEndReached = () => { if (visibleCount < active.length) setVisibleCount((c) => c + PAGE); };

    // Tap a card → profile modal over the FULL stage list (swipe through all).
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
        activeStage === 'hired' ? `The cast · ${fullList.length}`
        : activeStage === 'shortlisted' ? `Your picks · ${fullList.length}`
        : `New applicants · ${fullList.length}`;

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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 2 }}>
                <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.text2 }}>
                    {lsecLabel}
                </Text>
                {activeStage !== 'hired' ? (
                    <TouchableOpacity onPress={() => setSortKey((k) => (k === 'rating' ? 'recent' : 'rating'))} accessibilityLabel={`Sort by ${sortKey}`} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 0.6, color: COLORS.orangeTint }}>SORT</Text>
                        <ChevronDown size={11} color={COLORS.orangeTint} strokeWidth={2.2} />
                        <Text style={{ fontFamily: 'SpaceMono-Bold', fontSize: 9, letterSpacing: 0.6, color: COLORS.orangeTint }}>{sortKey === 'rating' ? 'RATING' : 'RECENT'}</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
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
                    ListEmptyComponent={
                        <Text style={{ color: COLORS.text2, fontSize: 13, textAlign: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
                            {EMPTY_LABEL[activeStage]}
                        </Text>
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
        </View>
    );
}

export default GigApplicantsAllScreen;
