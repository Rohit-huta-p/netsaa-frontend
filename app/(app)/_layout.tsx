import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import useAuthStore from "@/stores/authStore";
import ProfileCompletionModal from "@/components/common/ProfileCompletionModal";
import AccountDeletionScheduledModal from "@/components/settings/AccountDeletionScheduledModal";
import { computeOverallScore, computeMissing, computeOrganizerScore, computeOrganizerMissing } from "@/components/profile/ProfileStrengthWidget";
import BottomNav from "@/components/nav/BottomNav";
import { useModeStore } from "@/stores/modeStore";
import { isValidMode } from "@/lib/modeInference";
import { useState, useEffect } from "react";

/**
 * App Layout - All routes under (app) require authentication.
 * Unauthenticated users are redirected to "/" (landing page).
 */
export default function AppLayout() {
    const { isHydrated, isAuthLoading, user, accessToken } = useAuthStore();
    const router = useRouter();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeletionModal, setShowDeletionModal] = useState(false);

    // Two-context model: every user is both artist AND hirer
    // Context is determined by the page, not a role field
    const isArtist = true; // Always true in two-context model
    const isOrganizer = true; // Always true (hirer context)

    // Profile completion uses artist score (primary context for most users)
    const score = user ? computeOverallScore(user) : 100;
    const missing = user ? computeMissing(user) : [];

    const userRole: 'artist' | 'organizer' = 'artist'; // Default context for profile completion

    // Redirect unauthenticated users to login page
    useEffect(() => {
        if (isHydrated && !isAuthLoading && !accessToken) {
            router.replace('/(auth)/login');
        }
    }, [isHydrated, isAuthLoading, accessToken]);

    useEffect(() => {
        if (isHydrated && !isAuthLoading && user) {
            // Check for deletion scheduling first
            if (user.accountStatus === 'scheduled_for_deletion') {
                setShowDeletionModal(true);
            } else if ((isArtist || isOrganizer) && missing.length > 0) {
                // Otherwise check profile completion
                setShowProfileModal(true);
            }
        }
    }, [isHydrated, isAuthLoading, user?.accountStatus]);

    /**
     * Layer 2 bootstrap — spec §2.4 mode resolution.
     *
     * When the app boots, mode resolves in this order:
     *   Layer 1 (local, persistent): AsyncStorage via zustand persist — fires before this effect.
     *   Layer 2 (server mirror):     user.lastActiveMode, read here on login.
     *   Layer 3 (inference):         behavioural fallback (currently only used at onboarding).
     *
     * Tradeoff: on every login we prefer the server value. This means if a user switches
     * to 'artist' on device B and server still had 'hirer' from device A's last session,
     * device B can get flipped to 'hirer' on next app launch. For MVP we bias toward
     * cross-device continuity — device A (where the switch happened) will have synced
     * 'artist' to the server already via modeService, so normal flows stay consistent.
     * hasBootstrappedMode prevents re-running within a single session.
     */
    useEffect(() => {
        if (!isHydrated || isAuthLoading || !user) return;
        const { hasBootstrappedMode, setMode, setBootstrapped } = useModeStore.getState();
        if (hasBootstrappedMode) return;

        const serverMode = (user as any).lastActiveMode;
        if (isValidMode(serverMode)) {
            setMode(serverMode);
        }
        setBootstrapped(true);
    }, [isHydrated, isAuthLoading, user]);

    // Wait for auth state to hydrate before rendering
    if (!isHydrated || isAuthLoading) {
        return null; // Or a loading spinner
    }

    // If not authenticated, don't render protected routes (redirect will fire)
    if (!accessToken) {
        return null;
    }

    return (
        <View className="flex-1">
            <Stack screenOptions={{ headerShown: false }} />

            <BottomNav />

            {/* Profile completion modal — artists/organizers with incomplete profiles */}
            {showProfileModal && (
                <ProfileCompletionModal
                    index={true}
                    visible={true}
                    score={score}
                    missing={missing}
                    role={userRole}
                    onClose={() => { setShowProfileModal(false); }}
                    onGoToProfile={() => {
                        setShowProfileModal(false);
                        router.push("/(app)/profile?highlight=true");
                    }}
                />
            )}

            {/* Deletion scheduled warning modal */}
            {showDeletionModal && (
                <AccountDeletionScheduledModal
                    visible={showDeletionModal}
                    onClose={() => setShowDeletionModal(false)}
                />
            )}
        </View>
    );
}
