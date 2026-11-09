import { Stack, useRouter, usePathname, useGlobalSearchParams } from "expo-router";
import { View } from "react-native";
import useAuthStore from "@/stores/authStore";
import AccountDeletionScheduledModal from "@/components/settings/AccountDeletionScheduledModal";
import BottomNav from "@/components/nav/BottomNav";
import { useModeStore } from "@/stores/modeStore";
import { resolveBootstrapMode } from "@/lib/modeInference";
import { useState, useEffect } from "react";

// Routes guests may browse without an account. Auth-gated *actions* on these
// pages (apply, save, connect, etc.) still trigger the AuthGateSheet.
const PUBLIC_APP_ROUTE_PREFIXES = [
    '/gigs/',
    '/events/',
    '/profile/',
    '/search',
    '/client/',
];

function isPublicAppRoute(path: string): boolean {
    return PUBLIC_APP_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + '/') || path === prefix.replace(/\/$/, ''));
}

/**
 * App Layout - Most routes under (app) require authentication.
 * Public browse routes (gig/event/profile detail, search) are open to guests.
 * Unauthenticated users on private routes are redirected to "/(auth)/login".
 */
export default function AppLayout() {
    const { isHydrated, isAuthLoading, user, accessToken } = useAuthStore();
    const router = useRouter();
    // Must be called unconditionally, before any early return, to satisfy the
    // Rules of Hooks. Used below to hide BottomNav on the /inbox chat view.
    const pathname = usePathname();
    // Global (not local) params: this layout is the parent of /inbox, so the
    // conversation id lives in the global search params, not the local ones.
    const { c: openConversationId } = useGlobalSearchParams<{ c?: string }>();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showDeletionModal, setShowDeletionModal] = useState(false);

    const isPublic = isPublicAppRoute(pathname ?? '');

    // Redirect unauthenticated users to login — but skip public browse routes.
    useEffect(() => {
        if (isHydrated && !isAuthLoading && !accessToken && !isPublic) {
            router.replace('/(auth)/login');
        }
    }, [isHydrated, isAuthLoading, accessToken, isPublic]);

    useEffect(() => {
        if (isHydrated && !isAuthLoading && user) {
            // Check for deletion scheduling first
            if (user.accountStatus === 'scheduled_for_deletion') {
                setShowDeletionModal(true);
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

    // Block non-public routes for unauthenticated users (redirect will fire)
    if (!accessToken && !isPublic) {
        return null;
    }

    // Guests on public routes see the page but no BottomNav.
    // Hide the global BottomNav where it gets in the way of bottom affordances.
    // The /inbox launcher keeps the nav; only an open conversation (?c=<id>,
    // i.e. the full-screen chat on mobile) hides it. The /create flow and the
    // company profile editor both have their own pinned footer, so the nav would
    // collide with it — hide it on those too.
    const hideBottomNav =
        !accessToken ||
        ((pathname?.startsWith('/inbox') ?? false) && !!openConversationId) ||
        pathname === '/create' ||
        (pathname?.startsWith('/client/agency-profile') ?? false);

    return (
        <View className="flex-1">
            <Stack screenOptions={{ headerShown: false }} />

            {!hideBottomNav && <BottomNav />}

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
