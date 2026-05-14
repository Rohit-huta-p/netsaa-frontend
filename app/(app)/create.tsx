import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Briefcase, Calendar, Pencil } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GigForm, GigFormHandle } from "@/components/create/GigForm";
import GigFormV2 from "@/components/create/GigFormV2";
// EventForm is replaced by the 7-step composer at /events/compose (Task 9)
import { useStepBackGuard } from "@/hooks/useStepBackGuard";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export default function CreateListing() {
    const router = useRouter();
    const { gigId, initialTab } = useLocalSearchParams();
    const gigIdValue = Array.isArray(gigId) ? gigId[0] : gigId;
    const isEditing = !!gigIdValue;
    const initialTabValue = (Array.isArray(initialTab) ? initialTab[0] : initialTab) === 'event' ? 'event' : 'gig';
    const [activeTab, setActiveTab] = useState<"gig" | "event">(initialTabValue);

    const gigFormRef = useRef<GigFormHandle>(null);
    // eventFormRef removed — Event tab now routes to /events/compose
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
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Edit-mode: tab switcher hidden (you can't morph a gig into
                    an event mid-edit). Right-aligned "Edit gig" pill replaces
                    it. Create-mode: standard gig/event tab switcher. */}
                {isEditing ? (
                    <>
                        <View style={{ flex: 1 }} />
                        <View style={styles.editPill} accessibilityLabel="edit-gig-indicator">
                            <Pencil size={14} color="#FF8C42" />
                            <Text style={styles.editPillText}>Edit gig</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={styles.tab}
                            onPress={() => setActiveTab("gig")}
                            activeOpacity={0.9}
                        >
                            {activeTab === "gig" && (
                                <LinearGradient
                                    colors={['#b835ff52', '#FF8C42']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.activeTabGradient}
                                />
                            )}
                            <View style={styles.tabContent}>
                                <Briefcase
                                    size={18}
                                    color={activeTab === "gig" ? "#FFFFFF" : "#71717A"}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "gig" ? styles.activeTabText : styles.inactiveTabText,
                                    ]}
                                >
                                    Gig
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.tab}
                            onPress={() => router.push('/events/compose')}
                            activeOpacity={0.9}
                        >
                            {activeTab === "event" && (
                                <LinearGradient
                                    colors={['#FF6B35', '#FF8C42']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.activeTabGradient}
                                />
                            )}
                            <View style={styles.tabContent}>
                                <Calendar
                                    size={18}
                                    color={activeTab === "event" ? "#FFFFFF" : "#71717A"}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "event" ? styles.activeTabText : styles.inactiveTabText,
                                    ]}
                                >
                                    Event
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

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
                ) : null /* Event tab navigates to /events/compose — should not reach here */}
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
    tabContainer: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 24,
        padding: 4,
        height: 48,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 20,
        position: "relative",
    },
    tabContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        zIndex: 1,
    },
    activeTabGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        opacity: 0.8,
    },
    tabText: {
        color: "#71717a",
        fontSize: 14,
        fontWeight: "600",
    },
    activeTabText: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    inactiveTabText: {
        color: "#71717A",
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