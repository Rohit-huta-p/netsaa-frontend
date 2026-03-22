import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import useAuthStore from "@/stores/authStore";
import ProfileCompletionModal from "@/components/common/ProfileCompletionModal";
import AccountDeletionScheduledModal from "@/components/settings/AccountDeletionScheduledModal";
import { computeOverallScore, computeMissing, computeOrganizerScore, computeOrganizerMissing } from "@/components/profile/ProfileStrengthWidget";
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

    const isArtist = user?.roles?.includes("artist") || user?.role === "artist";
    const isOrganizer = user?.roles?.includes("organizer") || user?.role === "organizer";

    const score = user
        ? isArtist ? computeOverallScore(user)
            : isOrganizer ? computeOrganizerScore(user)
                : 100 : 100;
    const missing = user
        ? isArtist ? computeMissing(user)
            : isOrganizer ? computeOrganizerMissing(user)
                : [] : [];

    const userRole: 'artist' | 'organizer' = isOrganizer ? 'organizer' : 'artist';

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
                        router.push("/(app)/profile");
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
