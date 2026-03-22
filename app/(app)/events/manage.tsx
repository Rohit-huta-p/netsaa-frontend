import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, useWindowDimensions } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
    ChevronLeft,
    Search,
    Calendar,
    Briefcase,
    MapPin,
    Clock,
    Filter,
    Sparkles
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import AppScrollView from "@/components/AppScrollView";
import useAuthStore from "@/stores/authStore";
import { useOrganizerEvents } from "@/hooks/useEvents";
import { useOrganizerGigs } from "@/hooks/useGigs";
import { LoadingAnimation } from "@/components/ui/LoadingAnimation";
import { Badge } from "@/components/ui/Badge";


/* -------------------------------------------------------------------------- */
/*                              COMPONENTS                                    */
/* -------------------------------------------------------------------------- */



const ItemCard = ({ item, onPress, onOpenApplicants }: any) => {
    const isGig = item.type === "gig";

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            className="bg-zinc-900/40 border border-white/10 rounded-2xl p-3 mb-2 hover:border-white/20 transition-all"
        >
            <View className="flex-row items-center justify-between mb-1">
                <Badge status={item.status} textClassName="text-[8px]" />
                <View className="flex-row items-center gap-2">
                    {isGig ? (
                        <Briefcase size={12} color="#FF6B35" />
                    ) : (
                        <Calendar size={12} color="#FF6B35" />
                    )}
                    <Text className="text-[#FF6B35] text-[10px] font-black uppercase tracking-wider">
                        {item.type}
                    </Text>
                </View>
            </View>

            <Text className="text-white font-black tracking-tight text-base mb-1">
                {item.title}
            </Text>

            <View className="flex-row items-center mb-1">
                <Clock size={12} color="rgba(255, 255, 255, 0.5)" />
                <Text className="text-zinc-400 ml-2 font-light text-xs">
                    {item.date}
                </Text>
            </View>

            <View className="flex-row items-center mb-1">
                <MapPin size={12} color="rgba(255, 255, 255, 0.5)" />
                <Text className="text-zinc-400 ml-2 font-light text-xs">
                    {item.location}
                </Text>
            </View>

            <View className="flex-row items-center justify-between mt-1">
                <Text className="text-white font-bold text-base">
                    {item.price}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onOpenApplicants(item.id)}
                    className="px-3 py-1.5 rounded-lg"
                    style={{ backgroundColor: "rgba(255, 107, 53, 0.15)" }}
                >
                    <Text className="text-[#FF6B35] font-bold text-[10px]">
                        {item.applicants} {isGig ? "Applications" : "Regs"}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default function ManagePosts() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "event" | "gig">("all");

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

    useFocusEffect(
        useCallback(() => {
            if (user?._id) {
                refetchEvents();
                refetchGigs();
            }
        }, [user?._id, refetchEvents, refetchGigs])
    );

    const allItems = useMemo(() => {
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
                let displayPrice = "Unpaid";
                if (gig.compensation?.amount) {
                    displayPrice = `₹${gig.compensation.amount}`;
                } else if (gig.compensation?.minAmount || gig.compensation?.maxAmount) {
                    const min = gig.compensation.minAmount;
                    const max = gig.compensation.maxAmount;
                    if (min && max && min !== max) {
                        displayPrice = `₹${min} - ₹${max}`;
                    } else if (min || max) {
                        displayPrice = `₹${min || max}`;
                    }
                } else if (gig.compensation?.model === "unpaid") {
                    displayPrice = "Unpaid";
                } else if (gig.compensation?.model) {
                    displayPrice = "TBD";
                }

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
                            year: "numeric" // Added year for consistency
                        })}`
                        : "No Deadline",
                    location: gig.location?.city || "Remote",
                    status: gig.status
                        ? gig.status.charAt(0).toUpperCase() + gig.status.slice(1)
                        : "Draft",
                    price: displayPrice,
                    applicants: gig.stats?.applications || 0,
                    originalData: gig,
                });
            });
        }

        // Sort by date (most recent first might be better, or by status)
        // For now, let's just reverse to show newest added? 
        // Or we could sort by created date if available, but we don't have it mapped here plainly.
        return items.reverse();
    }, [eventsData, gigsData]);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === "all" || item.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [allItems, searchQuery, filterType]);

    const handleCardPress = (item: any) => {
        if (item.type === "event") {
            router.push(`/(app)/events/${item.id}`);
        } else if (item.type === "gig") {
            router.push(`/(app)/gigs/${item.id}`);
        }
    };

    const isLoading = isLoadingEvents || isLoadingGigs;

    return (
        <View className="flex-1 bg-black">
            <LinearGradient
                colors={["rgba(255, 107, 53, 0.1)", "transparent"]}
                className="absolute top-0 w-full h-64 pointer-events-none"
            />

            <SafeAreaView className="flex-1">
                <View className="px-6 py-4 flex-row items-center gap-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 items-center justify-center"
                    >
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-black tracking-tight">
                        Manage Posts
                    </Text>
                </View>

                <View className="px-6 mb-4 gap-4">
                    {/* Search Bar */}
                    <View className="flex-row items-center gap-3 bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3">
                        <Search size={20} color="#71717a" />
                        <TextInput
                            placeholder="Search your posts..."
                            placeholderTextColor="#71717a"
                            className="flex-1 text-white text-base outline-none"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Filters */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8 }}
                    >
                        {['all', 'event', 'gig'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setFilterType(type as any)}
                                className={`px-4 py-2 rounded-full border ${filterType === type
                                    ? 'bg-white border-white'
                                    : 'bg-transparent border-white/20'
                                    }`}
                            >
                                <Text className={`text-xs font-bold uppercase ${filterType === type ? 'text-black' : 'text-zinc-400'
                                    }`}>
                                    {type === 'all' ? 'All Posts' : `${type}s`}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <LoadingAnimation
                            source="https://lottie.host/ecebcd4d-d1c9-4e57-915f-d3f61705a717/VFWGhqMAX0.lottie"
                            width={200}
                            height={200}
                        />
                    </View>
                ) : (
                    <AppScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    onPress={() => handleCardPress(item)}
                                    onOpenApplicants={(id: string) => {
                                        handleCardPress(item);
                                    }}
                                />
                            ))
                        ) : (
                            <View className="items-center justify-center py-20 opacity-50">
                                <Sparkles size={48} color="#71717a" />
                                <Text className="text-zinc-500 font-bold mt-4">No posts found</Text>
                            </View>
                        )}
                    </AppScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}
