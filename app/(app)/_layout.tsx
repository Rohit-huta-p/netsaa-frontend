import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import useAuthStore from "@/stores/authStore";
import ProfileCompletionModal from "@/components/common/ProfileCompletionModal";
import { computeOverallScore, computeMissing } from "@/components/profile/ProfileStrengthWidget";
import { useState, useEffect } from "react";

/**
 * App Layout - All routes under (app) are now publicly accessible.
 * Protected actions (apply, save, connect) are guarded at the action level using requireAuth().
 */
export default function AppLayout() {
    const { isHydrated, isAuthLoading, user } = useAuthStore();
    const router = useRouter();
    const [showProfileModal, setShowProfileModal] = useState(false);

    const isArtist = user?.roles?.includes("artist") || user?.role === "artist";
    const score = isArtist && user ? computeOverallScore(user) : 100;
    const missing = isArtist && user ? computeMissing(user) : [];

    useEffect(() => {
        if (isHydrated && !isAuthLoading && isArtist && missing.length > 0) {
            setShowProfileModal(true);
        }
    }, [isHydrated, isAuthLoading]);

    // Wait for auth state to hydrate before rendering
    if (!isHydrated || isAuthLoading) {
        return null; // Or a loading spinner
    }

    // No auth redirect - pages are publicly accessible
    // Protected actions use requireAuth() utility
    return (
        <View className="flex-1">
            <Stack screenOptions={{ headerShown: false }} />

            {/* Profile completion modal — artists with incomplete profiles */}
            {showProfileModal && (
                <ProfileCompletionModal
                    index={true}
                    visible={true}
                    score={score}
                    missing={missing}
                    onClose={() => { setShowProfileModal(false); }}
                    onGoToProfile={() => {
                        setShowProfileModal(false);
                        router.push("/(app)/profile");
                    }}
                />
            )}
        </View>
    );
}

