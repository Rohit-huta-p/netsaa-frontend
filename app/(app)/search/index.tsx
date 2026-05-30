// app/(app)/search/index.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowRight,
} from "lucide-react-native";
import { useSearchPreview, useSearchPeople, useSearchGigs, useSearchEvents } from "@/hooks/useSearchQueries";
import connectionService from "@/services/connectionService";
import AppScrollView from "@/components/AppScrollView";
import { PersonItem } from "@/components/search/items/PersonItem";
import { GigItem } from "@/components/search/items/GigItem";
import { EventItem } from "@/components/search/items/EventItem";



// --- TYPES & MOCK DATA ---

type Category = "All" | "People" | "Gigs" | "Events";

// --- COMPONENTS ---

const FilterPill = ({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`px-5 py-2 rounded-full border mr-2 ${isActive
            ? "bg-green-500/20 border-green-500" // LinkedIn Green-ish vibe but Neon
            : "bg-white/5 border-white/10"
            }`}
    >
        <Text className={`font-bold text-sm ${isActive ? "text-green-400" : "text-gray-400"}`}>
            {label}
        </Text>
    </TouchableOpacity>
);


// --- MAIN SCREEN ---

export default function SearchScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState((params.q as string) || "");
    const [activeTab, setActiveTab] = useState<Category>("All");

    const [sentRequests, setSentRequests] = useState<string[]>([]);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const [isStatusLoading, setIsStatusLoading] = useState(false);

    // Sync local state if params change
    useEffect(() => {
        if (params.q) setSearchQuery(params.q as string);
    }, [params.q]);

    // Fetch user's connections and requests on mount to map status
    // Note: In a real app with Redux/Zustand, we'd select these from store.
    useEffect(() => {
        const fetchStatusData = async () => {
            try {
                // setIsStatusLoading(true); // Don't block UI, just background fetch
                const [sent, connected] = await Promise.all([
                    connectionService.getSentConnectionRequests(),
                    connectionService.getConnections()
                ]);

                // Map to IDs
                const sentIds = sent.map((r: any) => r.recipientId?._id || r.recipientId);
                // Connected list items have requesterId and recipientId. 
                // We need to extract the "other" ID.
                // Assuming we don't have current User ID easily, we just grab both to be safe (over-matching but safe enough for "is connected")
                const connectedIds = connected.flatMap((c: any) => [c.requesterId?._id, c.recipientId?._id].filter(Boolean));

                setSentRequests(sentIds);
                setConnectedUsers(connectedIds);
            } catch (error) {
                console.error("Failed to fetch connection status", error);
            }
        };

        fetchStatusData();
    }, []);

    const getPersonStatus = (userId: string) => {
        if (connectedUsers.includes(userId)) return 'connected';
        if (sentRequests.includes(userId)) return 'pending';
        return 'none';
    };

    // --- QUERIES ---
    // We conditionally fetch based on active tab
    // For "All", we use preview endpoint (or individual if preview invalid) -> using preview hook
    const { data: previewData, isLoading: isLoadingPreview } = useSearchPreview(searchQuery);
    console.log("previewData: ", previewData);

    const { data: peopleData, isLoading: isLoadingPeople } = useSearchPeople(searchQuery);
    const { data: gigsData, isLoading: isLoadingGigs } = useSearchGigs(searchQuery);
    const { data: eventsData, isLoading: isLoadingEvents } = useSearchEvents(searchQuery);

    const handleSearch = () => {
        router.setParams({ q: searchQuery });
    };

    // Helper to render sections on "All" tab
    const SectionHeader = ({ title, onPress }: { title: string, onPress: () => void }) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center justify-between mt-6 mb-2"
        >
            <Text className="text-xl font-black text-white">{title}</Text>
            <View className="flex-row items-center">
                <Text className="text-gray-400 font-bold text-sm mr-1">See all</Text>
                <ArrowRight size={16} color="#9ca3af" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#09090b]">
            {/* Background Glow */}
            <LinearGradient
                colors={['#1e1b4b', '#09090b']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
                className="absolute top-0 left-0 right-0 h-[400px]"
            />

            <SafeAreaView edges={['top']} className="flex-1">

                {/* 1. HEADER (Filters only now, search moved to Navbar) */}

                {/* 2. FILTER TABS */}
                <View className="pb-2 pt-2 border-b border-white/5">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                    >
                        {(["All", "People", "Gigs", "Events"] as Category[]).map((tab) => (
                            <FilterPill
                                key={tab}
                                label={tab}
                                isActive={activeTab === tab}
                                onPress={() => setActiveTab(tab)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* 3. CONTENT AREA - Uses AppScrollView for automatic tab bar padding */}
                <AppScrollView
                    className="flex-1 px-4 w-[90%] mx-auto"
                    showsVerticalScrollIndicator={false}
                >
                    {(isLoadingPreview && activeTab === 'All') ||
                        (isLoadingPeople && activeTab === 'People') ||
                        (isLoadingGigs && activeTab === 'Gigs') ||
                        (isLoadingEvents && activeTab === 'Events') ? (
                        <View className="mt-20 items-center justify-center">
                            <ActivityIndicator size="large" color="#ffffff" />
                        </View>
                    ) : (
                        <>
                            {/* === "ALL" TAB View (Mixed Content) === */}
                            {activeTab === "All" && previewData && (
                                <>
                                    {previewData.people?.length > 0 && <SectionHeader title="People" onPress={() => setActiveTab("People")} />}
                                    <View className="bg-white/5 border border-white/5 rounded-2xl px-4 mb-4">
                                        {previewData.people?.slice(0, 3).map((person: any) => (
                                            <PersonItem key={person._id || person.id} item={person} status={getPersonStatus(person._id || person.id)} onPress={() => router.push(`/profile/${person._id || person.id}`)} />
                                        ))}
                                        {previewData.people?.length > 3 &&
                                            <TouchableOpacity
                                                onPress={() => setActiveTab("People")}
                                                className="py-3 items-center border-t border-white/5"
                                            >
                                                <Text className="text-gray-400 font-bold text-sm">See all people results</Text>
                                            </TouchableOpacity>}
                                    </View>

                                    {previewData.gigs?.length > 0 && <SectionHeader title="Gigs" onPress={() => setActiveTab("Gigs")} />}
                                    <View className="bg-white/5 border border-white/5 rounded-2xl px-4 mb-4">
                                        {previewData.gigs?.slice(0, 3).map((gig: any) => (
                                            <GigItem key={gig._id} item={gig} onPress={() => router.push(`/gigs/${gig._id}`)} />
                                        ))}
                                        {previewData.gigs?.length > 3 &&
                                            <TouchableOpacity
                                                onPress={() => setActiveTab("Gigs")}
                                                className="py-3 items-center border-t border-white/5"
                                            >
                                                <Text className="text-gray-400 font-bold text-sm">See all gig results</Text>
                                            </TouchableOpacity>}
                                    </View>

                                    {previewData.events?.length > 0 && <SectionHeader title="Events" onPress={() => setActiveTab("Events")} />}
                                    <View className="bg-white/5 border border-white/5 rounded-2xl px-4 mb-4">
                                        {previewData.events?.slice(0, 3).map((event: any) => (
                                            <EventItem key={event._id} item={event} onPress={() => router.push(`/events/${event._id}`)} />
                                        ))}
                                    </View>

                                    {(!previewData.people?.length && !previewData.gigs?.length && !previewData.events?.length) &&
                                        <View className="mt-20 items-center">
                                            <Text className="text-gray-500 font-satoshi-medium">No results found for "{searchQuery}"</Text>
                                        </View>
                                    }
                                </>
                            )}

                            {/* === "PEOPLE" TAB View === */}
                            {activeTab === "People" && peopleData && (
                                <View className="mt-4">
                                    <Text className="text-gray-400 text-sm mb-4">About {peopleData.total || 0} results</Text>
                                    {peopleData.results?.map((person: any) => (
                                        <PersonItem key={person._id || person.id} item={person} status={getPersonStatus(person._id || person.id)} onPress={() => router.push(`/profile/${person._id || person.id}`)} />
                                    ))}
                                </View>
                            )}

                            {/* === "GIGS" TAB View === */}
                            {activeTab === "Gigs" && gigsData && (
                                <View className="mt-4">
                                    <Text className="text-gray-400 text-sm mb-4">{gigsData.total || 0} results found</Text>
                                    {gigsData.results?.map((gig: any) => (
                                        <GigItem key={gig._id} item={gig} onPress={() => router.push(`/gigs/${gig._id}`)} />
                                    ))}
                                </View>
                            )}

                            {/* === "EVENTS" TAB View === */}
                            {activeTab === "Events" && eventsData && (
                                <View className="mt-4">
                                    <Text className="text-gray-400 text-sm mb-4">Events near you</Text>
                                    {eventsData.results?.map((event: any) => (
                                        <EventItem key={event._id} item={event} onPress={() => router.push(`/events/${event._id}`)} />
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                </AppScrollView>
            </SafeAreaView>
        </View>
    );
}