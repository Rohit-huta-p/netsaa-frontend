import { Stack, useRouter, usePathname } from "expo-router";
import { View } from "react-native";
import useAuthStore from "@/stores/authStore";
import ProfileCompletionModal from "@/components/common/ProfileCompletionModal";
import AccountDeletionScheduledModal from "@/components/settings/AccountDeletionScheduledModal";
import { computeOverallScore, computeMissing, computeOrganizerScore, computeOrganizerMissing } from "@/components/profile/ProfileStrengthWidget";
import BottomNav from "@/components/nav/BottomNav";
import { useModeStore } from "@/stores/modeStore";
import { resolveBootstrapMode } from "@/lib/modeInference";
import { useState, useEffect } from "react";

/**
 * App Layout - All routes under (app) require authentication.
 * Unauthenticated users are redirected to "/(auth)/login" (a protected route
 * should bounce to login, not the marketing landing). The bare root "/" is
 * what shows the landing page — see app/index.tsx.
 */
export default function AppLayout() {
    const { isHydrated, isAuthLoading, user, accessToken } = useAuthStore();
    const router = useRouter();
    // Must be called unconditionally, before any early return, to satisfy the
    // Rules of Hooks. Used below to hide BottomNav on /messages.
    const pathname = usePathname();
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
     * Mode bootstrap — spec §2.4 mode resolution.
     *
     *   Layer 1 (local, persistent): zustand persist rehydrates the last mode
     *     BEFORE this effect runs. If the user has explicitly switched mode on
     *     this device (modeExplicitlyChosen), that choice is authoritative.
     *   Layer 2 (server mirror): user.lastActiveMode only SEEDS mode on a device
     *     with no explicit local choice yet (fresh login / new device).
     *
     * Biasing to the local explicit choice — rather than re-applying the server
     * value on every boot — fixes the bug where switching to Hirer reverted to
     * Artist after a web refresh: this effect re-runs on every web reload because
     * hasBootstrappedMode is in-memory only, so it must not clobber a deliberate
     * on-device switch. See resolveBootstrapMode().
     */
    useEffect(() => {
        if (!isHydrated || isAuthLoading || !user) return;
        const { hasBootstrappedMode, modeExplicitlyChosen, mode, setBootstrapped } = useModeStore.getState();
        if (hasBootstrappedMode) return;

        const resolved = resolveBootstrapMode({
            localMode: mode,
            modeExplicitlyChosen,
            serverMode: (user as any).lastActiveMode,
        });
        // Raw seed (not a user choice) — setState directly so it does not pin
        // modeExplicitlyChosen; a fresh device should still defer to the server.
        if (resolved !== mode) {
            useModeStore.setState({ mode: resolved });
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

    // Hide the global BottomNav on routes where it gets in the way of bottom
    // affordances (e.g. /messages compose box, full-screen chat).
    const hideBottomNav = pathname?.startsWith('/messages') ?? false;

    return (
        <View className="flex-1">
            <Stack screenOptions={{ headerShown: false }} />

            {!hideBottomNav && <BottomNav />}

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
