import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Pencil } from "lucide-react-native";
import { GigForm, GigFormHandle } from "@/components/create/GigForm";
import { useAuthStore } from "@/stores/authStore";
import GigFormV2 from "@/components/create/GigFormV2";
// Event tab now renders the 7-step composer inline (also routable standalone at /events/compose)
import ComposerShell from "@/components/events/composer/ComposerShell";
import { useStepBackGuard } from "@/hooks/useStepBackGuard";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export default function CreateListing() {
    const router = useRouter();
    const { gigId, initialTab } = useLocalSearchParams();
    const gigIdValue = Array.isArray(gigId) ? gigId[0] : gigId;
    const isEditing = !!gigIdValue;
    // Three-role wall: artists apply to gigs, they don't post them. Events stay open to all roles.
    const role = useAuthStore((s) => s.role);
    const canPostGigs = role !== 'artist';
    const initialTabValue = !canPostGigs ? 'event' : (Array.isArray(initialTab) ? initialTab[0] : initialTab) === 'event' ? 'event' : 'gig';
    // Tab is fixed on entry (via initialTab / role) — no in-page switcher.
    const [activeTab] = useState<"gig" | "event">(initialTabValue);

    const gigFormRef = useRef<GigFormHandle>(null);
    const { newGigForm } = useFeatureFlags();

    // Keep activeTab in a ref so handleBack (read via onBackRef inside the hook)
    // always sees the latest tab without needing useCallback deps.
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    const handlePublish = (data: any) => {
        console.log(`Publishing ${activeTab}:`, data);
        router.replace("/dashboard");
    };

    const handleCancel = () => {
        if (gigId) {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace(`/gigs/${gigIdValue}`);
            }
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace("/dashboard");
            }
        }
    };

    /**
     * Central back handler — called by ALL back sources via useStepBackGuard.
     *
     * NOT wrapped in useCallback: the hook always reads it through onBackRef,
     * so every call to onBackRef.current() gets this fully-fresh function that
     * reads activeTabRef and the latest ref.current from each form.
     *
     * Returns true  → handled (prev step or modal shown), block navigation.
     * Returns false → allow exit.
     */
    const handleBack = (): boolean => {
        if (activeTabRef.current === 'gig' && gigFormRef.current) {
            return gigFormRef.current.handleBack();
        }
        // Event tab now navigates away to /events/compose; no inline step to intercept
        return false;
    };

    // Single hook call — covers Android (BackHandler via useFocusEffect),
    // iOS (navigation.beforeRemove + preventDefault), and Web (popstate).
    useStepBackGuard(handleBack);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header — hidden on the gig create flow: GigFormV2 renders its own
                back button + step title ("The gig" / "Step 1 of 6"). Shown for
                the event composer and for gig edit mode. */}
            {!(activeTab === "gig" && !isEditing) && (
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    {isEditing && (
                        <>
                            <View style={{ flex: 1 }} />
                            <View style={styles.editPill} accessibilityLabel="edit-gig-indicator">
                                <Pencil size={14} color="#FF8C42" />
                                <Text style={styles.editPillText}>Edit gig</Text>
                            </View>
                        </>
                    )}
                </View>
            )}

            {/* Content */}
            <View style={styles.content}>
                {activeTab === "gig" ? (
                    newGigForm ? (
                        <GigFormV2
                            ref={gigFormRef}
                            onPublish={handlePublish}
                            onCancel={handleCancel}
                            gigId={gigIdValue}
                        />
                    ) : (
                        <GigForm
                            ref={gigFormRef}
                            onPublish={handlePublish}
                            onCancel={handleCancel}
                            gigId={gigIdValue}
                        />
                    )
                ) : (
                    /* Event tab — inline 7-step composer (same component as /events/compose route) */
                    <ComposerShell />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    // Edit-mode pill — sits at the right end of the header when editing.
    editPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(255,140,66,0.10)",
        borderWidth: 1,
        borderColor: "rgba(255,140,66,0.35)",
    },
    editPillText: {
        color: "#FF8C42",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
    },
});
