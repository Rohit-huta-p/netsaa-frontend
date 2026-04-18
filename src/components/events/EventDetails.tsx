import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, FlatList, Dimensions, useWindowDimensions, Linking } from 'react-native';
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
    User as UserIcon,
    Info,
    ClipboardList,
    Trophy,
    Medal,
    Users,
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    DoorOpen,
    Ticket,
} from 'lucide-react-native';
import { MapLinkCard } from '@/components/location/MapLinkCard';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '@/stores/authStore';
import { usePlatform } from '@/utils/platform';
import { useRouter } from 'expo-router';
import { IEvent } from '@/types/event';
import { useEventTicketTypes, useMyRegistrations } from '@/hooks/useEvents';
import DiscussionTab from '../common/DiscussionTab';
import { AuthPromptModal } from '../common/AuthPromptModal';
import { ShareBottomSheet } from '../common/ShareBottomSheet';

// Tab bar height for dynamic padding
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

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
    const [authPromptVisible, setAuthPromptVisible] = useState(false);
    const [isSaved, setIsSaved] = useState(false); // TODO: Fetch initial state
    const [activeTab, setActiveTab] = useState<'about' | 'schedule' | 'tickets' | 'venue' | 'host' | 'discussion' | 'registrations'>('about');
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [shareSheetVisible, setShareSheetVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const tabBarHeight = useMobileTabBarHeight();
    const { width: screenWidth } = useWindowDimensions();
    const isLargeScreen = screenWidth >= 1024; // Tailwind lg: breakpoint

    // Data Hooks
    const { data: ticketTypes, isLoading: loadingTickets } = useEventTicketTypes(event._id);
    const { data: myRegistrations } = useMyRegistrations();
    console.log("event Registrations: ", myRegistrations);
    const isRegistered = myRegistrations?.some((reg: any) => reg.eventId === event._id);

    // Derived Data
    const capacity = event.maxParticipants || 100; // Default if missing

    // Calculate registered count based on event field, not myRegistrations.
    // We check event.registrationsCount (if exists) or event.registered.
    const hasRegistrationCount = (event as any).registrationsCount !== undefined || event.registered !== undefined;
    const registered = (event as any).registrationsCount ?? event.registered ?? 0;

    const isFull = hasRegistrationCount ? registered >= capacity : false;
    const isDeadlinePassed = event.registrationDeadline ? new Date() > new Date(event.registrationDeadline) : false;
    const showDiscussion = true; // Conditional logic from request

    const handleShare = () => {
        setShareSheetVisible(true);
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
        router.push(`/events/${event._id}/register`);
    };

    const handleWaitlist = async () => {
        // Stub for waitlist
        try {
            setIsProcessing(true);
            // await eventService.joinWaitlist(event._id);
            setTimeout(() => {
                Alert.alert("Waitlist", "You have joined the waitlist!");
                setIsProcessing(false);
            }, 1000);
        } catch (e) {
            setIsProcessing(false);
            console.error(e);
        }
    };

    const tabs = [
        { key: 'about', label: 'Overview' },
        ...(showDiscussion ? [{ key: 'discussion', label: 'Discussion' }] : []),
        ...(isOrganizer ? [{ key: 'registrations', label: 'Registrations' }] : []),
    ];

    // Helper to format image uri
    const hasProvidedImage = !!(event.coverImage || event.image);
    const imageUri = hasProvidedImage ? (event.coverImage || event.image) : null;
    const fallbackLogo = require('../../../assets/netsaa.png');

    const renderCTAButton = () => {
        // State 2: Processing
        if (isProcessing) {
            return (
                <TouchableOpacity disabled className="flex-1 py-4 rounded-2xl items-center justify-center flex-row bg-zinc-800">
                    <Text className="text-lg font-black text-zinc-500">Processing...</Text>
                </TouchableOpacity>
            );
        }

        // State 3: Registered
        if (isRegistered) {
            return (
                <TouchableOpacity onPress={() => router.push('/saved')} className="flex-1 py-4 px-2 rounded-2xl items-center justify-center flex-row bg-emerald-500 active:scale-95">
                    <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text className="text-base font-black text-white" numberOfLines={1} adjustsFontSizeToFit>You're In · View Ticket</Text>
                </TouchableOpacity>
            );
        }

        // State 6: Registration Closed
        if (isDeadlinePassed) {
            return (
                <TouchableOpacity disabled className="flex-1 py-4 rounded-2xl items-center justify-center flex-row bg-zinc-800">
                    <Text className="text-lg font-black text-zinc-500">Registration Closed</Text>
                </TouchableOpacity>
            );
        }

        // States 4 & 5: Sold Out
        if (isFull) {
            if (event.allowWaitlist) {
                // State 5: Waitlist
                return (
                    <TouchableOpacity onPress={handleWaitlist} className="flex-1 py-4 rounded-2xl items-center justify-center flex-row bg-amber-500 active:scale-95">
                        <Text className="text-lg font-black text-white">Join Waitlist</Text>
                    </TouchableOpacity>
                );
            } else {
                // State 4: Sold Out no waitlist
                return (
                    <TouchableOpacity disabled className="flex-1 py-4 rounded-2xl items-center justify-center flex-row bg-zinc-800">
                        <Text className="text-lg font-black text-zinc-500">Sold Out</Text>
                    </TouchableOpacity>
                );
            }
        }

        // State 1: Default
        return (
            <TouchableOpacity onPress={handleRegister} className="flex-1 py-3.5 px-6 rounded-xl items-center justify-center flex-row bg-purple-600 active:scale-95">
                <Text className="text-sm font-semibold text-white tracking-wide">
                    Get Tickets
                </Text>
                <ArrowRight size={16} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
        );
    };

    const description = event.description || 'No description provided.';
    const isLongDescription = description.length > 180;

    // Format dates
    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'TBD';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return 'TBD';
        return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const handleLocationPress = () => {
        if (!event.location) return;

        // Combine available location parts for a more accurate Google Maps search
        const locationParts = [
            event.location.venueName,
            event.location.address,
            event.location.city
        ].filter(Boolean);

        const query = locationParts.join(', ');
        if (!query) return;

        // Encode the query for a Google Maps search URL
        const encodedQuery = encodeURIComponent(query);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

        Linking.openURL(mapsUrl).catch(err => {
            console.error('Failed to open maps url:', err);
            Alert.alert('Error', 'Could not open maps. Please try again later.');
        });
    };

    return (
        <View className="flex-1 bg-[#111111]">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: isLargeScreen ? 40 : (tabBarHeight > 0 ? tabBarHeight + 120 : 160) }}
            >
                {/* Responsive two-column grid wrapper */}
                <View style={isLargeScreen ? { flexDirection: 'row', maxWidth: 1152, alignSelf: 'center', width: '100%', paddingHorizontal: 24, gap: 48 } : undefined}>

                    {/* ── LEFT / MAIN COLUMN ── */}
                    <View style={isLargeScreen ? { flex: 2 } : undefined}>
                        {/* HERO IMAGE — Rounded */}
                        <View className="px-4 pt-14" style={isLargeScreen ? { paddingHorizontal: 0 } : undefined}>
                            <View style={{ width: '100%', height: 220, position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
                                {hasProvidedImage ? (
                                    <Image
                                        source={{ uri: imageUri! }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                                        <Image
                                            source={fallbackLogo}
                                            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.6 }}
                                            resizeMode="cover"
                                            blurRadius={20}
                                        />
                                        {/* <Image
                                            source={fallbackLogo}
                                            style={{ width: '60%', height: '60%' }}
                                            resizeMode="contain"
                                        /> */}
                                    </View>
                                )}
                                <LinearGradient
                                    colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.6)']}
                                    locations={[0, 0.4, 1]}
                                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                />
                                {/* Top Actions */}
                                <View className="absolute top-4 left-4 right-4 flex-row justify-between items-center z-30">
                                    <TouchableOpacity
                                        onPress={() => router.back()}
                                        className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
                                    >
                                        <ChevronLeft size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSave}
                                        className="w-9 h-9 rounded-full bg-black/40 items-center justify-center"
                                    >
                                        <Heart size={18} color={isSaved ? '#EF4444' : '#FFFFFF'} fill={isSaved ? '#EF4444' : 'none'} />
                                    </TouchableOpacity>
                                </View>
                                {/* Category Badge */}
                                <View className="absolute bottom-4 left-4">
                                    <View className="flex-row items-center gap-2">
                                        <View className="bg-[#A3E635] rounded-full px-3 py-1">
                                            <Text className="text-black font-semibold text-xs">
                                                {event.eventType || event.category || 'Event'}
                                            </Text>
                                        </View>
                                        {/* Tags next to category */}
                                        {event.tags && event.tags.length > 0 && event.tags.slice(0, 3).map((tag: string, idx: number) => (
                                            <View key={idx} className="px-2.5 py-1 bg-black/50 rounded-full border border-white/20">
                                                <Text className="text-white text-xs">#{tag}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* CONTENT */}
                        <View className="px-5 mt-5">
                            {/* Title */}
                            <Text className="text-3xl font-black text-white leading-tight mb-2">
                                {event.title}
                            </Text>

                            {/* Location + Capacity Meta */}
                            <View className="flex-row items-center flex-wrap gap-x-1 mb-5">
                                <MapPin size={14} color="#71717a" />
                                <Text className="text-zinc-500 text-sm">
                                    {event.location?.venueName || event.location?.city || 'Location TBD'}{event.location?.city ? `, ${event.location.city}` : ''}
                                </Text>
                                <Text className="text-zinc-600 text-sm mx-1">·</Text>
                                <Users size={14} color="#71717a" />
                                <Text className="text-zinc-500 text-sm">
                                    {capacity} Capacity
                                </Text>
                            </View>

                            {/* Organizer Row */}
                            <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
                                <View className="w-11 h-11 rounded-full overflow-hidden bg-zinc-800">
                                    {event.organizer?.profileImageUrl ? (
                                        <Image
                                            source={{ uri: event.organizer.profileImageUrl }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center bg-zinc-700">
                                            <Text className="text-white font-bold text-lg">
                                                {event.organizer?.name?.charAt(0) || 'O'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-semibold text-sm">
                                        {event.organizer?.name || 'Organizer'}
                                    </Text>
                                    <Text className="text-zinc-500 text-xs">Event Organizer</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => event.organizerId && router.push(`/profile/${event.organizerId}`)}
                                    className="px-4 py-1.5 rounded-full border border-purple-500"
                                >
                                    <Text className="text-purple-400 text-xs font-semibold">Follow</Text>
                                </TouchableOpacity>
                            </View>
                            {/* Colorful Info Cards - Side by Side */}
                            <View className="flex-row gap-3">
                                {/* DATE  Card - Purple/Blue */}
                                <View className="flex-1 rounded-2xl overflow-hidden " style={{}}>
                                    <LinearGradient
                                        colors={['#6366f1', '#818cf8']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            padding: 11, flex: 1, borderRadius: 16, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
                                            , gap: 10
                                        }}
                                    >

                                        <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center">
                                            <Calendar size={18} color="#fff" />
                                        </View>
                                        <Text className="text-white font-bold text-xs">
                                            {formatDateTime(event.schedule?.startDate)}
                                            {event.schedule?.endDate ? ` - ${formatDateTime(event.schedule.endDate)}` : ''}
                                        </Text>
                                    </LinearGradient>
                                </View>

                                {/* VENUE Card - Pink/Red */}
                                <TouchableOpacity
                                    className="flex-1 rounded-2xl overflow-hidden"
                                    onPress={handleLocationPress}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['#e11d48', '#f43f5e']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            padding: 11, flex: 1, borderRadius: 16, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
                                            , gap: 10
                                        }}
                                    >
                                        <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center">
                                            <MapPin size={18} color="#fff" />
                                        </View>

                                        <View className="flex-1">

                                            <Text className="text-white font-bold text-sm">
                                                {event.location?.venueName || 'TBD'}
                                            </Text>

                                            <Text className="text-white/70 text-xs mt-1">
                                                {event.location?.address || event.location?.city || ''}
                                            </Text>


                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* TABS - INLINE implementation to match GigDetails (FlatList) */}
                        <View className="mt-8 mb-12 w-full px-5" style={isLargeScreen ? { paddingHorizontal: 0 } : undefined}>
                            {isWeb ? (
                                <View className="flex-row w-full border-b border-zinc-800">
                                    {tabs.map((item) => {
                                        const isActive = activeTab === item.key;

                                        return (
                                            <TouchableOpacity
                                                key={item.key}
                                                onPress={() => setActiveTab(item.key as any)}
                                                className={`py-3 mr-6 ${isActive ? 'border-b-2 border-white' : ''}`}
                                            >
                                                <Text
                                                    className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}
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
                                    contentContainerStyle={{ paddingHorizontal: 0 }}
                                    renderItem={({ item }) => {
                                        const isActive = activeTab === item.key;

                                        return (
                                            <TouchableOpacity
                                                onPress={() => setActiveTab(item.key as any)}
                                                className={`py-3 mr-6 ${isActive ? 'border-b-2 border-white' : ''}`}
                                            >
                                                <Text
                                                    className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}
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
                                    <View style={{ gap: 20 }}>
                                        {/* Description */}
                                        <View>
                                            <Text
                                                className="text-zinc-400 text-sm leading-relaxed"
                                                numberOfLines={showFullDescription ? undefined : 4}
                                            >
                                                {description}
                                            </Text>
                                            {isLongDescription && (
                                                <TouchableOpacity
                                                    onPress={() => setShowFullDescription(!showFullDescription)}
                                                    className="flex-row items-center gap-1 mt-3"
                                                >
                                                    <Text className="text-white text-sm font-semibold">
                                                        {showFullDescription ? 'Show less' : 'Read full description'}
                                                    </Text>
                                                    <ChevronDown size={14} color="#fff" />
                                                </TouchableOpacity>
                                            )}
                                        </View>



                                        {/* PREPARATION REQUIRED Card - Teal */}
                                        {event.eventConfig?.preparationRequired === true && (
                                            <View className="rounded-2xl overflow-hidden">
                                                <LinearGradient
                                                    colors={['#0d9488', '#14b8a6']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={{ padding: 16, borderRadius: 16 }}
                                                >
                                                    <View className="flex-row items-center gap-2 mb-3">
                                                        <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center">
                                                            <ClipboardList size={18} color="#fff" />
                                                        </View>
                                                        <Text className="text-white text-xs font-bold uppercase tracking-wider">
                                                            PREPARATION REQUIRED
                                                        </Text>
                                                    </View>
                                                    <Text className="text-white/90 text-sm leading-relaxed mb-3">
                                                        {event.eventConfig.preparationNotes || "Check with organizer for details"}
                                                    </Text>
                                                    {/* Tags */}
                                                    <View className="flex-row flex-wrap gap-2">
                                                        {event.skillLevel && event.skillLevel !== 'all' && (
                                                            <View className="px-3 py-1 rounded-full border border-white/30">
                                                                <Text className="text-white text-xs font-medium capitalize">{event.skillLevel} Level</Text>
                                                            </View>
                                                        )}
                                                        {event.eligibleArtistTypes?.map((type, idx) => (
                                                            <View key={idx} className="px-3 py-1 rounded-full border border-white/30">
                                                                <Text className="text-white text-xs font-medium">{type}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </LinearGradient>
                                            </View>
                                        )}


                                    </View>
                                )}

                                {activeTab === 'tickets' && (
                                    <View className="space-y-4">
                                        {ticketTypes && ticketTypes.length > 0 ? (
                                            ticketTypes.map((ticket: any) => (
                                                <View key={ticket._id} className="p-6 rounded-xl bg-zinc-900/40 border border-white/5">
                                                    <View className="flex-row justify-between items-start mb-3">
                                                        <View className="flex-1 mr-4">
                                                            <Text className="text-white font-bold text-lg">{ticket.name}</Text>
                                                            {ticket.description && (
                                                                <Text className="text-zinc-400 text-xs mt-1">{ticket.description}</Text>
                                                            )}
                                                        </View>
                                                        <Text className="text-white font-black text-xl">
                                                            ₹{ticket.price}
                                                        </Text>
                                                    </View>

                                                    <View className="space-y-3 mt-4 border-t border-white/5 pt-4">
                                                        {/* Sales Window */}
                                                        {(ticket.salesStartAt || ticket.salesEndAt) && (
                                                            <View className="flex-row items-center justify-between">
                                                                <Text className="text-zinc-500 text-xs">Sales Element</Text>
                                                                <Text className="text-zinc-400 text-xs font-medium text-right flex-1 ml-4">
                                                                    {ticket.salesStartAt ? new Date(ticket.salesStartAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Now'} → {ticket.salesEndAt ? new Date(ticket.salesEndAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Until Event'}
                                                                </Text>
                                                            </View>
                                                        )}

                                                        <View className="flex-row items-center justify-between">
                                                            {/* Capacity Info */}
                                                            <Text className={`text-xs font-bold ${ticket.capacity === 0 ? 'text-red-500' : 'text-zinc-300'}`}>
                                                                {ticket.capacity === 0 ? 'Sold Out' : `${ticket.capacity} seats available`}
                                                            </Text>

                                                            {/* Refund Policy */}
                                                            <View className={`px-2 py-1 rounded-md ${ticket.isRefundable ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                                                <Text className={`text-[10px] font-bold ${ticket.isRefundable ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                    {ticket.isRefundable ? 'Refundable' : 'Non-refundable'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
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
                    </View>{/* end left/main column */}

                    {/* ── RIGHT COLUMN: Desktop Sidebar ── */}
                    {isLargeScreen && !isOrganizer && (
                        <View style={{ flex: 1, minWidth: 280 }}>
                            <View style={{ position: 'sticky' as any, top: 96 }}>
                                <View className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800" style={{ gap: 20 }}>

                                    {/* Price Header */}
                                    <View>
                                        <Text className="text-zinc-500 text-xs font-medium uppercase" style={{ letterSpacing: 1.2, marginBottom: 8 }}>Registration</Text>
                                        <View className="flex-row items-end gap-2">
                                            <Text className="text-white text-4xl font-semibold" style={{ letterSpacing: -1 }}>
                                                {event.ticketPrice > 0
                                                    ? (event.pricingMode === 'ticketed' ? `Starts at ₹${event.ticketPrice}` : `₹${event.ticketPrice}`)
                                                    : 'Free'}
                                            </Text>
                                            {event.ticketPrice > 0 ? <Text className="text-zinc-500 text-sm" style={{ marginBottom: 4 }}>/ person</Text> : null}
                                        </View>
                                    </View>

                                    {/* Divider */}
                                    <View style={{ height: 1, backgroundColor: '#27272a' }} />

                                    {/* Ticket Types */}
                                    <View style={{ gap: 10 }}>
                                        {ticketTypes && ticketTypes.length > 0 ? (
                                            ticketTypes.map((ticket: any) => {
                                                const isSelected = selectedTicketId === ticket._id;
                                                return (
                                                    <TouchableOpacity
                                                        key={ticket._id}
                                                        onPress={() => setSelectedTicketId(ticket._id)}
                                                        disabled={ticket.capacity <= 0}
                                                        className={`p-4 rounded-xl border-2 ${isSelected
                                                            ? 'border-zinc-600 bg-zinc-800'
                                                            : 'border-transparent bg-zinc-950'
                                                            } ${ticket.capacity <= 0 ? 'opacity-50' : ''}`}
                                                        activeOpacity={0.7}
                                                    >
                                                        <View className="flex-row justify-between items-start">
                                                            <View style={{ flex: 1, marginRight: 12 }}>
                                                                <View className="flex-row items-center gap-2">
                                                                    <Text className="text-white text-sm font-medium">{ticket.name}</Text>
                                                                    {ticket.price > 0 && ticket.price !== (event.ticketPrice || 0) && (
                                                                        <View className="bg-white rounded-sm px-1.5 py-0.5">
                                                                            <Text className="text-black text-[10px] font-semibold uppercase">+₹{ticket.price - (event.ticketPrice || 0)}</Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                                {ticket.description && (
                                                                    <Text className="text-zinc-400 text-xs mt-1">{ticket.description}</Text>
                                                                )}
                                                                {ticket.capacity <= 0 && (
                                                                    <Text className="text-red-500 text-xs font-bold mt-1">SOLD OUT</Text>
                                                                )}
                                                            </View>
                                                            <View
                                                                style={{
                                                                    width: 20, height: 20, borderRadius: 10,
                                                                    borderWidth: isSelected ? 4 : 1,
                                                                    borderColor: isSelected ? '#8b5cf6' : '#52525b',
                                                                    backgroundColor: 'transparent',
                                                                }}
                                                            />
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        ) : (
                                            <View className="p-4 rounded-xl border-2 border-zinc-600 bg-zinc-800">
                                                <View className="flex-row justify-between items-start">
                                                    <View>
                                                        <Text className="text-white text-sm font-medium">General Admission</Text>
                                                        <Text className="text-zinc-400 text-xs mt-1">Standard entry ticket</Text>
                                                    </View>
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 4, borderColor: '#8b5cf6', backgroundColor: 'transparent' }} />
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {/* Checkout CTA */}
                                    {renderCTAButton()}
                                    <Text className="text-zinc-500 text-xs font-medium text-center">Secure checkout powered by Stripe</Text>
                                </View>
                            </View>
                        </View>
                    )}

                </View>{/* end grid wrapper */}
            </ScrollView>

            {/* Mobile Sticky CTA Footer (hidden on large screens — sidebar handles it) */}
            {
                !isLargeScreen && !isOrganizer && (
                    <View
                        className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-4 pt-4"
                        style={{ paddingBottom: Math.max(tabBarHeight, 24) }}
                    >
                        <View className="flex-row items-center justify-between gap-4">
                            <View className="flex-none">
                                <Text className="text-zinc-400 text-xs font-medium mb-0.5">Price</Text>
                                <Text className="text-white text-xl font-semibold" style={{ letterSpacing: -0.5 }}>
                                    {event.ticketPrice > 0
                                        ? (event.pricingMode === 'ticketed' ? `Starts at ₹${event.ticketPrice}` : `₹${event.ticketPrice}`)
                                        : 'Free'}
                                </Text>
                            </View>
                            {renderCTAButton()}
                        </View>
                    </View>
                )
            }            <AuthPromptModal
                visible={authPromptVisible}
                onClose={() => setAuthPromptVisible(false)}
            />

            {/* Share Bottom Sheet */}
            <ShareBottomSheet
                visible={shareSheetVisible}
                onClose={() => setShareSheetVisible(false)}
                type="event"
                data={event}
            />
        </View >
    );
};
