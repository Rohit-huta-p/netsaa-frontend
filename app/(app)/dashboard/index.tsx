// path: app/(app)/organizer/OrganizerHome.tsx

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
    Plus,
    Calendar,
    TrendingUp,
    Bell,
    MapPin,
    Users as UsersIcon,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import AppScrollView from "@/components/AppScrollView";
import useAuthStore from "@/stores/authStore";
import { useOrganizerEvents } from "@/hooks/useEvents";
import { useOrganizerGigs } from "@/hooks/useGigs";

/* -------------------------------------------------------------------------- */
/*                               MOCK DATA                                    */
/* -------------------------------------------------------------------------- */

const MOCK_EVENTS = [
    {
        id: "1",
        title: "Contemporary Dance Workshop",
        date: "Dec 15, 2025 • 7:00 PM",
        location: "Mumbai",
        status: "Open",
        price: "₹2,500/-",
        applicants: 24,
    },
    {
        id: "2",
        title: "Hip-Hop Battle Championship",
        date: "Dec 18, 2025 • 6:00 PM",
        location: "Bangalore",
        status: "Open",
        price: "₹3,000/-",
        applicants: 156,
    },
];

/* -------------------------------------------------------------------------- */
/*                              SKELETON UI                                   */
/* -------------------------------------------------------------------------- */

const SkeletonBox = ({ h = 16, w = "100%" }: any) => (
    <View
        className="bg-[#2C2C32] rounded-md mb-3"
        style={{ height: h, width: w }}
    />
);

const EventSkeleton = () => (
    <View className="bg-[#2C2C32] rounded-xl p-4 mb-4">
        <SkeletonBox h={14} w="30%" />
        <SkeletonBox h={20} />
        <SkeletonBox h={14} w="70%" />
        <SkeletonBox h={14} w="40%" />
    </View>
);

/* -------------------------------------------------------------------------- */
/*                              COMPONENTS                                    */
/* -------------------------------------------------------------------------- */

const Badge = ({ status }: any) => (
    <View
        className="px-3 py-1 rounded-full self-start"
        style={{
            backgroundColor:
                status === "Open"
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(229,231,235,0.3)",
        }}
    >
        <Text
            className="text-xs font-semibold"
            style={{ color: status === "Open" ? "#818CF8" : "#9CA3AF" }}
        >
            {status}
        </Text>
    </View>
);

const EventCard = ({ event, onPress, onOpenApplicants }: any) => (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="bg-[#2C2C32] rounded-xl p-4">
        <Badge status={event.status} />

        <Text className="text-[#FCE4EC] text-lg font-semibold mt-2">
            {event.title}
        </Text>

        <View className="flex-row items-center mt-2">
            <Calendar size={14} color="#9CA3AF" />
            <Text className="text-[#FCE4EC] text-sm ml-2">{event.date}</Text>
        </View>

        <View className="flex-row items-center mt-1">
            <MapPin size={14} color="#9CA3AF" />
            <Text className="text-[#FCE4EC] text-sm ml-2">
                {event.location}
            </Text>
        </View>

        <Text className="text-[#FCE4EC] font-semibold mt-3">
            {event.price}
        </Text>

        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpenApplicants(event.id)}
            className="mt-4 px-4 py-3 rounded-xl bg-[#F8F0FF]"
        >
            <Text className="text-[#7C3AED] font-semibold text-center">
                View Applicants ({event.applicants})
            </Text>
        </TouchableOpacity>
    </TouchableOpacity>
);

const StatCard = ({ icon: Icon, label, value, bg, color }: any) => (
    <View className="flex-row items-center mb-4">
        <View
            className="w-10 h-10 rounded-md items-center justify-center mr-3"
            style={{ backgroundColor: bg }}
        >
            <Icon size={16} color={color} />
        </View>
        <View>
            <Text className="text-[#FCE4EC] font-bold">{value}</Text>
            <Text className="text-[#FCE4EC] text-xs">{label}</Text>
        </View>
    </View>
);

/* -------------------------------------------------------------------------- */
/*                              MAIN SCREEN                                   */
/* -------------------------------------------------------------------------- */

export default function OrganizerHome() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();

    const isTablet = width >= 768;

    // Data Fetching
    const { data: eventsData, isLoading: isLoadingEvents, refetch: refetchEvents } = useOrganizerEvents(user?._id || '');
    const { data: gigsData, isLoading: isLoadingGigs, refetch: refetchGigs } = useOrganizerGigs(user?._id || '');

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
    // We want a unified list of "Items" to show in "Your Events"
    const dashboardItems = React.useMemo(() => {
        const items: any[] = [];

        if (eventsData) {
            eventsData.forEach((event: any) => {
                items.push({
                    id: event._id,
                    type: 'event',
                    title: event.title,
                    date: event.schedule?.startDate ? new Date(event.schedule.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD',
                    location: event.location?.city || 'Online',
                    status: event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Draft',
                    price: event.ticketPrice && Number(event.ticketPrice) > 0 ? `₹${event.ticketPrice}` : 'Free', // Assuming ticketPrice exists on IEvent or we need to derive it
                    applicants: event.registrationsCount || 0, // Assuming backend provides this
                    originalData: event
                });
            });
        }

        if (gigsData) {
            (gigsData as any[]).forEach((gig: any) => {
                items.push({
                    id: gig._id,
                    type: 'gig',
                    title: gig.title,
                    date: gig.applicationDeadline ? `Deadline: ${new Date(gig.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No Deadline',
                    location: gig.location?.city || 'Remote',
                    status: gig.status ? gig.status.charAt(0).toUpperCase() + gig.status.slice(1) : 'Draft',
                    price: gig.compensation?.amount ? `₹${gig.compensation.amount}` : 'Unpaid',
                    applicants: gig.stats?.applications || 0,
                    originalData: gig
                });
            });
        }

        // Sort by most recently created or relevant date?
        // Let's just return them mixed for now, maybe sorted by creation if available
        return items;
    }, [eventsData, gigsData]);

    const isLoading = isLoadingEvents || isLoadingGigs;


    const handleCardPress = (item: any) => {
        if (item.type === 'event') {
            router.push(`/(app)/events/${item.id}`);
        } else if (item.type === 'gig') {
            router.push(`/(app)/gigs/${item.id}`);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <AppScrollView className="bg-[#1A1A1F]">
                <View
                    style={{
                        paddingHorizontal: width < 768 ? 16 : 32,
                        paddingVertical: 24,
                        gap: 20,
                    }}
                >
                    {/* HEADER */}
                    <View>
                        <Text className="text-[#FCE4EC] text-sm">
                            Welcome back,
                        </Text>
                        <Text className="text-3xl font-extrabold text-[#FCE4EC] mt-1">
                            Hi, {user?.displayName || "Rohit"} 👋
                        </Text>
                        <Text className="text-[#FCE4EC] mt-2">
                            Manage your events and grow your community
                        </Text>

                        <View
                            className="mt-5"
                            style={{
                                flexDirection: width < 640 ? "column" : "row",
                                gap: 12,
                            }}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => router.push("/(app)/create")}
                            >
                                <LinearGradient
                                    colors={["#7C3AED", "#F97316"]}
                                    start={[0, 0]}
                                    end={[1, 0]}
                                    className="rounded-lg px-5 py-4 flex-row items-center justify-center"
                                >
                                    <Plus size={18} color="#fff" />
                                    <Text className="text-white font-semibold ml-3">
                                        Post a Gig / Event
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() =>
                                    router.push("/(app)/events/manage")
                                }
                                className="px-5 py-4 rounded-lg items-center justify-center bg-white"
                            >
                                <Text className="text-gray-700 font-semibold">
                                    Manage Events
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* MAIN CONTENT */}
                    <View
                        style={{
                            flexDirection: isTablet ? "row" : "column",
                            gap: 20,
                        }}
                    >
                        {/* EVENTS */}
                        <View style={{ flex: 2, gap: 14 }}>
                            <Text className="text-[#FCE4EC] text-lg font-semibold">
                                Your Events & Gigs
                            </Text>

                            {isLoading
                                ? Array.from({ length: 2 }).map((_, i) => (
                                    <EventSkeleton key={i} />
                                ))
                                : dashboardItems.length > 0 ? (
                                    dashboardItems.map((item) => (
                                        <EventCard
                                            key={item.id}
                                            event={item}
                                            onPress={() => handleCardPress(item)}
                                            onOpenApplicants={(id: string) => {
                                                // Handle navigation to details/applicants
                                                handleCardPress(item);
                                            }}
                                        />
                                    ))
                                ) : (
                                    <View className="bg-[#2C2C32] rounded-xl p-8 items-center justify-center">
                                        <Text className="text-zinc-400 mb-2">No events or gigs yet.</Text>
                                        <TouchableOpacity onPress={() => router.push("/(app)/create")}>
                                            <Text className="text-indigo-400 font-medium">Create your first one!</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                        </View>

                        {/* SIDEBAR */}
                        <View style={{ flex: 1 }}>
                            <View className="bg-[#2C2C32] rounded-xl p-4">
                                <Text className="text-[#FCE4EC] font-semibold mb-4">
                                    Quick Insights
                                </Text>

                                <StatCard
                                    icon={Calendar}
                                    label="Total Events"
                                    value={String(dashboardItems.length)}
                                    bg="#F3E8FF"
                                    color="#7C3AED"
                                />

                                <StatCard
                                    icon={UsersIcon}
                                    label="Clients"
                                    value="44"
                                    bg="#FFF0F6"
                                    color="#EC4899"
                                />

                                <StatCard
                                    icon={TrendingUp}
                                    label="Monthly Earnings"
                                    value="₹15,000"
                                    bg="#FFF7ED"
                                    color="#FB923C"
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </AppScrollView>
        </View>
    );
}
