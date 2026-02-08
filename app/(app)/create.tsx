import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Briefcase, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GigForm } from "@/components/create/GigForm";
import { EventForm } from "@/components/create/EventForm";

export default function CreateListing() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"gig" | "event">("gig");

    const handlePublish = (data: any) => {
        console.log(`Publishing ${activeTab}:`, data);
        router.back();
    };

    const handleCancel = () => {
        router.replace("/dashboard");
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.replace("/dashboard")}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.tabWrapper}>
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
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                        <View style={styles.tabContent}>
                            <Briefcase
                                size={16}
                                color={activeTab === "gig" ? "#FFFFFF" : "#71717A"}
                                strokeWidth={activeTab === "gig" ? 2.5 : 2}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "gig"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
                                ]}
                            >
                                Post a Gig
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
                                colors={['#b835ff52', '#FF8C42']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                        <View style={styles.tabContent}>
                            <Calendar
                                size={16}
                                color={activeTab === "event" ? "#FFFFFF" : "#71717A"}
                                strokeWidth={activeTab === "event" ? 2.5 : 2}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "event"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
                                ]}
                            >
                                Post an Event
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === "gig" ? (
                    <GigForm
                        onPublish={handlePublish}
                        onCancel={handleCancel}
                    />
                ) : (
                    <EventForm
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

    header: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 8 : 12,
    },

    backButton: {
        width: 48,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
    },

    tabWrapper: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 8,
    },

    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 100,
        padding: 4,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },

    tab: {
        flex: 1,
        height: 48,
        borderRadius: 100,
        overflow: 'hidden',
        justifyContent: "center",
        alignItems: "center",
    },

    tabContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        zIndex: 1,
    },

    activeTab: {
        // Handled by Gradient now
    },

    tabText: {
        fontSize: 15,
        fontWeight: "600",
    },

    activeTabText: {
        color: "#FFFFFF",
    },

    inactiveTabText: {
        color: "#71717A",
    },

    content: {
        flex: 1,
    },
});
