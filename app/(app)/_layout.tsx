import { Stack } from "expo-router";
import useAuthStore from "@/stores/authStore";

/**
 * App Layout - All routes under (app) are now publicly accessible.
 * Protected actions (apply, save, connect) are guarded at the action level using requireAuth().
 */
export default function AppLayout() {
    const { isHydrated, isAuthLoading } = useAuthStore();

    // Wait for auth state to hydrate before rendering
    if (!isHydrated || isAuthLoading) {
        return null; // Or a loading spinner
    }

    // No auth redirect - pages are publicly accessible
    // Protected actions use requireAuth() utility
    return <Stack screenOptions={{ headerShown: false }} />;
}
