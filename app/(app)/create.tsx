import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Briefcase, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GigForm, GigFormHandle } from "@/components/create/GigForm";
import { EventForm, EventFormHandle } from "@/components/create/EventForm";

import { useNavigation } from "expo-router";

export default function CreateListing() {
    const router = useRouter();
    const { gigId } = useLocalSearchParams();
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<"gig" | "event">("gig");
    const gigFormRef = React.useRef<GigFormHandle>(null);
    const eventFormRef = React.useRef<EventFormHandle>(null);

    const handlePublish = (data: any) => {
        console.log(`Publishing ${activeTab}:`, data);
        router.replace("/dashboard");
    };

    const handleCancel = () => {
        if (gigId) {
            // Editing - go back to details
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace(`/gigs/${Array.isArray(gigId) ? gigId[0] : gigId}`);
            }
        } else {
            // Creating - go back to dashboard
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace("/dashboard");
            }
        }
    };

    // Intercept back action
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // If we are already navigating away (e.g. via handleCancel), don't intercept
            const action = e.data.action;

            if (activeTab === 'gig' && gigFormRef.current) {
                const shouldBlock = gigFormRef.current.handleBack();
                if (shouldBlock) {
                    e.preventDefault();
                }
            } else if (activeTab === 'event' && eventFormRef.current) {
                const shouldBlock = eventFormRef.current.handleBack();
                if (shouldBlock) {
                    e.preventDefault();
                }
            }
        });

        return unsubscribe;
    }, [navigation, activeTab]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header & Tabs Row */}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={() => {
                        if (activeTab === 'gig' && gigFormRef.current) {
                            gigFormRef.current.handleBack();
                        } else if (activeTab === 'event' && eventFormRef.current) {
                            eventFormRef.current.handleBack();
                        } else {
                            router.replace("/dashboard");
                        }
                    }}
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
                                    activeTab === "gig"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
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
                                    activeTab === "event"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
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
