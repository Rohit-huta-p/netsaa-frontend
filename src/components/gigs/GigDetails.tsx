import React from 'react';
import { View, Text, ScrollView, Alert, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FlatList } from 'react-native-gesture-handler';

// Custom hook — all action handlers, modal state, and application data
import { useGigActions } from '@/hooks/useGigActions';

// Tab bar height for dynamic padding
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

// Section components
import { GigHeroSection } from './GigHeroSection';
import { OrganizerInfoCard } from './OrganizerInfoCard';
import { QuickMetaRow } from './QuickMetaRow';
import { CompensationSidebar } from './CompensationSidebar';
import { MobileApplyFooter } from './MobileApplyFooter';

// Highlight & trust components (pre-existing)
import { GigHighlightsSection } from './GigHighlightsSection';
import { OrganizerTrustCard } from './OrganizerTrustCard';
import { OrganizerDashboardCard } from './OrganizerDashboardCard';

// Tab content components
import { AboutTab } from './tabs/AboutTab';
import { TalentTab } from './tabs/TalentTab';
import { ScheduleTab } from './tabs/ScheduleTab';
import { ApplyTab } from './tabs/ApplyTab';
import { TermsTab } from './tabs/TermsTab';

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
}

/**
 * GigDetails — orchestrator component.
 * All sections, tabs, and handlers are extracted into focused subcomponents and a custom hook.
 */
export const GigDetails: React.FC<GigDetailsProps> = ({ gig }) => {
    const { width } = useWindowDimensions();
    const tabBarHeight = useMobileTabBarHeight();
    const isMobileWidth = width < 768;
    const router = useRouter();

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

    // Tab configuration
    const tabs = [
        ...(isOrganizer ? [{ key: 'applications', label: 'Applications' }] : []),
        { key: 'about', label: 'About' },
        { key: 'talent', label: 'Talent Criteria' },
        { key: 'schedule', label: 'Schedule & Pay' },
        { key: 'apply', label: 'How to Apply' },
        ...(gig.termsAndConditions ? [{ key: 'terms', label: 'Terms' }] : []),
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
                            {/* Title */}
                            <View>
                                <Text className="lg:text-3xl text-2xl font-black text-white leading-tight mb-4 mt-3 mb-5">
                                    {gig.title}
                                </Text>
                                {/* <hr className="w-full border-white/10 mb-5" /> */}

                                {/* Organizer Card (non-organizer only) */}
                                {!isOrganizer && (
                                    <OrganizerInfoCard
                                        organizerId={gig.organizerId._id}
                                        displayName={gig.organizerSnapshot?.displayName}
                                        profileImageUrl={gig.organizerSnapshot?.profileImageUrl}
                                        rating={gig.organizerSnapshot?.rating}
                                    />
                                )}
                                <hr className="w-full border-white/10 mb-5" />
                            </View>

                            {/* Quick Meta */}
                            <QuickMetaRow
                                location={gig.location}
                                schedule={gig.schedule}
                                gigType={gig.type}
                            />

                            {/* Gig Highlights & Trust (for artists) */}
                            {!isOrganizer && (
                                <>
                                    <GigHighlightsSection gig={gig} isOrganizer={isOrganizer} />
                                    <OrganizerTrustCard
                                        organizer={{
                                            _id: gig.organizerId._id || gig.organizerId,
                                            displayName: gig.organizerSnapshot?.displayName,
                                            profileImageUrl: gig.organizerSnapshot?.profileImageUrl,
                                            rating: gig.organizerSnapshot?.rating,
                                            gigsHosted: gig.organizerSnapshot?.gigsHosted,
                                            testimonials: gig.organizerSnapshot?.testimonials,
                                        }}
                                        isOrganizer={isOrganizer}
                                    />
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

                    {/* TABS */}
                    <View className="w-full bg-surface">
                        {/* Tab Headers */}
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                paddingVertical: 10,
                                paddingHorizontal: 20,
                                width: width >= 1024 ? '100%' : 'auto',
                                justifyContent: width >= 1024 ? 'space-around' : 'flex-start',
                            }}
                            data={tabs}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    key={item.key}
                                    onPress={() => setActiveTab(item.key as any)}
                                    className={`px-4 py-4 mb-5 flex-row items-center gap-2 ${activeTab === item.key
                                        ? 'border-b-2 border-blue-500 bg-[#171730ff]'
                                        : ''
                                        }`}
                                >
                                    <View className="flex-row items-center">
                                        <Text
                                            className={`text-[11px] font-black uppercase tracking-[0.15em] ${activeTab === item.key ? 'text-white' : 'text-zinc-500'
                                                }`}
                                        >
                                            {item.label}
                                            {item.key === 'applications' && applications && (
                                                <Text className="text-blue-400"> ({applications.length})</Text>
                                            )}
                                        </Text>

                                        {isOrganizer && item.key !== 'applications' && activeTab === item.key && (
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
                            )}
                        />

                        {/* Tab Content */}
                        {activeTab === 'about' && <AboutTab gig={gig} />}
                        {activeTab === 'talent' && <TalentTab gig={gig} />}
                        {activeTab === 'schedule' && <ScheduleTab gig={gig} />}
                        {activeTab === 'apply' && <ApplyTab gig={gig} />}
                        {activeTab === 'terms' && gig.termsAndConditions && (
                            <TermsTab termsAndConditions={gig.termsAndConditions} />
                        )}
                        {activeTab === 'applications' && isOrganizer && (
                            <ApplicationsTab gigId={gig._id} />
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
                onViewTerms={handleViewTerms}
                hasTerms={!!gig.termsAndConditions}
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