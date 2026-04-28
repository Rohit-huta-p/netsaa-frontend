// src/features/hirer-hub/HirerGigHub.tsx
//
// Hirer-side single-scroll project hub. Replaces the tab-based gig detail
// when the current user is the gig owner. Public artist view of /gigs/[id]
// stays untouched in app/(app)/gigs/[id].tsx.

import React, { useMemo, useRef, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';

import { useGigHubData } from './hooks/useGigHubData';
import { computeStickyCTA } from './utils/computeStickyCTA';
import { useUpdateApplicationStatus } from '@/hooks/useGigApplications';
import { HireConfirmModal } from '@/components/gigs/applications/HireConfirmModal';

import { HubHero } from './components/HubHero';
import { HubKPIs } from './components/HubKPIs';
import { HubTeamSection } from './components/HubTeamSection';
import { HubBookingTermsCard } from './components/HubBookingTermsCard';
import { HubApplicantsSection } from './components/HubApplicantsSection';
import { HubEssentials } from './components/HubEssentials';
import { HubStickyCTA } from './components/HubStickyCTA';
import { ApplicantActionSheet } from './components/ApplicantActionSheet';

const COLORS = { bg: '#07070B', line: 'rgba(255,255,255,0.05)' };

type Props = {
    gigId: string;
};

export function HirerGigHub({ gigId }: Props) {
    const router = useRouter();
    const data = useGigHubData(gigId);
    const scrollRef = useRef<ScrollView>(null);
    const applicantsYRef = useRef<number>(0);

    const [hireTarget, setHireTarget] = useState<any | null>(null);
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
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back">
                        <ChevronLeft size={20} color="#B8B1A6" />
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityLabel="More">
                        <MoreHorizontal size={18} color="#B8B1A6" />
                    </TouchableOpacity>
                </View>

                <HubHero
                    title={gig.title}
                    status={gig.status}
                    eventFunction={gig.eventFunction}
                    city={gig.location?.city}
                    startDate={gig.schedule?.startDate ?? gig.startDate}
                />

                <HubKPIs kpis={data.kpis} />

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24 }} />

                <HubTeamSection
                    teamRows={data.teamRows}
                    slotsTotal={data.kpis.slotsTotal}
                    pendingApplicantsCount={data.pendingApplicantsCount}
                />

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

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 32 }} />

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

                <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24, marginTop: 24 }} />

                <HubEssentials
                    eventDate={gig.schedule?.startDate ?? gig.startDate}
                    venue={gig.location?.venue}
                    city={gig.location?.city}
                    scope={gig.description}
                    postedDate={gig.createdAt}
                    onEditGig={() => router.push(`/(app)/gigs/${gigId}/edit` as any)}
                />
            </ScrollView>

            <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0 }}>
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
        </View>
    );
}
