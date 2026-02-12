import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Briefcase, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GigForm, GigFormHandle } from "@/components/create/GigForm";
import { EventForm, EventFormHandle } from "@/components/create/EventForm";
import { useStepBackGuard } from "@/hooks/useStepBackGuard";

export default function CreateListing() {
    const router = useRouter();
    const { gigId } = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState<"gig" | "event">("gig");

    const gigFormRef = useRef<GigFormHandle>(null);
    const eventFormRef = useRef<EventFormHandle>(null);

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
                router.replace(`/gigs/${Array.isArray(gigId) ? gigId[0] : gigId}`);
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
        if (activeTabRef.current === 'event' && eventFormRef.current) {
            return eventFormRef.current.handleBack();
        }
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

                {/* Tab Switcher */}
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
                        onPress={() => setActiveTab("event")}
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
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === "gig" ? (
                    <GigForm
                        ref={gigFormRef}
                        onPublish={handlePublish}
                        onCancel={handleCancel}
                        gigId={Array.isArray(gigId) ? gigId[0] : gigId}
                    />
                ) : (
                    <EventForm
                        ref={eventFormRef}
                        onPublish={handlePublish}
                        onCancel={handleCancel}
                    />
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
    content: {
        flex: 1,
    },
});