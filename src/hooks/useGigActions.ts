import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import useAuthStore from '@/stores/authStore';
import { useGigApplications, useUpdateApplicationStatus } from '@/hooks/useGigApplications';
import { meetsMinimumApplyGate, computeOverallScore } from '@/components/profile/ProfileStrengthWidget';
import gigService from '@/services/gigService';

/**
 * Custom hook that encapsulates all gig action handlers and modal state.
 * Keeps the GigDetails component focused on rendering.
 */
export function useGigActions(gig: any) {
    const user = useAuthStore((state) => state.user);
    const isOrganizer = user?._id === gig.organizerId._id;
    const hasApplied = gig.viewerContext?.hasApplied;

    // Modal visibility states
    const [settingsModalVisible, setSettingsModalVisible] = useState(false);
    const [applyModalVisible, setApplyModalVisible] = useState(false);
    const [authPromptVisible, setAuthPromptVisible] = useState(false);
    const [shareSheetVisible, setShareSheetVisible] = useState(false);
    const [profileGateVisible, setProfileGateVisible] = useState(false);
    const [profileGateData, setProfileGateData] = useState<{ score: number; missing: string[] }>({
        score: 0,
        missing: [],
    });
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<
        'about' | 'talent' | 'schedule' | 'apply' | 'applications' | 'terms'
    >(isOrganizer ? 'applications' : 'about');
    const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editTargetTab, setEditTargetTab] = useState<string>('about');

    // Fetch applications if organizer
    const { data: applications, isLoading: loadingApplications } = useGigApplications(
        isOrganizer ? gig._id : ''
    );
    const updateMutation = useUpdateApplicationStatus();

    // Calculate pending applications count for badge
    const pendingCount = useMemo(() => {
        if (!applications) return 0;
        return applications.filter((app: any) => app.status === 'pending').length;
    }, [applications]);

    const totalCount = applications?.length || 0;

    // Deadline check
    const isDeadlinePassed = gig.applicationDeadline
        ? new Date(gig.applicationDeadline) < new Date()
        : false;

    // Handlers
    const handleApply = () => {
        if (isDeadlinePassed) {
            Alert.alert('Deadline Passed', 'The application deadline for this gig has passed.');
            return;
        }

        if (!user) {
            setAuthPromptVisible(true);
            return;
        }

        const gate = meetsMinimumApplyGate(user);
        if (!gate.passes) {
            setProfileGateData({
                score: computeOverallScore(user),
                missing: gate.missing,
            });
            setProfileGateVisible(true);
            return;
        }

        setApplyModalVisible(true);
    };

    const handleShare = () => setShareSheetVisible(true);

    const handleViewTerms = () => {
        setApplyModalVisible(false);
        setActiveTab('terms');
    };

    const handleSave = async () => {
        if (!user) {
            setAuthPromptVisible(true);
            return;
        }

        try {
            setIsSaved(!isSaved); // Optimistic update
            const response = await gigService.saveGig(gig._id);
            if (response.data?.saved !== undefined) {
                setIsSaved(response.data.saved);
            }
        } catch (error) {
            console.error('Failed to save gig:', error);
            setIsSaved(isSaved); // Revert on error
            Alert.alert('Error', 'Failed to save gig. Please try again.');
        }
    };

    const handleUpdateStatus = (appId: string, status: string) => {
        updateMutation.mutate({ applicationId: appId, status });
    };

    return {
        // Derived state
        isOrganizer,
        hasApplied,
        user,

        // Modal states
        settingsModalVisible,
        setSettingsModalVisible,
        applyModalVisible,
        setApplyModalVisible,
        authPromptVisible,
        setAuthPromptVisible,
        shareSheetVisible,
        setShareSheetVisible,
        profileGateVisible,
        setProfileGateVisible,
        profileGateData,
        bottomSheetVisible,
        setBottomSheetVisible,

        // UI state
        isSaved,
        activeTab,
        setActiveTab,

        // Application data
        applications,
        loadingApplications,
        pendingCount,
        totalCount,

        // Handlers
        handleApply,
        handleShare,
        handleViewTerms,
        handleSave,
        handleUpdateStatus,
        isDeadlinePassed,

        // Edit Modal
        editModalVisible,
        setEditModalVisible,
        editTargetTab,
        setEditTargetTab,
    };
}
