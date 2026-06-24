// src/features/hirer-hub/HirerGigHub.tsx
//
// Hirer-side single-scroll project hub. Replaces the tab-based gig detail
// when the current user is the gig owner. Public artist view of /gigs/[id]
// stays untouched in app/(app)/gigs/[id].tsx.

import React, { useMemo, useRef, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useGigHubData } from './hooks/useGigHubData';
import { computeStickyCTA } from './utils/computeStickyCTA';
import { useUpdateApplicationStatus } from '@/hooks/useGigApplications';
import { HireConfirmModal } from '@/components/gigs/applications/HireConfirmModal';
import { ContactActionSheet, type ContactTarget } from '@/features/team/ContactActionSheet';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

import { HubHero, STATUS_LABEL } from './components/HubHero';
import { HubKPIs } from './components/HubKPIs';
import { HubTeamSection } from './components/HubTeamSection';
// CONTRACTS-DISABLED: HubBookingTermsCard hidden until contract artifact is restored.
// import { HubBookingTermsCard } from './components/HubBookingTermsCard';
import { HubApplicantsSection } from './components/HubApplicantsSection';
import { HubEssentials } from './components/HubEssentials';
import { HubStickyCTA } from './components/HubStickyCTA';
import { ApplicantActionSheet } from './components/ApplicantActionSheet';
// Discussion section — backed by GigComment model. Same component used on
// Event detail screens. Pulls socket (live updates) + gigService for the
// REST round-trip. No gating beyond auth: anyone signed in can read/post.
import DiscussionTab from '@/components/common/DiscussionTab';

const COLORS = { bg: '#07070B', line: 'rgba(255,255,255,0.05)' };

type Props = {
    gigId: string;
};

export function HirerGigHub({ gigId }: Props) {
    const router = useRouter();
    const data = useGigHubData(gigId);
    const scrollRef = useRef<ScrollView>(null);
    const applicantsYRef = useRef<number>(0);
    // Tab-bar height — keeps the sticky CTA above the global bottom nav
    // on mobile. Returns 0 on tablet/desktop widths (no nav rendered).
    const tabBarHeight = useMobileTabBarHeight();
    // The chevron header is mobile-only. On tablet/desktop the global
    // app shell (Navbar) provides navigation, so this duplicate is hidden.
    const { width } = useWindowDimensions();
    const showMobileHeader = width < 768;

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
    const updateStatusMutation = useUpdateApplicationStatus();

    const sticky = useMemo(
        () => computeStickyCTA({
            pendingApplicantsCount: data.pendingApplicantsCount,
            urgentTeamRowCount: data.urgentTeamRowCount,
            firstUrgentLabel: data.firstUrgentLabel,
        }),
        [data.pendingApplicantsCount, data.urgentTeamRowCount, data.firstUrgentLabel]
    );

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

    const handleSticky = () => {
        if (sticky.intent === 'review-applicants') {
            scrollRef.current?.scrollTo({ y: applicantsYRef.current, animated: true });
            return;
        }
        if (sticky.intent === 'urgent-team') {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
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

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            {/* Warm spotlight wash behind the hero — matches gig-hub-redesign-v1.html. */}
            <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360 }}>
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
                {/* Mobile-only header. Desktop relies on the global Navbar
                    for navigation; rendering this would duplicate the chrome. */}
                {showMobileHeader && (
                    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={handleBack} accessibilityLabel="Back" hitSlop={12}>
                            <ChevronLeft size={20} color="#B8B1A6" />
                        </TouchableOpacity>
                        {(() => {
                            const s = STATUS_LABEL[gig.status ?? ''] ?? STATUS_LABEL.published;
                            return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: `${s.color}1A`, borderWidth: 1, borderColor: `${s.color}38` }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.color }} />
                                    <Text style={{ color: s.color, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{s.label}</Text>
                                </View>
                            );
                        })()}
                        <TouchableOpacity accessibilityLabel="More" hitSlop={12}>
                            <MoreHorizontal size={18} color="#B8B1A6" />
                        </TouchableOpacity>
                    </View>
                )}

                <HubHero
                    title={gig.title}
                    status={gig.status}
                    eventFunction={gig.eventFunction}
                    city={gig.location?.city}
                    startDate={gig.schedule?.startDate ?? gig.startDate}
                    showStatus={!showMobileHeader}
                />

                <HubKPIs kpis={data.kpis} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24 }} />

                {/* Applicants FIRST — v1 "action-first": the owner's #1 job
                    (review / hire) sits above the fold; the team roster follows. */}
                <View
                    onLayout={(e) => { applicantsYRef.current = e.nativeEvent.layout.y - 16; }}>
                    <HubApplicantsSection
                        applicants={data.pendingApplicants}
                        onTapApplicant={handleRowTap}
                        onQuickHire={handleQuickHire}
                        onQuickReject={handleQuickReject}
                        onSeeAll={() => router.push(`/(app)/gigs/${gigId}?tab=applicants` as any)}
                    />
                </View>

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 32 }} />

                <HubTeamSection
                    teamRows={data.teamRows}
                    gig={gig}
                    slotsTotal={data.kpis.slotsTotal}
                    pendingApplicantsCount={data.pendingApplicantsCount}
                    onRequestContact={(application) =>
                        setContactTarget({
                            artistId: application?.artistId ?? '',
                            displayName: application?.artistSnapshot?.displayName ?? 'Artist',
                            phoneNumber: application?.artistSnapshot?.phoneNumber,
                            gigTitle: gig?.title,
                        })
                    }
                />

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
                    socket-pushed updates. Sits between Applicants and
                    Essentials so the reactive surfaces stack together.
                    ownerId enables pin + delete-any owner actions for the
                    Hub viewer (who is always the gig owner here). */}
                <View style={{ paddingHorizontal: 16 }}>
                    <DiscussionTab
                        id={gigId}
                        type="gig"
                        ownerId={typeof gig.organizerId === 'object' ? gig.organizerId?._id : gig.organizerId}
                    />
                </View>

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 24 }} />

                <HubEssentials
                    eventDate={gig.schedule?.startDate ?? gig.startDate}
                    venue={gig.location?.venueName}
                    city={gig.location?.city}
                    scope={gig.description}
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

            <ApplicantActionSheet
                visible={!!actionSheetTarget}
                application={actionSheetTarget}
                onClose={() => setActionSheetTarget(null)}
                onShortlist={handleSheetShortlist}
                onReject={handleSheetReject}
                onHire={handleSheetHire}
                onViewProfile={handleSheetViewProfile}
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
        </View>
    );
}
