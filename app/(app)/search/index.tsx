// app/(app)/search/index.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSearchPreview, useSearchPeople, useSearchGigs, useSearchEvents } from "@/hooks/useSearchQueries";
import connectionService from "@/services/connectionService";
import AppScrollView from "@/components/AppScrollView";
import { PersonItem } from "@/components/search/items/PersonItem";
import { GigItem } from "@/components/search/items/GigItem";
import { EventItem } from "@/components/search/items/EventItem";

type Category = "All" | "People" | "Gigs" | "Events";

const GOLD = "#D4A155";          // muted verified-gold for hairlines + counts
const ORANGE = "#FF6B35";        // brand orange — active accent
const PAPER_TINT = "rgba(255, 200, 140, 0.04)";

// ── Tab: editorial underline (active = orange rule, no fill) ──
const Tab = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="mr-6 pb-2">
        <Text
            className={`font-outfit-semibold text-[13px] tracking-wide ${
                isActive ? "text-white" : "text-zinc-500"
            }`}
        >
            {label}
        </Text>
        {isActive ? (
            <View style={{ position: "absolute", left: 0, right: 0, bottom: -1, height: 1.5, backgroundColor: ORANGE }} />
        ) : null}
    </TouchableOpacity>
);

// ── Section header: hairline + serif title + mono count ──
const SectionHeader = ({ title, count, onSeeAll }: { title: string; count?: number; onSeeAll?: () => void }) => (
    <View className="mt-10 mb-3">
        <View className="flex-row items-center">
            <View style={{ flex: 1, height: 1, backgroundColor: GOLD, opacity: 0.25 }} />
            <Text
                className="font-serif text-white text-2xl px-4"
                style={Platform.OS === "web" ? ({ fontStyle: "italic" as any } as any) : undefined}
            >
                {title}
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: GOLD, opacity: 0.25 }} />
        </View>
        <View className="flex-row items-center justify-between mt-2">
            <Text className="font-mono text-[10px] tracking-widest" style={{ color: GOLD }}>
                {typeof count === "number" ? String(count).padStart(2, "0") : ""}
                {typeof count === "number" ? "  ENTRIES" : ""}
            </Text>
            {onSeeAll ? (
                <TouchableOpacity onPress={onSeeAll}>
                    <Text className="font-outfit-medium text-[11px] uppercase tracking-widest" style={{ color: GOLD }}>
                        See all →
                    </Text>
                </TouchableOpacity>
            ) : null}
        </View>
    </View>
);

const EmptyState = ({ query }: { query: string }) => (
    <View className="mt-24 items-center">
        <Text className="font-serif text-zinc-500 text-2xl mb-3" style={{ fontStyle: "italic" as any }}>
            ⋄
        </Text>
        <Text className="font-outfit text-zinc-500 text-sm">
            Nothing found for{" "}
            <Text className="font-serif text-zinc-300" style={{ fontStyle: "italic" as any }}>
                "{query}"
            </Text>
        </Text>
        <Text className="font-mono text-[10px] text-zinc-700 mt-3 tracking-widest">TRY ANOTHER NAME</Text>
    </View>
);

const QueryHeader = ({ query }: { query: string }) => (
    <View className="px-5 pt-4 pb-3">
        <Text className="font-mono text-[10px] text-zinc-500 tracking-[0.3em] mb-1">DIRECTORY</Text>
        <View className="flex-row items-baseline">
            <Text className="font-outfit text-zinc-500 text-sm mr-2">searching</Text>
            <Text
                className="font-serif text-white text-2xl"
                style={{ fontStyle: "italic" as any }}
                numberOfLines={1}
            >
                "{query}"
            </Text>
        </View>
    </View>
);

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
        <View className="flex-1 bg-[#0a0807]">
            {/* Warm-tinted radial glow on top — adds atmosphere vs flat black */}
            <LinearGradient
                colors={[PAPER_TINT, "rgba(255, 107, 53, 0.025)", "transparent"]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.5 }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
            />

            <SafeAreaView edges={["top"]} className="flex-1">
                {/* Query header — editorial */}
                <QueryHeader query={searchQuery} />

                {/* Tab strip — minimal underlined */}
                <View className="px-5 flex-row border-b border-white/[0.06]">
                    {(["All", "People", "Gigs", "Events"] as Category[]).map((t) => (
                        <Tab key={t} label={t} isActive={activeTab === t} onPress={() => setActiveTab(t)} />
                    ))}
                </View>

                {/* Content */}
                <AppScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View className="mt-24 items-center justify-center">
                            <ActivityIndicator size="small" color={GOLD} />
                            <Text className="font-mono text-[10px] tracking-widest mt-3" style={{ color: GOLD, opacity: 0.5 }}>
                                FETCHING
                            </Text>
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
                                <View>
                                    <SectionHeader title="People" count={peopleData.total || 0} />
                                    {peopleData.results?.map((person: any) => (
                                        <PersonItem
                                            key={person._id || person.id}
                                            item={person}
                                            status={getPersonStatus(person._id || person.id)}
                                            onPress={() => router.push(`/profile/${person._id || person.id}`)}
                                        />
                                    ))}
                                    {(peopleData.results?.length ?? 0) === 0 && <EmptyState query={searchQuery} />}
                                </View>
                            )}

                            {/* Gigs */}
                            {activeTab === "Gigs" && gigsData && (
                                <View>
                                    <SectionHeader title="Gigs" count={gigsData.total || 0} />
                                    {gigsData.results?.map((gig: any) => (
                                        <GigItem
                                            key={gig._id}
                                            item={gig}
                                            onPress={() => router.push(`/gigs/${gig._id}`)}
                                        />
                                    ))}
                                    {(gigsData.results?.length ?? 0) === 0 && <EmptyState query={searchQuery} />}
                                </View>
                            )}

                            {/* Events */}
                            {activeTab === "Events" && eventsData && (
                                <View>
                                    <SectionHeader title="Events" count={eventsData.total || 0} />
                                    {eventsData.results?.map((event: any) => (
                                        <EventItem
                                            key={event._id}
                                            item={event}
                                            onPress={() => router.push(`/events/${event._id}`)}
                                        />
                                    ))}
                                    {(eventsData.results?.length ?? 0) === 0 && <EmptyState query={searchQuery} />}
                                </View>
                            )}

                            {/* Bottom flourish */}
                            <View className="items-center py-12">
                                <Text className="font-serif text-zinc-700 text-2xl" style={{ fontStyle: "italic" as any }}>
                                    ✦
                                </Text>
                            </View>
                        </>
                    )}
                </AppScrollView>
            </SafeAreaView>
        </View>
    );
}
