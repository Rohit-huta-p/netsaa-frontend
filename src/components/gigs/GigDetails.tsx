import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Alert, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

// Custom hook — all action handlers, modal state, and application data
import { useGigActions } from '@/hooks/useGigActions';

// Plan 5 — viewer's profile city is read off the persisted authStore so
// QuickMetaRow can render an "in your city" soft fallback without any
// extra network calls.
import { useAuthStore } from '@/stores/authStore';

// Plan 5 — device GPS coords for the precise "1.4 km" distance line.
// Silent — never auto-prompts (autoRequest defaults to false). When perm
// is already granted we get coords; otherwise the city soft-match handles
// the fallback. A future "Show distance" tap could call hook.request().
import { useViewerCoords } from '@/hooks/useViewerCoords';

// Tab bar height for dynamic padding
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

// Section components
import { GigHeroSection } from './GigHeroSection';
import { OrganizerInfoCard } from './OrganizerInfoCard';
import { QuickMetaRow } from './QuickMetaRow';
import { CompensationSidebar } from './CompensationSidebar';
import { MobileApplyFooter } from './MobileApplyFooter';
// Plan 5 — gig detail v2 mockup wiring.
import { StatusPillRow } from './StatusPillRow';
import { PayHero } from './PayHero';
import { GigTagline } from './GigTagline';
import { TrustStripInline } from './TrustStripInline';
import { AboutSection } from './sections/AboutSection';
import { WhatYoullDoSection } from './sections/WhatYoullDoSection';
import { LookingForSection } from './sections/LookingForSection';
import { CompensationPerksSection } from './sections/CompensationPerksSection';

// Highlight & trust components (pre-existing)
import { GigHighlightsSection } from './GigHighlightsSection';
// Apr 30: OrganizerTrustCard import unmounted from artist view (Talent
// Criteria card replaces it). File retained at ./OrganizerTrustCard for
// fast revert if we change our mind.
// import { OrganizerTrustCard } from './OrganizerTrustCard';
import { OrganizerDashboardCard } from './OrganizerDashboardCard';

// Tab content components
// Plan 5 v2 — full mockup replication: About + Terms also moved INLINE
// (AboutSection + termsAndConditions inline). Tab nav reduced to just
// Discussion (+ Applications for organizers). AboutTab and TermsTab
// imports kept commented for fast revert if we want tabs back.
// import { AboutTab } from './tabs/AboutTab';
// import { TermsTab } from './tabs/TermsTab';
// Discussion thread (GigComment-backed). Same component used on Event detail.
// Open Q&A — anyone authenticated can read/post. No application gating.
import DiscussionTab from '@/components/common/DiscussionTab';
// Apr 30 Talent Criteria — non-card iconified-rows replacement for the old
// OrganizerTrustCard slot. Renders inline on the artist-side gig page.
import { TalentCriteriaInline } from './TalentCriteriaInline';

// Application management (pre-existing)
import { ApplicationsTab, ApplicationsBottomSheet } from './applications';

// Modals (pre-existing)
import { GigApplyModal } from './GigApplyModal';
import { GigSettingsModal } from './GigSettingsModal';
import { AuthPromptModal } from '../common/AuthPromptModal';
import { ShareBottomSheet } from '../common/ShareBottomSheet';
import { ProfileCompletionModal } from '../common/ProfileCompletionModal';
import { GigEditModal } from './GigEditModal';
import { Edit2 } from 'lucide-react-native';

interface GigDetailsProps {
    gig: any;
    /**
     * If present, auto-opens GigApplyModal with that draft prefilled.
     * Set via the `?resumeDraftId=…` query param on /(app)/gigs/[id] —
     * DraftsSection (Plan 2, Task 17) routes users here to resume a
     * saved draft.
     */
    resumeDraftId?: string;
    /**
     * If `'applicants'` (and the viewer is the organizer), preselects the
     * existing internal 'applications' tab. Set via the `?tab=applicants`
     * query param on /(app)/gigs/[id] — ApplicantsInbox (Plan 3, Task 14)
     * routes users here from the hirer home.
     */
    tab?: string;
}

/**
 * GigDetails — orchestrator component.
 * All sections, tabs, and handlers are extracted into focused subcomponents and a custom hook.
 */
export const GigDetails: React.FC<GigDetailsProps> = ({ gig, resumeDraftId, tab }) => {
    const { width } = useWindowDimensions();
    const tabBarHeight = useMobileTabBarHeight();
    const isMobileWidth = width < 768;
    const router = useRouter();

    // Plan 5 — viewer's profile city for the QuickMetaRow distance fallback.
    const authUser = useAuthStore((s) => s.user);
    // Plan 5 — viewer's GPS coords for the precise distance line.
    // No autoRequest → we never trigger an OS permission dialog from the
    // gig detail page itself. If the user has already granted location
    // (e.g. via the LocationPickerModal flow) we'll silently re-use that.
    const { coords: viewerCoords } = useViewerCoords();

    // All state, handlers, and derived data from custom hook
    const {
        isOrganizer,
        hasApplied,
        isSaved,
        activeTab,
        setActiveTab,
        // Modal states
        settingsModalVisible, setSettingsModalVisible,
        applyModalVisible, setApplyModalVisible,
        authPromptVisible, setAuthPromptVisible,
        shareSheetVisible, setShareSheetVisible,
        profileGateVisible, setProfileGateVisible,
        profileGateData,
        bottomSheetVisible, setBottomSheetVisible,
        // Application data
        applications, loadingApplications,
        pendingCount, totalCount,
        // Handlers
        handleApply, handleShare, handleViewTerms,
        handleSave, handleUpdateStatus, isDeadlinePassed,
        // Edit Modal states
        editModalVisible, setEditModalVisible,
        editTargetTab, setEditTargetTab,
    } = useGigActions(gig);

    // Plan 2, Task 17 — auto-open GigApplyModal when a resumeDraftId query
    // param was passed from DraftsSection. Guard with a ref so React strict
    // mode double-invokes don't trigger the modal twice, and so returning
    // the user to this screen after closing the modal doesn't re-open it.
    const autoOpenedDraftRef = useRef<string | null>(null);
    useEffect(() => {
        if (!resumeDraftId) return;
        if (autoOpenedDraftRef.current === resumeDraftId) return;
        autoOpenedDraftRef.current = resumeDraftId;
        setApplyModalVisible(true);
    }, [resumeDraftId, setApplyModalVisible]);

    // Plan 3, Task 14 — preselect the 'applications' tab when the page is
    // opened with ?tab=applicants (ApplicantsInbox row tap). Organizer-only:
    // the 'applications' tab itself is organizer-gated (see `tabs` below),
    // so for non-organizers this is a silent no-op. Guard with a ref to
    // keep the deep-link as a one-shot hint — the user can switch tabs
    // after landing without the effect fighting them.
    const appliedTabHintRef = useRef<string | null>(null);
    useEffect(() => {
        if (!tab) return;
        if (appliedTabHintRef.current === tab) return;
        appliedTabHintRef.current = tab;
        if (tab === 'applicants' && isOrganizer) {
            setActiveTab('applications');
        }
    }, [tab, isOrganizer, setActiveTab]);

    // Plan 5 v2 — full mockup replication: About + Terms also moved INLINE.
    // Tab nav reduced to Discussion only (+ Applications for organizers).
    const tabs = [
        ...(isOrganizer ? [{ key: 'applications', label: 'Applications' }] : []),
        { key: 'discussion', label: 'Discussion' },
    ];

    return (
        <View className="flex-1 w-[90%] mx-auto">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: tabBarHeight > 0
                        ? tabBarHeight + (isMobileWidth && !isOrganizer ? 150 : 100)
                        : 140,
                    marginTop: 20,
                }}
            >
                {/* HERO — Tags + Action Buttons */}
                <GigHeroSection
                    gig={gig}
                    isSaved={isSaved}
                    onSave={handleSave}
                    onShare={handleShare}
                    onSettingsPress={() => setSettingsModalVisible(true)}
                    onApplicationsPress={() => setBottomSheetVisible(true)}
                    totalApplications={totalCount}
                    pendingApplications={pendingCount}
                />

                <View>
                    {/* MAIN CONTENT — Two Column Layout */}
                    <View className="items-start md:flex-row md:justify-between gap-5">
                        {/* Left Column */}
                        <View className={`pt-1 ${isMobileWidth ? 'w-full' : 'w-1/2'}`}>
                            {/* Plan 5 — v2 status row sits ABOVE the title:
                                gig type · deadline countdown · applied count. */}
                            <StatusPillRow
                                typeLabel={
                                    gig.eventFunction ||
                                    gig.artistTypes?.[0] ||
                                    (typeof gig.category === 'string' ? gig.category : undefined)
                                }
                                applicationDeadline={gig.applicationDeadline}
                                appliedCount={gig.stats?.applications ?? totalCount}
                            />

                            {/* Title + tagline */}
                            <View>
                                <Text className="lg:text-3xl text-2xl font-black text-white leading-tight mt-1 mb-1">
                                    {gig.title}
                                </Text>

                                {/* Plan 5 v2 — derived tagline under title
                                    ("3-song fusion · Bharatanatyam · Pune · May 12") */}
                                <GigTagline
                                    artistTypes={gig.artistTypes}
                                    tags={gig.tags}
                                    city={gig.location?.city}
                                    startDate={gig.schedule?.startDate}
                                />

                                {/* Organizer Card (non-organizer only).
                                    Plan 5 — also surfaces gigsHosted and
                                    avgReplyMinutes from the refreshed
                                    organizerSnapshot. */}
                                {!isOrganizer && (
                                    <OrganizerInfoCard
                                        organizerId={gig.organizerId._id}
                                        displayName={gig.organizerSnapshot?.displayName}
                                        profileImageUrl={gig.organizerSnapshot?.profileImageUrl}
                                        rating={gig.organizerSnapshot?.rating}
                                        gigsHosted={gig.organizerSnapshot?.gigsHosted}
                                        avgReplyMinutes={gig.organizerSnapshot?.avgReplyMinutes}
                                    />
                                )}

                                {/* Plan 5 v2 — standalone "Verified producer"
                                    pill below the producer card. */}
                                {!isOrganizer && (
                                    <TrustStripInline
                                        isVerified={!!gig.organizerSnapshot?.isVerified}
                                    />
                                )}
                            </View>

                            {/* Plan 5 — v2 pay hero. Big orange amount,
                                aux line ("per artist · negotiable"), no card.
                                Renders on mobile only — desktop uses the
                                CompensationSidebar (right column) below. */}
                            {isMobileWidth && !isOrganizer ? (
                                <PayHero
                                    amount={gig.compensation?.amount}
                                    minAmount={gig.compensation?.minAmount}
                                    maxAmount={gig.compensation?.maxAmount}
                                    currency={gig.compensation?.currency}
                                    negotiable={gig.compensation?.negotiable}
                                />
                            ) : null}

                            {/* Quick Meta — Plan 5 v2: 3-col editorial stat
                                line (When · Where · Slots) with hairline
                                rules top + bottom, no card. */}
                            <QuickMetaRow
                                location={gig.location}
                                schedule={gig.schedule}
                                slots={gig.maxApplications}
                                viewerCity={authUser?.location ?? null}
                                viewerCoords={viewerCoords}
                            />

                            {/* ─── Plan 5 v2 inline section stack ───
                                Replaces the old tab content + the prior
                                GigHighlightsSection / TalentCriteriaInline
                                pair on the artist view. Each section
                                auto-hides when its data is empty so legacy
                                gigs degrade gracefully. */}
                            {!isOrganizer && (
                                <>
                                    <AboutSection description={gig.description} />
                                    <WhatYoullDoSection
                                        responsibilities={gig.responsibilities}
                                    />
                                    <LookingForSection
                                        artistTypes={gig.artistTypes}
                                        experienceLevel={gig.experienceLevel}
                                        genderPreference={gig.genderPreference}
                                        ageRange={gig.ageRange}
                                        heightRequirements={gig.heightRequirements}
                                        requiredSkills={gig.requiredSkills}
                                        slots={gig.maxApplications}
                                    />
                                    <CompensationPerksSection
                                        amount={gig.compensation?.amount}
                                        minAmount={gig.compensation?.minAmount}
                                        maxAmount={gig.compensation?.maxAmount}
                                        perks={gig.compensation?.perks}
                                    />

                                    {/* Plan 5 v2 — Terms folded inline. */}
                                    {gig.termsAndConditions ? (
                                        <View className="mb-7" testID="terms-inline-section">
                                            <Text className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-3.5">
                                                Terms
                                            </Text>
                                            <Text className="text-[14px] leading-[22px] text-zinc-300 font-light">
                                                {gig.termsAndConditions}
                                            </Text>
                                        </View>
                                    ) : null}
                                </>
                            )}

                            {/* Organizer Dashboard (for organizers) */}
                            {isOrganizer && (
                                <OrganizerDashboardCard
                                    gig={gig}
                                    applicationsCount={totalCount}
                                    onBoostPress={() => Alert.alert('Boost', 'Boost feature coming soon!')}
                                    onSharePress={handleShare}
                                    onDuplicatePress={() => Alert.alert('Duplicate', 'Duplicate feature coming soon!')}
                                />
                            )}
                        </View>

                        {/* Right Column — Compensation Sidebar (desktop, non-organizer) */}
                        <CompensationSidebar gig={gig} hasApplied={hasApplied} onApply={handleApply} />
                    </View>

                    {/* TABS — Plan 5 v2: no card. Tab row + content sit
                        flat on the page background. Single hairline below
                        the row separates nav from thread, brand-orange
                        underline marks the active tab. */}
                    <View className="w-full mt-6">
                        {/* Tab Headers */}
                        <View
                            style={{
                                flexDirection: 'row',
                                borderBottomWidth: 1,
                                borderBottomColor: 'rgba(255,255,255,0.06)',
                            }}
                        >
                            {tabs.map((item) => {
                                const isActive = activeTab === item.key;
                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        onPress={() => setActiveTab(item.key as any)}
                                        style={{
                                            paddingRight: 18,
                                            paddingTop: 4,
                                            paddingBottom: 12,
                                            // Active tab underline overlaps the
                                            // hairline below so it feels stamped
                                            // into the page, not floating.
                                            borderBottomWidth: 2,
                                            borderBottomColor: isActive
                                                ? '#FF6B35'
                                                : 'transparent',
                                            marginBottom: -1,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text
                                                className={`text-[11px] font-black uppercase tracking-[0.15em] ${
                                                    isActive ? 'text-white' : 'text-zinc-500'
                                                }`}
                                            >
                                                {item.label}
                                                {item.key === 'applications' && applications && (
                                                    <Text className="text-orange-400"> ({applications.length})</Text>
                                                )}
                                            </Text>

                                            {isOrganizer && item.key !== 'applications' && isActive && (
                                                <TouchableOpacity
                                                    className="ml-2 w-6 h-6 items-center justify-center bg-white/10 rounded-full"
                                                    onPress={() => {
                                                        setEditTargetTab(item.key);
                                                        setEditModalVisible(true);
                                                    }}
                                                >
                                                    <Edit2 size={12} color="#FF6B35" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Tab Content — Plan 5 v2: About + Terms moved
                            INLINE above. Tab nav only switches between
                            Discussion + Applications (organizer-only). */}
                        {activeTab === 'applications' && isOrganizer && (
                            <ApplicationsTab gigId={gig._id} gig={gig} />
                        )}
                        {activeTab === 'discussion' && (
                            <DiscussionTab
                                id={gig._id}
                                type="gig"
                                ownerId={typeof gig.organizerId === 'object' ? gig.organizerId?._id : gig.organizerId}
                                inline
                            />
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* MOBILE APPLY FOOTER */}
            {isMobileWidth && !isOrganizer && (
                <MobileApplyFooter
                    hasApplied={hasApplied}
                    onApply={handleApply}
                    applicationDeadline={gig.applicationDeadline}
                    isDeadlinePassed={isDeadlinePassed}
                />
            )}

            {/* MODALS */}
            <GigApplyModal
                visible={applyModalVisible}
                onClose={() => setApplyModalVisible(false)}
                gigId={gig._id}
                gigTitle={gig.title}
                gigAmount={gig.compensation?.amount || gig.compensation?.minAmount || 0}
                isNegotiable={gig.compensation?.negotiable || false}
                termsAndConditions={gig.termsAndConditions}
                gig={gig}
                onViewTerms={handleViewTerms}
                hasTerms={!!gig.termsAndConditions}
                draftId={resumeDraftId}
            />

            {settingsModalVisible && (
                <GigSettingsModal
                    visible={settingsModalVisible}
                    onClose={() => setSettingsModalVisible(false)}
                    gig={gig}
                />
            )}

            {authPromptVisible && (
                <AuthPromptModal
                    visible={authPromptVisible}
                    onClose={() => setAuthPromptVisible(false)}
                />
            )}

            {editModalVisible && (
                <GigEditModal
                    visible={editModalVisible}
                    onClose={() => setEditModalVisible(false)}
                    gig={gig}
                    initialTab={editTargetTab}
                />
            )}

            {/* Applications Bottom Sheet */}
            {isOrganizer && (
                <ApplicationsBottomSheet
                    visible={bottomSheetVisible}
                    onClose={() => setBottomSheetVisible(false)}
                    applications={applications || []}
                    onViewAll={() => {
                        setBottomSheetVisible(false);
                        setActiveTab('applications');
                    }}
                    onUpdateStatus={handleUpdateStatus}
                    gigId={gig._id}
                    gig={gig}
                    isLoading={loadingApplications}
                />
            )}

            {/* Share Bottom Sheet */}
            <ShareBottomSheet
                visible={shareSheetVisible}
                onClose={() => setShareSheetVisible(false)}
                type="gig"
                data={gig}
            />

            {/* Profile Completion Gate */}
            <ProfileCompletionModal
                visible={profileGateVisible}
                onClose={() => setProfileGateVisible(false)}
                onGoToProfile={() => {
                    setProfileGateVisible(false);
                    router.push('/(app)/profile');
                }}
                score={profileGateData.score}
                missing={profileGateData.missing}
            />
        </View>
    );
};