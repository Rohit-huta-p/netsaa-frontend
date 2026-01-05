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
import { ChevronLeft } from "lucide-react-native";
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
                        style={[
                            styles.tab,
                            activeTab === "gig" && styles.activeTab,
                        ]}
                        onPress={() => setActiveTab("gig")}
                    >
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
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "event" && styles.activeTab,
                        ]}
                        onPress={() => setActiveTab("event")}
                    >
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
        paddingHorizontal: 24,
        paddingVertical: 16,
    },

    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: "#27272A", // zinc-800
    },

    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },

    activeTab: {
        backgroundColor: "#1A1A1F", // netsa-background equivalent
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    tabText: {
        fontSize: 14,
        fontWeight: "500",
    },

    activeTabText: {
        color: "#FFFFFF",
    },

    inactiveTabText: {
        color: "#71717A", // zinc-500
    },

    content: {
        flex: 1,
    },
});
