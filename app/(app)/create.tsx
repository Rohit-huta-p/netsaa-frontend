import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Briefcase, Calendar, Pencil } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GigForm, GigFormHandle } from "@/components/create/GigForm";
import { useAuthStore } from "@/stores/authStore";
import GigFormV2 from "@/components/create/GigFormV2";
// Event tab now renders the 7-step composer inline (also routable standalone at /events/compose)
import ComposerShell from "@/components/events/composer/ComposerShell";
import { useStepBackGuard } from "@/hooks/useStepBackGuard";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

// Fixed per-tab width so the sliding spotlight travels a known distance.
const TAB_W = 92;

export default function CreateListing() {
    const router = useRouter();
    const { gigId, initialTab } = useLocalSearchParams();
    const gigIdValue = Array.isArray(gigId) ? gigId[0] : gigId;
    const isEditing = !!gigIdValue;
    // Three-role wall: artists apply to gigs, they don't post them. Events stay open to all roles.
    const role = useAuthStore((s) => s.role);
    const canPostGigs = role !== 'artist';
    const initialTabValue = !canPostGigs ? 'event' : (Array.isArray(initialTab) ? initialTab[0] : initialTab) === 'event' ? 'event' : 'gig';
    const [activeTab, setActiveTab] = useState<"gig" | "event">(initialTabValue);

    const gigFormRef = useRef<GigFormHandle>(null);
    const { newGigForm } = useFeatureFlags();

    // Tabs available in the Spotlight switcher. Artists only ever see Event.
    const TABS: ('gig' | 'event')[] = canPostGigs ? ['gig', 'event'] : ['event'];
    const activeIndex = Math.max(0, TABS.indexOf(activeTab));

    // Sliding spotlight — a single warm glow that travels to the active tab
    // instead of two separate per-tab gradients fading in/out.
    const glowTX = useRef(new Animated.Value(activeIndex * TAB_W)).current;
    useEffect(() => {
        Animated.timing(glowTX, {
            toValue: activeIndex * TAB_W,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [activeIndex, glowTX]);

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

    const renderTab = (key: 'gig' | 'event') => {
        const isActive = activeTab === key;
        const Icon = key === 'gig' ? Briefcase : Calendar;
        return (
            <TouchableOpacity
                key={key}
                style={styles.spotlightTab}
                onPress={() => setActiveTab(key)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={key === 'gig' ? 'Gig' : 'Event'}
            >
                <Icon size={16} color={isActive ? '#FFFFFF' : '#6A6A76'} />
                <Text style={[styles.spotlightText, isActive ? styles.spotlightTextOn : null]}>
                    {key === 'gig' ? 'Gig' : 'Event'}
                </Text>
            </TouchableOpacity>
        );
    };

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
                    it. Create-mode: Spotlight gig/event switcher, centered. */}
                {isEditing ? (
                    <>
                        <View style={{ flex: 1 }} />
                        <View style={styles.editPill} accessibilityLabel="edit-gig-indicator">
                            <Pencil size={14} color="#FF8C42" />
                            <Text style={styles.editPillText}>Edit gig</Text>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.tabWrap}>
                            <View style={styles.spotlightPill}>
                                {/* The travelling spotlight — glow bloom + gradient sheen */}
                                <Animated.View
                                    pointerEvents="none"
                                    style={[
                                        styles.spotlight,
                                        { width: TAB_W, transform: [{ translateX: glowTX }] },
                                    ]}
                                >
                                    <LinearGradient
                                        colors={['#FF6B35', '#FF8C42']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                </Animated.View>
                                {TABS.map(renderTab)}
                            </View>
                        </View>
                        <View style={styles.headerSpacer} />
                    </>
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
    // Centers the pill in the space between the back button and the matching
    // right-hand spacer.
    tabWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    headerSpacer: { width: 40, height: 40 },
    // ── Spotlight switcher ──
    spotlightPill: {
        flexDirection: "row",
        padding: 4,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        position: "relative",
        overflow: "hidden",
    },
    spotlight: {
        position: "absolute",
        top: 4,
        left: 4,
        bottom: 4,
        borderRadius: 18,
        overflow: "hidden",
        shadowColor: "#FF6B35",
        shadowOpacity: 0.55,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
    },
    spotlightTab: {
        width: TAB_W,
        height: 36,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 18,
        zIndex: 1,
    },
    spotlightText: {
        color: "#6A6A76",
        fontFamily: "Outfit-SemiBold",
        fontSize: 14,
        letterSpacing: -0.2,
    },
    spotlightTextOn: { color: "#FFFFFF" },
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
