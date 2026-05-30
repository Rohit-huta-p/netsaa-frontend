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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSearchPreview, useSearchPeople, useSearchGigs, useSearchEvents } from "@/hooks/useSearchQueries";
import connectionService from "@/services/connectionService";
import AppScrollView from "@/components/AppScrollView";
import { PersonItem } from "@/components/search/items/PersonItem";
import { GigItem } from "@/components/search/items/GigItem";
import { EventItem } from "@/components/search/items/EventItem";

type Category = "All" | "People" | "Gigs" | "Events";

// --- Tab pill ---
const TabPill = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`px-4 py-1.5 rounded-full mr-2 ${
            isActive ? "bg-white" : "bg-transparent"
        }`}
    >
        <Text className={`text-sm ${isActive ? "text-black font-semibold" : "text-gray-400"}`}>
            {label}
        </Text>
    </TouchableOpacity>
);

// --- Section header (compact, no card wrapper around the list) ---
const SectionHeader = ({ title, count, onSeeAll }: { title: string; count?: number; onSeeAll?: () => void }) => (
    <View className="flex-row items-center justify-between mt-6 mb-1">
        <View className="flex-row items-baseline">
            <Text className="text-white text-base font-semibold">{title}</Text>
            {typeof count === "number" ? (
                <Text className="text-gray-500 text-xs ml-2">{count}</Text>
            ) : null}
        </View>
        {onSeeAll ? (
            <TouchableOpacity onPress={onSeeAll}>
                <Text className="text-purple-300 text-xs font-medium">See all</Text>
            </TouchableOpacity>
        ) : null}
    </View>
);

// Empty state — minimal
const EmptyState = ({ query }: { query: string }) => (
    <View className="mt-20 items-center">
        <Text className="text-gray-500 text-sm">No results for "{query}"</Text>
    </View>
);

// --- Screen ---
export default function SearchScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const [searchQuery] = useState((params.q as string) || "");
    const [activeTab, setActiveTab] = useState<Category>("All");

    const [sentRequests, setSentRequests] = useState<string[]>([]);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

    useEffect(() => {
        const fetchStatusData = async () => {
            try {
                const [sent, connected] = await Promise.all([
                    connectionService.getSentConnectionRequests(),
                    connectionService.getConnections(),
                ]);
                const sentIds = sent.map((r: any) => r.recipientId?._id || r.recipientId);
                const connectedIds = connected.flatMap((c: any) => [c.requesterId?._id, c.recipientId?._id].filter(Boolean));
                setSentRequests(sentIds);
                setConnectedUsers(connectedIds);
            } catch (error) {
                console.error("Failed to fetch connection status", error);
            }
        };
        fetchStatusData();
    }, []);

    const getPersonStatus = (userId: string): "none" | "pending" | "connected" => {
        if (connectedUsers.includes(userId)) return "connected";
        if (sentRequests.includes(userId)) return "pending";
        return "none";
    };

    const { data: previewData, isLoading: isLoadingPreview } = useSearchPreview(searchQuery);
    const { data: peopleData, isLoading: isLoadingPeople } = useSearchPeople(searchQuery);
    const { data: gigsData,   isLoading: isLoadingGigs }   = useSearchGigs(searchQuery);
    const { data: eventsData, isLoading: isLoadingEvents } = useSearchEvents(searchQuery);

    const loading =
        (isLoadingPreview && activeTab === "All") ||
        (isLoadingPeople && activeTab === "People") ||
        (isLoadingGigs && activeTab === "Gigs") ||
        (isLoadingEvents && activeTab === "Events");

    const hasAny =
        previewData &&
        (previewData.people?.length || previewData.gigs?.length || previewData.events?.length);

    return (
        <View className="flex-1 bg-[#09090b]">
            <SafeAreaView edges={["top"]} className="flex-1">
                {/* Tabs */}
                <View className="flex-row px-5 pt-3 pb-3 border-b border-white/5">
                    {(["All", "People", "Gigs", "Events"] as Category[]).map((t) => (
                        <TabPill
                            key={t}
                            label={t}
                            isActive={activeTab === t}
                            onPress={() => setActiveTab(t)}
                        />
                    ))}
                </View>

                {/* Content */}
                <AppScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View className="mt-20 items-center justify-center">
                            <ActivityIndicator size="large" color="#a78bfa" />
                        </View>
                    ) : (
                        <>
                            {/* All */}
                            {activeTab === "All" && previewData && (
                                <>
                                    {previewData.people?.length > 0 && (
                                        <>
                                            <SectionHeader
                                                title="People"
                                                count={previewData.people.length}
                                                onSeeAll={() => setActiveTab("People")}
                                            />
                                            {previewData.people.slice(0, 3).map((person: any) => (
                                                <PersonItem
                                                    key={person._id || person.id}
                                                    item={person}
                                                    status={getPersonStatus(person._id || person.id)}
                                                    onPress={() => router.push(`/profile/${person._id || person.id}`)}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {previewData.gigs?.length > 0 && (
                                        <>
                                            <SectionHeader
                                                title="Gigs"
                                                count={previewData.gigs.length}
                                                onSeeAll={() => setActiveTab("Gigs")}
                                            />
                                            {previewData.gigs.slice(0, 3).map((gig: any) => (
                                                <GigItem
                                                    key={gig._id}
                                                    item={gig}
                                                    onPress={() => router.push(`/gigs/${gig._id}`)}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {previewData.events?.length > 0 && (
                                        <>
                                            <SectionHeader
                                                title="Events"
                                                count={previewData.events.length}
                                                onSeeAll={() => setActiveTab("Events")}
                                            />
                                            {previewData.events.slice(0, 3).map((event: any) => (
                                                <EventItem
                                                    key={event._id}
                                                    item={event}
                                                    onPress={() => router.push(`/events/${event._id}`)}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {!hasAny && <EmptyState query={searchQuery} />}
                                </>
                            )}

                            {/* People */}
                            {activeTab === "People" && peopleData && (
                                <View className="mt-2">
                                    <Text className="text-gray-500 text-xs mb-1">{peopleData.total || 0} results</Text>
                                    {peopleData.results?.map((person: any) => (
                                        <PersonItem
                                            key={person._id || person.id}
                                            item={person}
                                            status={getPersonStatus(person._id || person.id)}
                                            onPress={() => router.push(`/profile/${person._id || person.id}`)}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Gigs */}
                            {activeTab === "Gigs" && gigsData && (
                                <View className="mt-2">
                                    <Text className="text-gray-500 text-xs mb-1">{gigsData.total || 0} results</Text>
                                    {gigsData.results?.map((gig: any) => (
                                        <GigItem
                                            key={gig._id}
                                            item={gig}
                                            onPress={() => router.push(`/gigs/${gig._id}`)}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Events */}
                            {activeTab === "Events" && eventsData && (
                                <View className="mt-2">
                                    <Text className="text-gray-500 text-xs mb-1">{eventsData.total || 0} results</Text>
                                    {eventsData.results?.map((event: any) => (
                                        <EventItem
                                            key={event._id}
                                            item={event}
                                            onPress={() => router.push(`/events/${event._id}`)}
                                        />
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
