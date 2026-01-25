import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { requireAuth } from "@/utils/requireAuth";
// import { useRegisterForEvent } from "@/hooks/useEvents"; // No longer needed directly here
import { useEventTicketTypes, useMyRegistrations } from "@/hooks/useEvents";
import { IEvent } from "@/types/event";
import { EventHero } from "./shared/EventHero";
import { EventRegisterModal } from "./EventRegisterModal";
import { EventMetaInfo } from "./shared/EventMetaInfo";

import { EventAbout } from "./shared/EventAbout";
import AppScrollView from "../AppScrollView";
import { SegmentedTabs } from "../common/SegmentedTabs";
import DiscussionTab from "../common/DiscussionTab";

interface EventDetailsProps {
    event: IEvent;
    isOrganizer?: boolean;
}

// TYPES
const Event_Organizer_TABS = [
    { key: "about", title: "About" },
    { key: "registrations", title: "Registrations" },
    { key: "discussion", title: "Discussion" },
] as const;

const Event_Artist_TABS = [
    { key: "about", title: "About" },
    { key: "discussion", title: "Discussion" },
] as const;

type EventTabKey = "about" | "registrations" | "discussion";
export const EventDetails: React.FC<EventDetailsProps> = ({ event, isOrganizer }) => {

    const user = useAuthStore((state) => state.user);
    const [isRegisterVisible, setIsRegisterVisible] = useState(false);
    const { data: ticketTypes, isLoading: loadingTickets } = useEventTicketTypes(event?._id);
    const { data: myRegistrations, isLoading: loadingRegistrations, refetch: refetchRegistrations } = useMyRegistrations();

    useFocusEffect(
        useCallback(() => {
            refetchRegistrations();
        }, [refetchRegistrations])
    );
    console.log("myRegistrations", myRegistrations);
    console.log("event", event);
    const isRegistered = myRegistrations?.some((reg: any) => reg.eventId === event._id);

    // const registerMutation = useRegisterForEvent(); // Deprecated in favor of modal flow

    const handleRegisterPress = () => {
        if (isRegistered) return;
        requireAuth({
            action: () => setIsRegisterVisible(true),
            reason: 'register_event'
        });
    };
    // const activeTab = typeof tab === "string" ? tab : "about";
    const [activeTab, setActiveTab] = useState<EventTabKey>("about");
    if (!event) return null;

    const max = event.maxParticipants;
    const registered = 18; // mock (as per reference)
    const spotsLeft = max - registered;
    const progress = (registered / max) * 100;

    const [tabs] = useState(() => {
        return (isOrganizer ? Event_Organizer_TABS : Event_Artist_TABS).map((tab) => ({
            key: tab.key,
            title: tab.title,
        }));
    });

    const handleTabSelect = async (tab: any) => {
        console.log('[EventDetails] Selected tab:', tab);
        setActiveTab(tab);
    };
    const renderTabContent = () => {
        switch (activeTab) {
            case "about":
                return (
                    <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10">
                        <EventAbout event={event} />
                    </View>
                );
            case "registrations":
                return (
                    <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10 min-h-[200px] justify-center items-center">
                        <Text className="text-netsa-text-muted font-inter">Registrations view coming soon</Text>
                    </View>
                );
            case "discussion":
                return (
                    <DiscussionTab id={event._id} type="event" />
                );
            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-netsa-bg">
            <AppScrollView>
                <View className="w-full">
                    <View className="w-full max-w-[80%] mx-auto">
                        {/* ---------- HERO BANNER ---------- */}
                        <EventHero
                            event={event}
                            isOrganizer={user?._id === event.organizerId}
                            isSaved={false} // TODO: Fetch saved state from backend or store
                        />

                        {/* ---------- CONTENT ---------- */}
                        <View className="px-6 mt-6">

                            {/* Tags */}
                            <View className="flex-row flex-wrap gap-2 mb-1">
                                {event.tags.map((tag, i) => (
                                    <View
                                        key={i}
                                        className="px-3 py-1 rounded-full bg-netsa-accent-purple/20 border border-netsa-accent-purple/30"
                                    >
                                        <Text className="text-[10px] font-satoshi-bold text-netsa-accent-purple">
                                            {tag}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Title + Pricing */}
                            <View className="flex-col md:flex-row gap-4">

                                {/* LEFT (Meta Info) */}
                                <EventMetaInfo event={event} />

                                {/* RIGHT CARD */}
                                <View className="w-full md:w-56 bg-netsa-card rounded-2xl p-5 shadow-lg border border-white/10">
                                    <Text className="text-2xl font-satoshi-black text-netsa-accent-purple mb-2">
                                        {event.ticketPrice}
                                    </Text>

                                    <Text className="text-xs text-netsa-text-secondary mb-1 font-inter">
                                        Spots remaining: {spotsLeft}
                                    </Text>

                                    {/* Gradient 2: Events (#3D79FB -> #8B5CF6) */}
                                    <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                                        <View
                                            style={{ width: `${progress}%` }}
                                            className="h-2 bg-gradient-to-r from-[#3D79FB] to-[#8B5CF6]"
                                        />
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleRegisterPress}
                                        disabled={loadingTickets || isRegistered}
                                        className={`py-3 rounded-lg shadow-md active:opacity-90 flex-row justify-center items-center ${isRegistered ? 'bg-zinc-700' : 'bg-gradient-to-r from-[#3D79FB] to-[#8B5CF6]'}`}
                                    >
                                        {loadingTickets || loadingRegistrations ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text className="text-center text-white font-satoshi-bold">
                                                {isRegistered ? 'Registered' : 'Register Now'}
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    <Text className="text-[10px] text-netsa-text-muted mt-2 text-center font-inter">
                                        Free cancellation up to 24h
                                    </Text>
                                </View>
                            </View>

                            {/* ---------- TABS ---------- */}
                            <SegmentedTabs
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabChange={handleTabSelect}
                            />


                            {/* ---------- TAB CONTENT ---------- */}
                            {renderTabContent()}

                            <View className="h-16" />
                        </View>
                    </View>
                </View>
            </AppScrollView>

            <EventRegisterModal
                visible={isRegisterVisible}
                onClose={() => setIsRegisterVisible(false)}
                eventId={event._id}
                ticketTypes={ticketTypes || []}
                ticketPrice={event.ticketPrice}
            />
        </View>
    );
};
