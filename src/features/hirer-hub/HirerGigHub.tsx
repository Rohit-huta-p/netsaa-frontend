// src/features/hirer-hub/HirerGigHub.tsx
//
// Hirer-side single-scroll project hub. Replaces the tab-based gig detail
// when the current user is the gig owner. Public artist view of /gigs/[id]
// stays untouched in app/(app)/gigs/[id].tsx.
//
// Overview + pipeline follow DOCS/04-design/mockups/applicant-card-D.html
// (screens 1–3): a compact gig header, three tappable stage tabs (Applied /
// Shortlisted / Hired) that swap the body, a slot bar, and the card-D rows.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, useWindowDimensions, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useGigHubData, type HubStage } from './hooks/useGigHubData';
import { computeStickyCTA } from './utils/computeStickyCTA';
import { useUpdateGig } from '@/hooks/useGigs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HubOverview } from './components/HubOverview';
import type { HubTopTab } from './components/HubTopTabs';
import { useDiscussionBadge } from './hooks/useDiscussionBadge';
import { useGigApplicantActions } from './hooks/useGigApplicantActions';
import { GigApplicantActionModals } from './components/GigApplicantActionModals';
import { HubTeamSection } from './components/HubTeamSection';
// CONTRACTS-DISABLED: HubBookingTermsCard hidden until contract artifact is restored.
// import { HubBookingTermsCard } from './components/HubBookingTermsCard';
import { HubApplicantsSection } from './components/HubApplicantsSection';
import { HubApplicantSearch } from './components/HubApplicantSearch';
import { HubEssentials } from './components/HubEssentials';
import { HubStickyCTA } from './components/HubStickyCTA';
import { GigActionsSheet } from './components/GigActionsSheet';
import { matchesFilters, EMPTY_FILTERS } from './utils/applicantFilters';

// Show at most this many cards per stage on the hub; the rest live behind
// "See all" (GigApplicantsAllScreen, a paginated full list).
const PREVIEW_LIMIT = 5;
// While a search query is active the 5-card cap is lifted to this, so name
// matches beyond the preview surface in place. Overflow past this still routes
// to "See all" (which receives the query via ?q=).
const SEARCH_CAP = 25;
// Discussion section — backed by GigComment model. Same component used on
// Event detail screens. Pulls socket (live updates) + gigService for the
// REST round-trip. No gating beyond auth: anyone signed in can read/post.
import DiscussionTab from '@/components/common/DiscussionTab';

// A·Minimal canvas (#121216) — matches gig detail / artist home / apply modal
// and the applicant-card-D.html --canvas. Cards lift off it (see HubApplicantRow
// / HubOverview surfaces) rather than camouflaging.
const COLORS = { bg: '#121216', line: 'rgba(255,255,255,0.05)' };

type SortKey = 'rating' | 'recent';

const ratingOf = (a: any) =>
    typeof a?.artistSnapshot?.rating === 'number' && a.artistSnapshot.rating > 0 ? a.artistSnapshot.rating : -1;
const timeOf = (a: any) => {
    const t = new Date(a?.appliedAt ?? 0).getTime();
    return Number.isFinite(t) ? t : 0;
};
// Sort a stage list by the active key. Rating falls back to recency on ties so
// the "New" (unrated) applicants keep a stable, most-recent-first order.
function sortApplicants(list: any[], key: SortKey): any[] {
    const arr = [...list];
    if (key === 'rating') arr.sort((a, b) => (ratingOf(b) - ratingOf(a)) || (timeOf(b) - timeOf(a)));
    else arr.sort((a, b) => timeOf(b) - timeOf(a));
    return arr;
}

// Pluralised craft noun, e.g. "Dancers" (artistTypes[0]), else "performers".
function craftLabel(gig: any): string {
    const d: string | undefined = gig?.artistTypes?.[0];
    return d ? (/s$/i.test(d) ? d : `${d}s`) : 'performers';
}
// "4 Dancers · The Westin, Pune" — headcount + craft + venue line for the ghead.
function composeMetaLine(gig: any): string {
    const headcount = gig?.headcount ?? gig?.maxApplications;
    const venueLine = [gig?.location?.venueName, gig?.location?.city].filter(Boolean).join(', ');
    return [headcount ? `${headcount} ${craftLabel(gig)}` : null, venueLine || null].filter(Boolean).join(' · ');
}

type Props = {
    gigId: string;
};

export function HirerGigHub({ gigId }: Props) {
    const router = useRouter();
    const data = useGigHubData(gigId);
    const scrollRef = useRef<ScrollView>(null);
    const overviewYRef = useRef<number>(0);
    // Y of the Applicants pane within the page scroll — used to lift the search
    // field clear of the keyboard on focus (native only; web has no overlay).
    const applicantsPaneYRef = useRef<number>(0);
    // Gig detail hides the global bottom nav (see HIDE_NAV_PATTERNS in
    // BottomNav), so the sticky CTA + scroll padding reserve the safe-area
    // inset at the true bottom edge — not the nav's height.
    const insets = useSafeAreaInsets();
    // The chevron header is mobile-only. On tablet/desktop the global
    // app shell (Navbar) provides navigation, so this duplicate is hidden.
    const { width } = useWindowDimensions();
    const showMobileHeader = width < 768;

    // Pipeline selection (lifted). The active stage drives which body renders;
    // sort applies to the Applied / Shortlisted lists.
    const [activeStage, setActiveStage] = useState<HubStage>('applied');
    const [sortKey, setSortKey] = useState<SortKey>('rating');
    // Inline applicant search (Applied / Shortlisted). The hub owns the query;
    // the field reaches the FULL stage list, not just the 5-card preview.
    const [query, setQuery] = useState('');
    // Clear the query on ANY stage change — the tab tap in HubOverview AND the
    // programmatic jumps (sticky CTA, Fill-slot) all flow through `activeStage`,
    // so a stale query never shows a false "no matches" in the stage you land on.
    useEffect(() => { setQuery(''); }, [activeStage]);
    const [menuOpen, setMenuOpen] = useState(false);
    // Top-level tab: 'applicants' (the pipeline) vs 'discussion' (the thread).
    const [topTab, setTopTab] = useState<HubTopTab>('applicants');

    const handleBack = () => {
        // On the web, deep-linking to /gigs/[id] yields an empty history
        // stack — router.back() silently no-ops. canGoBack() returns false
        // in that case and we fall through to the hirer home as the safe
        // parent route. Native always has a stack when reached via push().
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/dashboard/hirer-home' as any);
        }
    };

    const updateGigMutation = useUpdateGig();

    // Applicant-action controller (shared with the "See all" screen): owns the
    // profile modal, Hire/Contact/Remove sheets, reversible Pass + "just viewed"
    // pulse, and the status mutations. Rendered via <GigApplicantActionModals>.
    const actions = useGigApplicantActions(gigId, data.gig, data);
    const pulseId = actions.pulseId;

    // New-comment badge for the Discussion tab (front-end only, per device).
    // `active` is true while Discussion is open, so comments the owner is
    // viewing advance the "seen" watermark instead of badging. `onDiscussionMessages`
    // is fed by DiscussionTab's message list (initial fetch + live socket).
    const { badge: discussionBadge, onMessages: onDiscussionMessages } =
        useDiscussionBadge(gigId, topTab === 'discussion');

    const sticky = useMemo(
        () => computeStickyCTA({
            pendingApplicantsCount: data.pendingApplicantsCount,
            urgentTeamRowCount: data.urgentTeamRowCount,
            firstUrgentLabel: data.firstUrgentLabel,
        }),
        [data.pendingApplicantsCount, data.urgentTeamRowCount, data.firstUrgentLabel]
    );

    // The card list for the active stage, sorted. Hired renders via
    // HubTeamSection (cast + open slots), not this list.
    const activeList = useMemo(() => {
        if (activeStage === 'shortlisted') return sortApplicants(data.shortlistedApplicants ?? [], sortKey);
        return sortApplicants(data.appliedApplicants ?? [], sortKey);
    }, [activeStage, sortKey, data.appliedApplicants, data.shortlistedApplicants]);

    // Apply the search on top of the sorted stage list. Name-only (case-insensitive
    // substring over displayName), reusing the See-all filter core so the hub and
    // See-all agree. Empty query → the full sorted list (behaviour unchanged).
    const trimmedQuery = query.trim();
    const visibleList = useMemo(
        () => (trimmedQuery ? activeList.filter((a) => matchesFilters(a, { ...EMPTY_FILTERS, name: trimmedQuery })) : activeList),
        [activeList, trimmedQuery],
    );
    // Search is offered only where it earns its place: a non-hired stage whose
    // pool is bigger than the preview (≤5 is already fully visible). It stays
    // mounted while a query is active so the field never vanishes mid-search.
    const showSearch = activeStage !== 'hired' && (activeList.length > PREVIEW_LIMIT || trimmedQuery.length > 0);

    // Commenter User id → their application, so the Discussion thread can show
    // an Applied/Shortlisted/Hired chip on askers who are in the pipeline and
    // tap through to their card. Built from every application (all statuses);
    // artistId may be populated (object) or a raw id.
    const applicantsByUserId = useMemo(() => {
        const map: Record<string, { applicationId: string; status: string }> = {};
        for (const a of (data.applications ?? [])) {
            const uid = typeof a.artistId === 'object' ? a.artistId?._id : a.artistId;
            if (uid) map[String(uid)] = { applicationId: a._id, status: a.status };
        }
        return map;
    }, [data.applications]);

    if (data.isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#FF6B35" />
            </View>
        );
    }
    if (data.error || !data.gig) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#B8B1A6' }}>Couldn't load gig.</Text>
            </View>
        );
    }

    const gig = data.gig;

    const scrollToOverview = () => scrollRef.current?.scrollTo({ y: overviewYRef.current, animated: true });

    // Switch top-level tab + reset the shared scroll to the top so each tab
    // starts at its own header instead of inheriting the other's offset.
    const handleSelectTopTab = (tab: HubTopTab) => {
        setTopTab(tab);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    };

    const handleSticky = () => {
        // Both sticky intents live on the Applicants tab.
        setTopTab('applicants');
        if (sticky.intent === 'review-applicants') {
            setActiveStage('applied');
            scrollToOverview();
            return;
        }
        if (sticky.intent === 'urgent-team') {
            setActiveStage('hired');
            scrollToOverview();
            return;
        }
    };

    // Tap a card (name/avatar/body or the View-profile icon) in the applied /
    // shortlisted list → profile modal over the active stage list.
    const handleRowTap = (applicationId: string) => actions.openProfileModal(visibleList, applicationId);

    // The hired "cast" → profile modal over the hired list (Message · Remove bar).
    const openHiredProfile = (applicationId: string) =>
        actions.openProfileModal((data.teamRows ?? []).map((r: any) => r.application), applicationId);

    // "See all {stage}" → the paginated full applicant list for that stage.
    // Carry an active search into See-all's name filter so overflow past the
    // hub's SEARCH_CAP lands on the same results, not a reset list.
    const openSeeAll = (stage: HubStage) => {
        const q = stage === activeStage && trimmedQuery ? `&q=${encodeURIComponent(trimmedQuery)}` : '';
        router.push(`/(app)/gigs/${gigId}/applicants?stage=${stage}${q}` as any);
    };

    // Fill an open slot → jump to the shortlist (your picks) to hire someone;
    // fall back to the applied flood when there are no picks yet.
    const handleFillSlot = () => {
        setTopTab('applicants');
        setActiveStage((data.stageCounts?.shortlisted ?? 0) > 0 ? 'shortlisted' : 'applied');
        scrollToOverview();
    };

    const toggleSort = () => setSortKey((k) => (k === 'rating' ? 'recent' : 'rating'));

    // ⋯ "Manage gig" actions (B4). The toggles PATCH the gig via useUpdateGig,
    // which invalidates the useGig query so the overview + sheet reflect the
    // new state. Close sets status -> 'closed' (applyToGig already blocks a
    // non-published gig, so new applications stop; the pipeline is kept).
    const handleEditGig = () => {
        setMenuOpen(false);
        router.push(`/(app)/create?gigId=${gigId}` as any);
    };
    const handleShareGig = async () => {
        setMenuOpen(false);
        const link = Platform.OS === 'web' && typeof window !== 'undefined'
            ? `${window.location.origin}/gigs/${gigId}`
            : undefined;
        const message = `${gig.title} — see this gig on NETSA${link ? `: ${link}` : ''}`;
        try {
            await Share.share(link ? { message, url: link } : { message });
        } catch {
            // user dismissed the share sheet — no-op
        }
    };
    const handleTogglePause = (next: boolean) =>
        updateGigMutation.mutate({ id: gigId, payload: { applicationsPaused: next } });
    const handleToggleAutoClose = (next: boolean) =>
        updateGigMutation.mutate({ id: gigId, payload: { autoCloseWhenFilled: next } });
    const handleCloseGig = () => {
        updateGigMutation.mutate({ id: gigId, payload: { status: 'closed' } });
        setMenuOpen(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            {/* Warm glow behind the header — matched to applicant-card-D.html's
                .ghead radial (rgba(255,107,53,.07)). The mockup screen is otherwise
                flat #121216, so this stays a whisper at the very top, not an orange
                band across the upper third. */}
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150 }}>
                <LinearGradient
                    colors={['rgba(255,107,53,0.07)', 'transparent']}
                    style={{ flex: 1 }}
                />
            </View>
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                // So the first tap on a result card isn't swallowed just to
                // dismiss the search keyboard — it opens the card directly.
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                {/* Mobile-only back affordance. Desktop relies on the global
                    Navbar; the status pill + ⋯ live in the ghead below. */}
                {showMobileHeader && (
                    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 2, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={handleBack} accessibilityLabel="Back" hitSlop={12}>
                            <ChevronLeft size={22} color="#B8B1A6" />
                        </TouchableOpacity>
                    </View>
                )}

                <View onLayout={(e) => { overviewYRef.current = Math.max(0, e.nativeEvent.layout.y - 12); }}>
                    <HubOverview
                        title={gig.title}
                        statusKey={gig.status}
                        metaLine={composeMetaLine(gig)}
                        counts={data.stageCounts}
                        slotsTotal={data.kpis.slotsTotal}
                        activeStage={activeStage}
                        onSelectStage={setActiveStage}
                        sortLabel={sortKey === 'rating' ? 'RATING' : 'RECENT'}
                        onToggleSort={toggleSort}
                        // Manual refresh for the applicant list — refetches gig +
                        // applications; the header icon spins while in flight.
                        onRefresh={data.refetch}
                        refreshing={data.isRefetching}
                        // ⋯ manage-gig menu is inert until B4.
                        onMenu={() => setMenuOpen(true)}
                        topTab={topTab}
                        onSelectTopTab={handleSelectTopTab}
                        discussionBadge={discussionBadge}
                        // Essentials sits ABOVE the Applicants/Discussion tabs
                        // (shows on both tabs). The page is one continuous scroll.
                        beforeTabs={
                            <>
                                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 2 }} />
                                <HubEssentials
                                    eventDate={gig.schedule?.startDate ?? gig.startDate}
                                    schedule={gig.schedule}
                                    venue={gig.location?.venueName}
                                    city={gig.location?.city}
                                    scope={gig.description}
                                    payAmount={data.kpis.budgetAmount}
                                    daysLeft={data.kpis.daysLeft}
                                    postedDate={gig.createdAt}
                                    onEditGig={() => router.push(`/(app)/create?gigId=${gigId}` as any)}
                                />
                            </>
                        }
                    />
                </View>

                {/* Applicants pane — single continuous page scroll (no inner
                    scroll; the whole page scrolls as one, so there's never a
                    dead-end at a bounded box). Essentials moved ABOVE (into the
                    overview slot); the footer stays below. Kept mounted
                    (display-toggled) so the list's local state survives a tab switch. */}
                <View
                    onLayout={(e) => { applicantsPaneYRef.current = Math.max(0, e.nativeEvent.layout.y); }}
                    style={{
                        display: topTab === 'applicants' ? 'flex' : 'none',
                        // While searching, hold a floor so narrowing to 0–1 matches
                        // doesn't shrink the page and slide the field under the fold.
                        ...(trimmedQuery ? { minHeight: 360 } : null),
                    }}>
                    {/* Inline search — reaches the FULL stage list by name, so it
                        finds applicants beyond the 5-card preview. Shown only where
                        it earns its place (non-hired stage, pool bigger than preview). */}
                    {showSearch ? (
                        <HubApplicantSearch
                            testID="hub-applicant-search"
                            value={query}
                            onChangeText={setQuery}
                            onClear={() => setQuery('')}
                            onFocus={() => {
                                if (Platform.OS !== 'web') {
                                    scrollRef.current?.scrollTo({ y: Math.max(0, applicantsPaneYRef.current - 12), animated: true });
                                }
                            }}
                        />
                    ) : null}
                    {/* Body — the active stage's list. Hired is the cast (card D +
                        open slots); Applied / Shortlisted are the card-D flood/picks. */}
                    {activeStage === 'hired' ? (
                        <HubTeamSection
                            teamRows={data.teamRows}
                            slotsTotal={data.kpis.slotsTotal}
                            venueCity={gig.location?.city}
                            onTapApplicant={openHiredProfile}
                            onViewProfile={openHiredProfile}
                            pulseId={pulseId ?? undefined}
                            onShare={actions.handleShareApplicant}
                            onMessage={actions.handleMessageApplicant}
                            onRemove={actions.handleRemoveHire}
                            onFillSlot={handleFillSlot}
                            limit={PREVIEW_LIMIT}
                            onSeeAll={() => openSeeAll('hired')}
                        />
                    ) : (
                        <HubApplicantsSection
                            // Remount per stage so the reversible-Pass session state
                            // doesn't leak a passed Applied card into Shortlisted.
                            // Stays mounted across query changes (same key) so a
                            // passed card survives mid-search.
                            key={activeStage}
                            applicants={visibleList}
                            venueCity={gig.location?.city}
                            emptyLabel={trimmedQuery
                                ? `No applicants match "${trimmedQuery}".`
                                : activeStage === 'shortlisted'
                                    ? 'No picks yet — shortlist applicants to line up your hires.'
                                    : 'No new applicants right now.'}
                            onTapApplicant={handleRowTap}
                            onViewProfile={handleRowTap}
                            pulseId={pulseId ?? undefined}
                            onShare={actions.handleShareApplicant}
                            onPass={actions.handleQuickReject}
                            onUndoPass={actions.handleUndoPass}
                            onShortlist={actions.handleQuickShortlist}
                            onHire={actions.handleQuickHire}
                            onMessage={actions.handleMessageApplicant}
                            // While searching, lift the 5-card cap so matches beyond
                            // the preview surface here; overflow past SEARCH_CAP keeps
                            // the "See all" row (which carries the query).
                            limit={trimmedQuery ? SEARCH_CAP : PREVIEW_LIMIT}
                            onSeeAll={() => openSeeAll(activeStage)}
                        />
                    )}
                </View>

                {/* Discussion pane — open Q&A thread, in the same single page scroll.
                    Authenticated users only (backend-enforced via `protect`). Kept
                    mounted (display-toggled) so its fetch + socket stay live and feed
                    the new-comment badge even while the Applicants tab shows. ownerId
                    enables pin + delete-any owner actions (always the gig owner here);
                    the owner "waiting" nudge is hidden — the top-tab badge is the
                    single new-comment signal. */}
                <View style={{ display: topTab === 'discussion' ? 'flex' : 'none', paddingHorizontal: 16, paddingTop: 10 }}>
                    <DiscussionTab
                        id={gigId}
                        type="gig"
                        ownerId={typeof gig.organizerId === 'object' ? gig.organizerId?._id : gig.organizerId}
                        threaded
                        hideOwnerWaitingNudge
                        onMessagesChange={onDiscussionMessages}
                        applicantsByUserId={applicantsByUserId}
                        onOpenApplicant={(applicationId) => {
                            // Single-item mode — an asker can be any status (incl.
                            // rejected); the modal hides chevrons/counter for len 1.
                            const app = actions.findApplication(applicationId);
                            if (app) actions.openProfileModal([app], app._id);
                        }}
                    />
                </View>

                {/* CONTRACTS-DISABLED: Booking-terms card + master-template
                    editor are hidden until the contract artifact is restored.
                    The gig still carries termsAndConditions free-form text on
                    the artist side via Apply flow Stage 1. To re-enable,
                    uncomment the import + this block (it sat with Essentials, now
                    in the HubOverview `beforeTabs` slot). */}
                {/*
                <HubBookingTermsCard
                    gigId={gigId}
                    paymentStructure={gig.paymentStructure || gig.compensation?.structure || gig.compensation?.paymentStructure || 'advance_balance'}
                    cancellationPolicy={gig.cancellationPolicy}
                    cancellationForfeitPct={gig.cancellationForfeitPct}
                    cancellationCustomText={gig.cancellationCustomText}
                    leadAmount={gig.compensation?.amount ?? gig.compensation?.leadAmount ?? 0}
                    subArtistAmount={gig.compensation?.subArtistAmount}
                    customClauses={gig.customClauses ?? []}
                    customClausesCount={(gig.customClauses ?? []).length}
                    activeContractsCount={data.contracts.filter((c: any) => ['active', 'sent', 'pending_artist_signature'].includes(c.status)).length}
                    negotiable={gig.compensation?.negotiable ?? false}
                    termsAndConditions={gig.termsAndConditions}
                />
                */}

                {/* Editorial footer — matches gig-hub-redesign-v1.html. */}
                <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 8 }}>
                    <View style={{ height: 1, width: '40%', backgroundColor: 'rgba(243,239,232,0.14)', marginBottom: 14 }} />
                    <Text style={{ fontSize: 9, letterSpacing: 2, color: '#3F3D4A', fontFamily: 'Outfit-Bold' }}>
                        THE STAGE IS YOURS
                    </Text>
                </View>
            </ScrollView>

            {/* Sticky CTA is an Applicants-context action (review / urgent team);
                hidden on the Discussion tab where it would sit over the thread. */}
            {topTab === 'applicants' ? (
                <View style={{ position: 'absolute', bottom: insets.bottom + 16, left: 0, right: 0 }}>
                    <HubStickyCTA cta={sticky} onPress={handleSticky} />
                </View>
            ) : null}

            {/* Shared applicant-action surfaces (profile modal + Hire/Contact/
                Remove sheets) — same controller the See-all screen uses. */}
            <GigApplicantActionModals actions={actions} gig={gig} data={data} />

            <GigActionsSheet
                visible={menuOpen}
                slotsTotal={data.kpis.slotsTotal}
                applicationsPaused={!!gig.applicationsPaused}
                autoCloseWhenFilled={gig.autoCloseWhenFilled !== false}
                status={gig.status}
                onClose={() => setMenuOpen(false)}
                onEdit={handleEditGig}
                onShare={handleShareGig}
                onTogglePause={handleTogglePause}
                onToggleAutoClose={handleToggleAutoClose}
                onCloseGig={handleCloseGig}
            />
        </View>
    );
}
