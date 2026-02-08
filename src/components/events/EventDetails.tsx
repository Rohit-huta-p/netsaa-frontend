import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, FlatList } from 'react-native';
import {
    Calendar,
    MapPin,
    Clock,
    Heart,
    Share2,
    CheckCircle2,
    ArrowRight,
    Zap,
    Star,
    Edit2,
    ShieldCheck,
    User as UserIcon
} from 'lucide-react-native';
import { MapLinkCard } from '@/components/location/MapLinkCard';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '@/stores/authStore';
import { usePlatform } from '@/utils/platform';
import { useRouter } from 'expo-router';
import { IEvent } from '@/types/event';
import { EventRegisterModal } from './EventRegisterModal';
import { useEventRegistrations, useEventTicketTypes, useMyRegistrations } from '@/hooks/useEvents';
import DiscussionTab from '../common/DiscussionTab';
import { AuthPromptModal } from '../common/AuthPromptModal';

interface EventDetailsProps {
    event: IEvent;
    isOrganizer?: boolean;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
    event,
    isOrganizer = false,
}) => {
    console.log("Evendetails event: ", event);

    const router = useRouter();
    const { isWeb } = usePlatform();
    // const user = useAuthStore((state) => state.user); // Unused for now but kept for consistency

    // State
    const [applyModalVisible, setApplyModalVisible] = useState(false);
    const [authPromptVisible, setAuthPromptVisible] = useState(false);
    const [isSaved, setIsSaved] = useState(false); // TODO: Fetch initial state
    const [activeTab, setActiveTab] = useState<'about' | 'schedule' | 'tickets' | 'venue' | 'host' | 'discussion' | 'registrations'>('about');

    // Data Hooks
    const { data: ticketTypes, isLoading: loadingTickets } = useEventTicketTypes(event._id);
    const { data: myRegistrations } = useEventRegistrations(event._id);
    console.log("event Registrations: ", myRegistrations);
    const isRegistered = myRegistrations?.some((reg: any) => reg.eventId === event._id);

    // Derived Data
    const capacity = event.maxParticipants || 100; // Default if missing

    // Calculate registered count based on reservations
    const registered = myRegistrations?.reduce((acc: number, reg: any) => {
        if (reg.status === 'reserved' || reg.status === 'paid' || reg.status === 'approved' || reg.status === 'registered') {
            return acc + (reg.quantity || 1);
        }
        return acc;
    }, 0) || 0;

    const isFull = registered >= capacity;
    const showDiscussion = true; // Conditional logic from request

    const handleShare = () => {
        Alert.alert('Share', 'Share functionality coming soon!');
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
    };

    const handleRegister = () => {
        // Checking for user presence (auth check)
        const user = useAuthStore.getState().user;

        if (!user) {
            setAuthPromptVisible(true);
            return;
        }
        setApplyModalVisible(true);
    };

    const tabs = [
        { key: 'about', label: 'About' },
        { key: 'tickets', label: 'Tickets' },
        ...(showDiscussion ? [{ key: 'discussion', label: 'Discussion' }] : []),
        ...(isOrganizer ? [{ key: 'registrations', label: 'Registrations' }] : []),
    ];

    // Helper to format image uri
    const imageUri = event.coverImage || event.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000";

    return (
        <View className="flex-1 w-[80%] mx-auto">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140, marginTop: 20 }}>
                {/* HERO IMAGE */}
                <View className="relative w-full overflow-hidden rounded-2xl aspect-video md:aspect-[21/9] bg-zinc-900 mb-6">
                    <Image
                        source={{ uri: imageUri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.3)', '#000000']}
                        locations={[0, 0.6, 1]}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    />

                    {/* Hero Content Overlay */}
                    <View className="absolute bottom-0 left-0 right-0 p-6 flex-row w-full justify-between items-end">
                        <View className="flex-1 mr-4">
                            <View className="flex-row gap-2 mb-3">
                                <View className="bg-blue-600 rounded-full px-4 py-1">
                                    <Text className="text-white font-black text-[10px] uppercase tracking-[0.2em]">
                                        {event.eventType || 'EVENT'}
                                    </Text>
                                </View>
                                {event.isOnline && (
                                    <View className="bg-purple-600 rounded-full px-4 py-1">
                                        <Text className="text-white font-black text-[10px] uppercase tracking-[0.2em]">
                                            ONLINE
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text className="text-3xl md:text-5xl font-black text-white leading-tight mb-2">
                                {event.title}
                            </Text>
                        </View>
                    </View>

                    {/* Top Actions */}
                    <View className="absolute top-4 right-4 flex-row gap-3 z-30">
                        <TouchableOpacity
                            onPress={handleSave}
                            className="w-10 h-10 rounded-2xl bg-black/50 border border-white/10 items-center justify-center"
                        >
                            <Heart size={20} color={isSaved ? '#EF4444' : '#FFFFFF'} fill={isSaved ? '#EF4444' : 'none'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleShare}
                            className="w-10 h-10 rounded-2xl bg-black/50 border border-white/10 items-center justify-center"
                        >
                            <Share2 size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        {isOrganizer && (
                            <TouchableOpacity
                                onPress={() => router.push(`/events/${event._id}/edit`)} // Mock edit route
                                className="w-10 h-10 rounded-2xl bg-black/50 border border-white/10 items-center justify-center"
                            >
                                <Edit2 size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* MAIN CONTENT */}
                <View className="md:flex-row md:justify-between items-start">
                    {/* LEFT COLUMN */}
                    <View className="flex-1 w-full md:mr-10">
                        {/* Organizer & Meta Header */}
                        <View className="mb-8">
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => event.organizerId && router.push(`/profile/${event.organizerId}`)}
                                className="flex-row items-center gap-4 mb-4"
                            >
                                <View className="relative">
                                    <View className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/10">
                                        {event.organizerSnapshot?.profileImageUrl ? (
                                            <Image
                                                source={{ uri: event.organizerSnapshot.profileImageUrl }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                                                <Text className="text-white font-black text-xl">
                                                    {event.organizerSnapshot?.name?.charAt(0) || 'O'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full items-center justify-center border-2 border-black">
                                        <CheckCircle2 size={12} color="white" />
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-md font-black text-white mb-1">
                                        {event.organizerSnapshot?.name || 'Organizer'}
                                    </Text>
                                    <View className="flex-row items-center gap-3">
                                        <View className="flex-row items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} size={10} color="#EAB308" fill="#EAB308" />
                                            ))}
                                            <Text className="text-[10px] font-bold text-zinc-400 ml-1">5.0</Text>
                                        </View>
                                        <View className="bg-emerald-500/10 px-2 py-1 rounded">
                                            <Text className="text-emerald-500 text-[6px] font-black uppercase tracking-widest">
                                                VERIFIED HOST
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Quick Meta */}
                            <View className="flex-row justify-start gap-8 mb-4">
                                {/* Location */}
                                <View className="flex-row items-center gap-2">
                                    <View className="w-10 h-10 rounded-2xl bg-blue-500/10 items-center justify-center">
                                        <MapPin size={20} color="#3B82F6" />
                                    </View>
                                    <View>
                                        <Text className="text-[12px] font-bold text-white mb-0.5">
                                            {event.location?.venueName || event.location?.city || 'TBD'}
                                        </Text>
                                        <Text className="text-[10px] text-zinc-400">
                                            {event.location?.address || 'Location Details'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Date */}
                                <View className="flex-row items-center gap-2">
                                    <View className="w-10 h-10 rounded-2xl bg-purple-500/10 items-center justify-center">
                                        <Calendar size={20} color="#A855F7" />
                                    </View>
                                    <View>
                                        <Text className="text-[12px] font-bold text-white mb-0.5">
                                            {event.schedule?.startDate
                                                ? new Date(event.schedule.startDate).toLocaleDateString('en-US', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })
                                                : "TBD"}
                                        </Text>
                                        <Text className="text-[10px] text-zinc-400">
                                            {event.schedule?.startDate
                                                ? new Date(event.schedule.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : 'Time TBD'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* RIGHT COLUMN (Desktop only - floating card) */}
                    {/* For mobile, this might logically go below or sticking to bottom. GigDetails puts it in column 2. */}
                    {!isOrganizer && (
                        <View className="w-full md:w-96 md:pt-0 pt-6">
                            <View className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/10 mb-6">
                                <View className="items-center mb-6">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <Zap size={14} color="#3B82F6" />
                                        <Text className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            TICKET PRICE
                                        </Text>
                                    </View>
                                    <View className="flex-row items-baseline">
                                        <Text className="text-3xl font-black text-white">
                                            {event.ticketPrice ? `₹${event.ticketPrice}` : 'Free'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Progress */}
                                <View className="mb-8">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            CAPACITY
                                        </Text>
                                        <Text className="text-[8px] font-black text-white">
                                            {registered} / {capacity}
                                        </Text>
                                    </View>
                                    <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <View
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            style={{ width: `${(registered / capacity) * 100}%` }}
                                        />
                                    </View>
                                </View>

                                {/* Map Link Card */}
                                <View className="mb-6">
                                    <MapLinkCard
                                        venueName={event.location?.venueName}
                                        address={event.location?.address || ''}
                                        city={event.location?.city || ''}
                                        state={event.location?.state || ''}
                                        country={event.location?.country || ''}
                                    />
                                </View>

                                {/* Apply Button */}
                                <TouchableOpacity
                                    onPress={handleRegister}
                                    disabled={isRegistered || isFull}
                                    className={`w-full py-4 rounded-2xl items-center justify-center flex-row mb-4 active:scale-95 ${isRegistered ? 'bg-zinc-800' : 'bg-white'}`}
                                >
                                    <Text className={`text-lg font-black ${isRegistered ? 'text-zinc-500' : 'text-black'}`}>
                                        {isRegistered ? 'Registered' : isFull ? 'Sold Out' : (event.ticketPrice ? 'Buy Tickets' : 'Register Free')}
                                    </Text>
                                    {!isRegistered && !isFull && <ArrowRight size={20} color="#000000" style={{ marginLeft: 8 }} />}
                                </TouchableOpacity>

                                {/* Trust Footer */}
                                <View className="flex-row items-center justify-center gap-2">
                                    <ShieldCheck size={12} color="#71717A" />
                                    <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                                        SECURE BOOKING
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* TABS - INLINE implementation to match GigDetails (FlatList) */}
                <View className="mt-8 mb-12 w-full">
                    {isWeb ? (
                        <View className="flex-row w-full border-b border-white/10">
                            {tabs.map((item) => {
                                const isActive = activeTab === item.key;

                                return (
                                    <TouchableOpacity
                                        key={item.key}
                                        onPress={() => setActiveTab(item.key as any)}
                                        className={`flex-1 items-center py-4 ${isActive ? 'border-b-2 border-blue-500' : ''
                                            }`}
                                    >
                                        <Text
                                            className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-white' : 'text-zinc-500'
                                                }`}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        /* MOBILE: horizontal scroll */
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={tabs}
                            keyExtractor={(item) => item.key}
                            contentContainerStyle={{ paddingHorizontal: 4 }}
                            renderItem={({ item }) => {
                                const isActive = activeTab === item.key;

                                return (
                                    <TouchableOpacity
                                        onPress={() => setActiveTab(item.key as any)}
                                        className={`px-6 py-4 ${isActive ? 'border-b-2 border-blue-500' : ''
                                            }`}
                                    >
                                        <Text
                                            className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-white' : 'text-zinc-500'
                                                }`}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}

                    {/* Tab Content */}
                    <View className="mt-4">
                        {activeTab === 'about' && (
                            <View className="space-y-6">
                                {/* Description */}
                                <View>
                                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                                        EVENT DETAILS
                                    </Text>
                                    <View className="border-l-4 border-blue-500/30 pl-6">
                                        <Text className="text-xl text-zinc-300 leading-relaxed font-light">
                                            {event.description || 'No description provided.'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Schedule Section */}
                                {/* <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-4">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <Clock size={16} color="#F59E0B" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                                            SCHEDULE
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                        <Text className="text-sm text-zinc-400">Date</Text>
                                        <Text className="text-base font-black text-white">
                                            {event.schedule?.startDate ? new Date(event.schedule.startDate).toLocaleDateString() : 'TBD'}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                                        <Text className="text-sm text-zinc-400">Duration</Text>
                                        <Text className="text-base font-black text-white">
                                            {event.duration ? `${event.duration} mins` : 'N/A'}
                                        </Text>
                                    </View>
                                </View> */}

                                {/* Venue Section */}
                                {/* <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-4">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <MapPin size={16} color="#3B82F6" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                                            VENUE
                                        </Text>
                                    </View>
                                    <Text className="text-white font-bold text-lg">
                                        {event.location?.venueName || 'Venue TBD'}
                                    </Text>
                                    <Text className="text-zinc-400 text-sm">
                                        {event.location?.address || 'Address TBD'}
                                    </Text>
                                    <Text className="text-zinc-400 text-sm">
                                        {event.location?.city}, {event.location?.state}
                                    </Text>
                                </View> */}

                                {/* Host Section */}
                                {/* <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 space-y-4">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <UserIcon size={16} color="#10B981" />
                                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">
                                            HOSTED BY
                                        </Text>
                                    </View>
                                    <View className="flex-row gap-4 items-center">
                                        <View className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                            {event.organizerSnapshot?.profileImageUrl ? (
                                                <Image
                                                    source={{ uri: event.organizerSnapshot.profileImageUrl }}
                                                    className="w-full h-full"
                                                />
                                            ) : (
                                                <View className="w-full h-full items-center justify-center bg-zinc-700">
                                                    <Text className="text-white font-bold text-xl">{event.organizerSnapshot?.name?.charAt(0)}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View>
                                            <Text className="text-white font-black text-lg">
                                                {event.organizerSnapshot?.name || 'Organizer'}
                                            </Text>
                                            <View className="flex-row items-center gap-1 mt-1">
                                                <CheckCircle2 size={12} color="#10B981" />
                                                <Text className="text-emerald-500 text-xs font-bold">Verified Organizer</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View> */}

                                {/* Tags */}
                                {event.tags && event.tags.length > 0 && (
                                    <View>
                                        <View className="flex-row flex-wrap gap-2">
                                            {event.tags.map((tag: string, idx: number) => (
                                                <View
                                                    key={idx}
                                                    className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                                                >
                                                    <Text className="text-zinc-400 text-xs">#{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'tickets' && (
                            <View className="space-y-4">
                                {ticketTypes && ticketTypes.length > 0 ? (
                                    ticketTypes.map((ticket: any) => (
                                        <View key={ticket._id} className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 flex-row justify-between items-center">
                                            <View>
                                                <Text className="text-white font-black text-lg">{ticket.name}</Text>
                                                <Text className="text-zinc-500 text-xs">{ticket.description}</Text>
                                            </View>
                                            <Text className="text-white font-black text-xl">
                                                ₹{ticket.price}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                        <Text className="text-zinc-400 text-center">General Entry - {event.ticketPrice ? `₹${event.ticketPrice}` : 'Free'}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {activeTab === 'discussion' && (
                            <DiscussionTab id={event._id} type="event" />
                        )}

                        {activeTab === 'registrations' && (
                            <View className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5">
                                <Text className="text-zinc-400 text-center">Registrations view managed by Organizer View</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <EventRegisterModal
                visible={applyModalVisible}
                onClose={() => setApplyModalVisible(false)}
                eventId={event._id}
                ticketTypes={ticketTypes || []}
                ticketPrice={event.ticketPrice}
            />

            <AuthPromptModal
                visible={authPromptVisible}
                onClose={() => setAuthPromptVisible(false)}
            />
        </View>
    );
};
