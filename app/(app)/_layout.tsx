import { Stack, Redirect } from "expo-router";
import useAuthStore from "@/stores/authStore";

export default function AppLayout() {
    const { accessToken, isHydrated, isAuthLoading } = useAuthStore();

    if (!isHydrated || isAuthLoading) {
        return null; // Or a loading spinner
    }

    if (!accessToken) {
        return <Redirect href="/" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
