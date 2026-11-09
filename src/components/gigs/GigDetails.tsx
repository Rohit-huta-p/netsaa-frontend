// src/components/gigs/GigDetails.tsx
//
// Artist / applicant-facing gig detail — A·Minimal "job-board" redesign.
// See DOCS/02-engineering/NETSA_GigDetail_Redesign_Spec.md.
//
// Layout: top bar · identity + urgency · facet chips · tabs
// (Details / Producer / Discussion) · sticky Apply. Pay is a *fact* (parity
// with When/Where/Slots) plus a modest Compensation line — never a hero.
//
// Owners never reach here (the route early-returns HirerGigHub). The
// create-flow `preview` path renders Details only (no tabs / sticky / modals).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { useGigActions } from '@/hooks/useGigActions';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';
import DiscussionTab from '@/components/common/DiscussionTab';

import { buildGigDetailVM } from './detail/gigDetailVM';
import { GigHeaderBlock } from './detail/GigHeaderBlock';
import { GigTabs, type GigTabKey } from './detail/GigTabs';
import { DetailsTab } from './detail/DetailsTab';
import { ProducerPanel } from './detail/ProducerPanel';
import { StickyApply } from './detail/StickyApply';
import { C } from './detail/ui';

import { GigApplyModal } from './GigApplyModal';
import { AuthGateSheet } from '@/components/auth/AuthGateSheet';
import { ProfileMinimumGateSheet } from './ProfileMinimumGateSheet';
import { ShareBottomSheet } from '../common/ShareBottomSheet';
import { usePendingAuthActionStore } from '@/stores/pendingAuthActionStore';

interface GigDetailsProps {
    gig: any;
    /** Auto-opens GigApplyModal prefilled from this draft (DraftsSection resume). */
    resumeDraftId?: string;
    /** Deep-link tab hint (legacy; organizer-only values are ignored here). */
    tab?: string;
    /** Create-flow Page-5 preview: Details only — no tabs / Apply / modals. */
    preview?: boolean;
}

export const GigDetails: React.FC<GigDetailsProps> = ({ gig, resumeDraftId, preview }) => {
    const router = useRouter();
    const tabBarHeight = useMobileTabBarHeight();

    const {
        hasApplied,
        isSaved,
        applyModalVisible, setApplyModalVisible,
        authGateVisible, setAuthGateVisible, authGateContext, authGateActionType,
        shareSheetVisible, setShareSheetVisible,
        profileMinGateVisible, setProfileMinGateVisible,
        handleApply, handleShare, handleSave, isDeadlinePassed,
    } = useGigActions(gig);

    // After login, the router replaces back to this route.
    // Check if a pending intent targets this gig and resume the action.
    useFocusEffect(
        useCallback(() => {
            const { pendingIntent, clearPendingIntent } = usePendingAuthActionStore.getState();
            if (pendingIntent?.type === 'apply' && pendingIntent.resourceId === gig._id) {
                clearPendingIntent();
                handleApply();
            }
        }, [gig._id, handleApply])
    );

    const [activeTab, setActiveTab] = useState<GigTabKey>('details');

    const vm = buildGigDetailVM(gig);
    const organizerId = typeof gig?.organizerId === 'object' ? gig?.organizerId?._id : gig?.organizerId;

    // Resume a saved draft → auto-open the apply modal once.
    const autoOpenedDraftRef = useRef<string | null>(null);
    useEffect(() => {
        if (!resumeDraftId) return;
        if (autoOpenedDraftRef.current === resumeDraftId) return;
        autoOpenedDraftRef.current = resumeDraftId;
        setApplyModalVisible(true);
    }, [resumeDraftId, setApplyModalVisible]);

    const onBack = () => {
        if (router.canGoBack()) router.back();
    };
    const onViewProfile = () => {
        if (organizerId) router.push(`/profile/${organizerId}` as any);
    };

    const bottomInset = tabBarHeight > 0 ? tabBarHeight + 10 : 16;

    return (
        <View style={styles.root}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: preview ? 28 : tabBarHeight + 130 }}
            >
                <GigHeaderBlock
                    vm={vm}
                    onBack={onBack}
                    onShare={handleShare}
                    onToggleSave={handleSave}
                    saved={isSaved}
                />

                {preview ? (
                    <DetailsTab vm={vm} />
                ) : (
                    <>
                        <GigTabs value={activeTab} onChange={setActiveTab} />
                        {activeTab === 'details' && <DetailsTab vm={vm} />}
                        {activeTab === 'producer' && <ProducerPanel vm={vm} onViewProfile={onViewProfile} />}
                        {activeTab === 'discussion' && (
                            <View style={{ paddingHorizontal: 16 }}>
                                <DiscussionTab id={gig._id} type="gig" ownerId={organizerId} inline threaded />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Hide the sticky Apply on the Discussion tab — the contextual
                action there is the thread's own composer (ask / reply), and
                two bottom bars would collide. */}
            {!preview && activeTab !== 'discussion' && (
                <View style={styles.sticky} pointerEvents="box-none">
                    <StickyApply
                        hasApplied={!!hasApplied}
                        deadlinePassed={isDeadlinePassed}
                        onApply={handleApply}
                        bottomInset={bottomInset}
                    />
                </View>
            )}

            {/* Apply flow modals */}
            <GigApplyModal
                visible={applyModalVisible}
                onClose={() => setApplyModalVisible(false)}
                gigId={gig._id}
                gigTitle={gig.title}
                gigAmount={gig.compensation?.amount || gig.compensation?.minAmount || 0}
                isNegotiable={gig.compensation?.negotiable || false}
                termsAndConditions={gig.termsAndConditions}
                gig={gig}
                onViewTerms={() => setActiveTab('details')}
                hasTerms={!!gig.termsAndConditions}
                draftId={resumeDraftId}
            />

            <AuthGateSheet
                visible={authGateVisible}
                onClose={() => setAuthGateVisible(false)}
                actionType={authGateActionType}
                contextLabel={authGateContext.contextLabel}
                resourceId={authGateContext.resourceId}
                returnPath={authGateContext.returnPath}
            />

            <ShareBottomSheet
                visible={shareSheetVisible}
                onClose={() => setShareSheetVisible(false)}
                type="gig"
                data={gig}
            />

            <ProfileMinimumGateSheet
                visible={profileMinGateVisible}
                onClose={() => setProfileMinGateVisible(false)}
                onMinimumsMet={() => {
                    setProfileMinGateVisible(false);
                    setApplyModalVisible(true);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.canvas },
    sticky: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
