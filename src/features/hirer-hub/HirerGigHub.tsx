// src/features/hirer-hub/HirerGigHub.tsx
//
// Hirer-side single-scroll project hub. Replaces the tab-based gig detail
// when the current user is the gig owner. Public artist view of /gigs/[id]
// stays untouched in app/(app)/gigs/[id].tsx.
//
// Overview + pipeline follow DOCS/04-design/mockups/applicant-card-D.html
// (screens 1–3): a compact gig header, three tappable stage tabs (Applied /
// Shortlisted / Hired) that swap the body, a slot bar, and the card-D rows.

import React, { useMemo, useRef, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useGigHubData, type HubStage } from './hooks/useGigHubData';
import { computeStickyCTA } from './utils/computeStickyCTA';
import { formatGigWhenCompact } from '@/utils/gigSchedule';
import { useUpdateApplicationStatus } from '@/hooks/useGigApplications';
import { HireConfirmModal } from '@/components/gigs/applications/HireConfirmModal';
import { ContactActionSheet, type ContactTarget } from '@/features/team/ContactActionSheet';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

import { HubOverview } from './components/HubOverview';
import { HubTeamSection } from './components/HubTeamSection';
// CONTRACTS-DISABLED: HubBookingTermsCard hidden until contract artifact is restored.
// import { HubBookingTermsCard } from './components/HubBookingTermsCard';
import { HubApplicantsSection } from './components/HubApplicantsSection';
import { HubEssentials } from './components/HubEssentials';
import { HubStickyCTA } from './components/HubStickyCTA';
import { ApplicantDetailScreen } from './components/ApplicantDetailScreen';
import { RemoveHireSheet } from './components/RemoveHireSheet';
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
// "Sangeet night · 4 dancers" — the applicant-detail "Applying for" row.
function composeApplyingFor(gig: any): string {
    const headcount = gig?.headcount ?? gig?.maxApplications;
    return [gig?.title, headcount ? `${headcount} ${craftLabel(gig)}` : null].filter(Boolean).join(' · ');
}

type Props = {
    gigId: string;
};

export function HirerGigHub({ gigId }: Props) {
    const router = useRouter();
    const data = useGigHubData(gigId);
    const scrollRef = useRef<ScrollView>(null);
    const overviewYRef = useRef<number>(0);
    // Tab-bar height — keeps the sticky CTA above the global bottom nav
    // on mobile. Returns 0 on tablet/desktop widths (no nav rendered).
    const tabBarHeight = useMobileTabBarHeight();
    // The chevron header is mobile-only. On tablet/desktop the global
    // app shell (Navbar) provides navigation, so this duplicate is hidden.
    const { width } = useWindowDimensions();
    const showMobileHeader = width < 768;

    // Pipeline selection (lifted). The active stage drives which body renders;
    // sort applies to the Applied / Shortlisted lists.
    const [activeStage, setActiveStage] = useState<HubStage>('applied');
    const [sortKey, setSortKey] = useState<SortKey>('rating');

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

    const [hireTarget, setHireTarget] = useState<any | null>(null);
    const [contactTarget, setContactTarget] = useState<ContactTarget | null>(null);
    const [actionSheetTarget, setActionSheetTarget] = useState<any | null>(null);
    // The hired artist the owner is about to remove — mounts the confirm sheet.
    const [removeTarget, setRemoveTarget] = useState<any | null>(null);
    const updateStatusMutation = useUpdateApplicationStatus();

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

    const handleSticky = () => {
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

    const findApplication = (applicationId: string) => {
        return data.pendingApplicants.find((a: any) => a._id === applicationId)
            ?? data.applications.find((a: any) => a._id === applicationId)
            ?? null;
    };

    const handleQuickHire = (applicationId: string) => {
        const app = findApplication(applicationId);
        if (app) setHireTarget(app);
    };

    const handleQuickReject = (applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'rejected' });
    };

    // Undo a Pass — return the applicant to the pool (needs netsaa-backend #15,
    // which allows rejected -> applied). The section keeps the card on screen
    // meanwhile, so this just flips the server state back.
    const handleUndoPass = (applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'applied' });
    };

    const handleQuickShortlist = (applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'shortlisted' });
    };

    // Message an applicant — reuse the team ContactActionSheet (the only DM
    // entry point today). artistId may be populated (object) or a raw id.
    const handleMessageApplicant = (applicationId: string) => {
        const app = findApplication(applicationId);
        if (!app) return;
        const artistId = typeof app.artistId === 'object' ? app.artistId?._id : app.artistId;
        setContactTarget({
            artistId: artistId ?? '',
            displayName: app.artistSnapshot?.displayName ?? 'Artist',
            phoneNumber: app.artistSnapshot?.phoneNumber,
            gigTitle: gig?.title,
        });
    };

    const handleRowTap = (applicationId: string) => {
        const app = findApplication(applicationId);
        if (app) setActionSheetTarget(app);
    };

    const handleSheetShortlist = (applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'shortlisted' });
        setActionSheetTarget(null);
    };

    const handleSheetReject = (applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'rejected' });
        setActionSheetTarget(null);
    };

    const handleSheetHire = (applicationId: string) => {
        const app = findApplication(applicationId);
        setActionSheetTarget(null);
        if (app) setHireTarget(app);
    };

    const handleSheetViewProfile = (artistId: string) => {
        setActionSheetTarget(null);
        router.push(`/(app)/profile/${artistId}` as any);
    };

    // Remove-hire cascade (B3). Removing a hire is a reversible DEMOTE, not a
    // delete: the confirm sheet spells out the cascade, then the server flip is
    // hired -> shortlisted (netsaa-backend B3), which reopens the freed slot and
    // notifies the artist. The artist drops back onto the shortlist, never
    // rejected.
    const handleRemoveHire = (applicationId: string) => {
        const app = findApplication(applicationId);
        if (app) setRemoveTarget(app);
    };

    const confirmRemoveHire = (applicationId: string) => {
        updateStatusMutation.mutate({ applicationId, status: 'shortlisted' });
        setRemoveTarget(null);
    };

    // Tap a cast card → the artist's profile (hired members aren't re-triaged
    // through the applicant action sheet, whose actions are Shortlist/Reject/Hire).
    const handleViewTeamProfile = (applicationId: string) => {
        const app = findApplication(applicationId);
        const artistId = app ? (typeof app.artistId === 'object' ? app.artistId?._id : app.artistId) : null;
        if (artistId) router.push(`/(app)/profile/${artistId}` as any);
    };

    // Fill an open slot → jump to the shortlist (your picks) to hire someone;
    // fall back to the applied flood when there are no picks yet.
    const handleFillSlot = () => {
        setActiveStage((data.stageCounts?.shortlisted ?? 0) > 0 ? 'shortlisted' : 'applied');
        scrollToOverview();
    };

    const toggleSort = () => setSortKey((k) => (k === 'rating' ? 'recent' : 'rating'));

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            {/* Warm spotlight wash behind the header — matches the ghead radial. */}
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}>
                <LinearGradient
                    colors={['rgba(255,107,53,0.16)', 'rgba(255,107,53,0.04)', 'transparent']}
                    locations={[0, 0.45, 1]}
                    style={{ flex: 1 }}
                />
            </View>
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: tabBarHeight + 100 }}
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
                        // ⋯ manage-gig menu is inert until B4.
                        onMenu={undefined}
                    />
                </View>

                {/* Body — the active stage's list. Hired is the cast (card D +
                    open slots); Applied / Shortlisted are the card-D flood/picks. */}
                {activeStage === 'hired' ? (
                    <HubTeamSection
                        teamRows={data.teamRows}
                        slotsTotal={data.kpis.slotsTotal}
                        venueCity={gig.location?.city}
                        onTapApplicant={handleViewTeamProfile}
                        onMessage={handleMessageApplicant}
                        onRemove={handleRemoveHire}
                        onFillSlot={handleFillSlot}
                    />
                ) : (
                    <HubApplicantsSection
                        applicants={activeList}
                        venueCity={gig.location?.city}
                        emptyLabel={activeStage === 'shortlisted'
                            ? 'No picks yet — shortlist applicants to line up your hires.'
                            : 'No new applicants right now.'}
                        onTapApplicant={handleRowTap}
                        onPass={handleQuickReject}
                        onUndoPass={handleUndoPass}
                        onShortlist={handleQuickShortlist}
                        onHire={handleQuickHire}
                        onMessage={handleMessageApplicant}
                    />
                )}

                {/* CONTRACTS-DISABLED: Booking-terms card + master-template
                    editor are hidden until the contract artifact is restored.
                    The gig still carries termsAndConditions free-form text on
                    the artist side via Apply flow Stage 1. To re-enable,
                    uncomment the import + this block. */}
                {/*
                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 32 }} />

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

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 24 }} />

                {/* Discussion — open Q&A thread on the gig. Authenticated users
                    only (backend-enforced via `protect`). Optimistic posts +
                    socket-pushed updates. ownerId enables pin + delete-any owner
                    actions for the Hub viewer (always the gig owner here). */}
                <View style={{ paddingHorizontal: 16 }}>
                    <DiscussionTab
                        id={gigId}
                        type="gig"
                        ownerId={typeof gig.organizerId === 'object' ? gig.organizerId?._id : gig.organizerId}
                        threaded
                        applicantsByUserId={applicantsByUserId}
                        onOpenApplicant={(applicationId) => {
                            const app = findApplication(applicationId);
                            if (app) setActionSheetTarget(app);
                        }}
                    />
                </View>

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 24 }} />

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

                {/* Editorial footer — matches gig-hub-redesign-v1.html. */}
                <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 8 }}>
                    <View style={{ height: 1, width: '40%', backgroundColor: 'rgba(243,239,232,0.14)', marginBottom: 14 }} />
                    <Text style={{ fontSize: 9, letterSpacing: 2, color: '#3F3D4A', fontFamily: 'Outfit-Bold' }}>
                        THE STAGE IS YOURS
                    </Text>
                </View>
            </ScrollView>

            <View style={{ position: 'absolute', bottom: tabBarHeight + 16, left: 0, right: 0 }}>
                <HubStickyCTA cta={sticky} onPress={handleSticky} />
            </View>

            <ApplicantDetailScreen
                visible={!!actionSheetTarget}
                application={actionSheetTarget}
                venueCity={gig.location?.city}
                applyingForLabel={composeApplyingFor(gig)}
                datesLabel={formatGigWhenCompact(gig.schedule) || undefined}
                payLabel={data.kpis.budgetAmount > 0 ? `₹${Math.round(data.kpis.budgetAmount).toLocaleString('en-IN')} per performer` : undefined}
                onClose={() => setActionSheetTarget(null)}
                onShortlist={handleSheetShortlist}
                onReject={handleSheetReject}
                onHire={handleSheetHire}
                onViewProfile={handleSheetViewProfile}
                onMessage={(applicationId) => {
                    setActionSheetTarget(null);
                    handleMessageApplicant(applicationId);
                }}
                onRemove={(applicationId) => {
                    setActionSheetTarget(null);
                    handleRemoveHire(applicationId);
                }}
            />
            <HireConfirmModal
                visible={!!hireTarget}
                gig={gig}
                application={hireTarget ?? { _id: '', artistId: '', artistSnapshot: undefined }}
                onClose={() => setHireTarget(null)}
                onHired={() => setHireTarget(null)}
            />
            <ContactActionSheet
                visible={!!contactTarget}
                onClose={() => setContactTarget(null)}
                target={contactTarget}
            />
            <RemoveHireSheet
                visible={!!removeTarget}
                application={removeTarget}
                hiredCount={data.kpis.hiredCount}
                slotsTotal={data.kpis.slotsTotal}
                onClose={() => setRemoveTarget(null)}
                onConfirm={confirmRemoveHire}
            />
        </View>
    );
}
