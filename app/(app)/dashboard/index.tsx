// path: app/(app)/organizer/OrganizerHome.tsx

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
    Plus,
    Calendar,
    TrendingUp,
    Users as UsersIcon,
    Briefcase,
    Clock,
    MapPin,
    Sparkles,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import AppScrollView from "@/components/AppScrollView";
import useAuthStore from "@/stores/authStore";
import { useOrganizerEvents } from "@/hooks/useEvents";
import { useOrganizerGigs } from "@/hooks/useGigs";
import { LoadingAnimation } from "@/components/ui/LoadingAnimation";

/* -------------------------------------------------------------------------- */
/*                               SKELETON UI                                  */
/* -------------------------------------------------------------------------- */

const SkeletonBox = ({ h = 16, w = "100%" }: any) => (
    <View
        className="bg-zinc-800/50 rounded-lg mb-3 animate-pulse"
        style={{ height: h, width: w }}
    />
);

const EventSkeleton = () => (
    <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 mb-4">
        <SkeletonBox h={14} w="30%" />
        <SkeletonBox h={20} />
        <SkeletonBox h={14} w="70%" />
        <SkeletonBox h={14} w="40%" />
    </View>
);

/* -------------------------------------------------------------------------- */
/*                              COMPONENTS                                    */
/* -------------------------------------------------------------------------- */

const Badge = ({ status }: any) => {
    const colors: Record<string, { bg: string; text: string }> = {
        Open: { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981" },
        Published: { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6" },
        Draft: { bg: "rgba(161, 161, 170, 0.15)", text: "#A1A1AA" },
        Closed: { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444" },
    };

    const style = colors[status] || colors.Draft;

    return (
        <View
            className="px-3 py-1.5 rounded-full self-start"
            style={{ backgroundColor: style.bg }}
        >
            <Text
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: style.text }}
            >
                {status}
            </Text>
        </View>
    );
};

const ItemCard = ({ item, onPress, onOpenApplicants }: any) => {
    const isGig = item.type === "gig";

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 mb-4 hover:border-white/20 transition-all"
        >
            <View className="flex-row items-center justify-between mb-3">
                <Badge status={item.status} />
                <View className="flex-row items-center gap-2">
                    {isGig ? (
                        <Briefcase size={14} color="#FF6B35" />
                    ) : (
                        <Calendar size={14} color="#FF6B35" />
                    )}
                    <Text className="text-[#FF6B35] text-xs font-black uppercase tracking-wider">
                        {item.type}
                    </Text>
                </View>
            </View>

            <Text className="text-white text-xl font-black tracking-tight mb-3">
                {item.title}
            </Text>

            <View className="flex-row items-center mb-2">
                <Clock size={14} color="rgba(255, 255, 255, 0.5)" />
                <Text className="text-zinc-400 text-sm ml-2 font-light">
                    {item.date}
                </Text>
            </View>

            <View className="flex-row items-center mb-4">
                <MapPin size={14} color="rgba(255, 255, 255, 0.5)" />
                <Text className="text-zinc-400 text-sm ml-2 font-light">
                    {item.location}
                </Text>
            </View>

            <View className="h-px bg-white/10 mb-4" />

            <View className="flex-row items-center justify-between">
                <Text className="text-white font-bold text-lg">
                    {item.price}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onOpenApplicants(item.id)}
                    className="px-5 py-3 rounded-xl"
                    style={{ backgroundColor: "rgba(255, 107, 53, 0.15)" }}
                >
                    <Text className="text-[#FF6B35] font-bold text-sm">
                        {item.applicants} {isGig ? "Applications" : "Registrations"}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const StatCard = ({ icon: Icon, label, value, bg, color }: any) => (
    <View className="flex-row items-center mb-5">
        <View
            className="w-12 h-12 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: bg }}
        >
            <Icon size={20} color={color} />
        </View>
        <View>
            <Text className="text-white font-black text-2xl tracking-tight">
                {value}
            </Text>
            <Text className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                {label}
            </Text>
        </View>
    </View>
);

/* -------------------------------------------------------------------------- */
/*                              MAIN SCREEN                                   */
/* -------------------------------------------------------------------------- */

export default function OrganizerHome() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { width, height } = useWindowDimensions();

    const isTablet = width >= 768;

    // Data Fetching
    const {
        data: eventsData,
        isLoading: isLoadingEvents,
        refetch: refetchEvents,
    } = useOrganizerEvents(user?._id || "");
    const {
        data: gigsData,
        isLoading: isLoadingGigs,
        refetch: refetchGigs,
    } = useOrganizerGigs(user?._id || "");

    // Refetch on Focus
    useFocusEffect(
        useCallback(() => {
            if (user?._id) {
                refetchEvents();
                refetchGigs();
            }
        }, [user?._id, refetchEvents, refetchGigs])
    );

    // Combine and Normalize Data
    const dashboardItems = React.useMemo(() => {
        const items: any[] = [];

        if (eventsData) {
            eventsData.forEach((event: any) => {
                items.push({
                    id: event._id,
                    type: "event",
                    title: event.title,
                    date: event.schedule?.startDate
                        ? new Date(event.schedule.startDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                        )
                        : "TBD",
                    location: event.location?.city || "Online",
                    status: event.status
                        ? event.status.charAt(0).toUpperCase() + event.status.slice(1)
                        : "Draft",
                    price:
                        event.ticketPrice && Number(event.ticketPrice) > 0
                            ? `₹${event.ticketPrice}`
                            : "Free",
                    applicants: event.registrationsCount || 0,
                    originalData: event,
                });
            });
        }

        if (gigsData) {
            (gigsData as any[]).forEach((gig: any) => {
                items.push({
                    id: gig._id,
                    type: "gig",
                    title: gig.title,
                    date: gig.applicationDeadline
                        ? `Deadline: ${new Date(
                            gig.applicationDeadline
                        ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}`
                        : "No Deadline",
                    location: gig.location?.city || "Remote",
                    status: gig.status
                        ? gig.status.charAt(0).toUpperCase() + gig.status.slice(1)
                        : "Draft",
                    price: gig.compensation?.amount
                        ? `₹${gig.compensation.amount}`
                        : "Unpaid",
                    applicants: gig.stats?.applications || 0,
                    originalData: gig,
                });
            });
        }

        return items;
    }, [eventsData, gigsData]);

    const isLoading = isLoadingEvents || isLoadingGigs;

    const handleCardPress = (item: any) => {
        if (item.type === "event") {
            router.push(`/(app)/events/${item.id}`);
        } else if (item.type === "gig") {
            router.push(`/(app)/gigs/${item.id}`);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#000000" }}>
            {/* ORGANIZER GRADIENT SPOTLIGHT */}
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    width: width,
                    left: 0,
                    height: height * 0.5,
                    pointerEvents: "none",
                }}
            >
                <LinearGradient
                    colors={[
                        "rgba(255, 107, 53, 0.18)",
                        "rgba(255, 107, 53, 0.08)",
                        "transparent",
                    ]}
                    locations={[0, 0.4, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{ width: "100%", height: "100%" }}
                />
            </View>

            <AppScrollView className="bg-transparent">
                <View
                    style={{
                        paddingHorizontal: width < 768 ? 20 : 40,
                        paddingTop: 120,
                        paddingBottom: 40,
                        gap: 32,
                    }}
                >
                    {/* HEADER */}
                    <View>
                        <Text className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-2">
                            Organizer Dashboard
                        </Text>
                        <Text className="text-white text-5xl font-black tracking-tighter mb-3">
                            Welcome back,
                        </Text>
                        <Text className="text-white/60 text-2xl font-light tracking-tight">
                            {user?.displayName || "Organizer"} 👋
                        </Text>
                        <Text className="text-zinc-500 mt-4 text-base font-light">
                            Manage your events, gigs, and grow your community.
                        </Text>

                        <View
                            className="mt-8"
                            style={{
                                flexDirection: width < 640 ? "column" : "row",
                                gap: 16,
                            }}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => router.push("/(app)/create")}
                            >
                                <LinearGradient
                                    colors={["#FF6B35", "#FF8C42"]}
                                    start={[0, 0]}
                                    end={[1, 0]}
                                    className="rounded-xl px-6 py-4 flex-row items-center justify-center"
                                    style={{
                                        shadowColor: "#FF6B35",
                                        shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: 0.3,
                                        shadowRadius: 16,
                                    }}
                                >
                                    <Plus size={20} color="#fff" />
                                    <Text className="text-white font-black ml-3 text-base tracking-tight">
                                        Post a Gig / Event
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => router.push("/(app)/events/manage")}
                                className="px-6 py-4 rounded-xl items-center justify-center border border-white/10 bg-white/5"
                            >
                                <Text className="text-white font-bold tracking-tight">
                                    Manage All Posts
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* MAIN CONTENT */}
                    <View
                        style={{
                            flexDirection: isTablet ? "row" : "column",
                            gap: 24,
                        }}
                    >
                        {/* EVENTS & GIGS LIST */}
                        <View style={{ flex: 2, gap: 20 }}>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-white text-2xl font-black tracking-tight">
                                    Your Posts
                                </Text>
                                <View className="px-3 py-1.5 rounded-full bg-[#FF6B35]/15">
                                    <Text className="text-[#FF6B35] text-xs font-black uppercase tracking-wider">
                                        {dashboardItems.length} Active
                                    </Text>
                                </View>
                            </View>

                            {isLoading ? (
                                <View className="py-12">
                                    <LoadingAnimation
                                        source="https://lottie.host/ecebcd4d-d1c9-4e57-915f-d3f61705a717/VFWGhqMAX0.lottie"
                                        width={200}
                                        height={200}
                                    />
                                    <Text className="text-zinc-500 text-center mt-4 text-xs font-medium">
                                        Loading your posts...
                                    </Text>
                                </View>
                            ) : dashboardItems.length > 0 ? (
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 24 }}
                                >
                                    {dashboardItems.map((item) => (
                                        <ItemCard
                                            key={item.id}
                                            item={item}
                                            onPress={() => handleCardPress(item)}
                                            onOpenApplicants={(id: string) => {
                                                handleCardPress(item);
                                            }}
                                        />
                                    ))}
                                </ScrollView>
                            ) : (
                                <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-12 items-center justify-center">
                                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-[#FF6B35]/10 border border-[#FF6B35]/20">
                                        <Sparkles size={32} color="#FF6B35" />
                                    </View>
                                    <Text className="text-white font-black text-xl text-center mb-2 tracking-tight">
                                        No Posts Yet
                                    </Text>
                                    <Text className="text-zinc-400 text-center mb-6 font-light">
                                        Create your first event or gig to get started.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => router.push("/(app)/create")}
                                        className="px-6 py-3 rounded-xl"
                                        style={{ backgroundColor: "rgba(255, 107, 53, 0.15)" }}
                                    >
                                        <Text className="text-[#FF6B35] font-bold">
                                            Create Your First Post
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* INSIGHTS SIDEBAR */}
                        <View style={{ flex: 1 }}>
                            <View className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
                                <Text className="text-white font-black text-xl tracking-tight mb-6">
                                    Quick Insights
                                </Text>

                                <StatCard
                                    icon={Calendar}
                                    label="Total Events"
                                    value={
                                        dashboardItems.filter((i) => i.type === "event")
                                            .length
                                    }
                                    bg="rgba(59, 130, 246, 0.15)"
                                    color="#3B82F6"
                                />

                                <StatCard
                                    icon={Briefcase}
                                    label="Total Gigs"
                                    value={
                                        dashboardItems.filter((i) => i.type === "gig")
                                            .length
                                    }
                                    bg="rgba(255, 107, 53, 0.15)"
                                    color="#FF6B35"
                                />

                                <StatCard
                                    icon={UsersIcon}
                                    label="Total Applicants"
                                    value={dashboardItems.reduce(
                                        (sum, i) => sum + i.applicants,
                                        0
                                    )}
                                    bg="rgba(16, 185, 129, 0.15)"
                                    color="#10B981"
                                />

                                <StatCard
                                    icon={TrendingUp}
                                    label="This Month"
                                    value="₹15,000"
                                    bg="rgba(139, 92, 246, 0.15)"
                                    color="#8B5CF6"
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </AppScrollView>
        </View>
    );
}