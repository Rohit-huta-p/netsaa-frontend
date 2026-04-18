import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, TextInput, Alert, FlatList, useWindowDimensions, Linking } from 'react-native';
import {
    Calendar,
    MapPin,
    Users,
    Check,
    X,
    Edit2,
    Plus,
    Settings,
    ChevronLeft,
    ChevronDown,
    ClipboardList,
    Phone,
    MessageCircle,
    Ticket
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { IEvent } from '@/types/event';
import { useDeleteEvent, useUpdateEvent, useEventRegistrations, useUpdateRegistrationStatus } from '@/hooks/useEvents';
import { EventSettingsModal } from './shared/EventSettingsModal';
import { EventEditModal } from './shared/EventEditModal';
import { ConfirmationModal } from './shared/ConfirmationModal';
import { EditableField } from '@/components/ui/EditableField';
import DiscussionTab from '../common/DiscussionTab';
import { usePlatform } from '@/utils/platform';
import { useMobileTabBarHeight } from '@/components/MobileTabBar';

interface OrganizerEventDetailsProps {
    event: IEvent;
}

export const OrganizerEventDetails: React.FC<OrganizerEventDetailsProps> = ({
    event,
}) => {
    const router = useRouter();
    const { isWeb } = usePlatform();
    const { width: screenWidth } = useWindowDimensions();
    const isLargeScreen = screenWidth >= 1024;
    const tabBarHeight = useMobileTabBarHeight();

    // State
    const [activeTab, setActiveTab] = useState<'about' | 'registrations' | 'discussion'>('about');
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);

    // Mutations
    const deleteMutation = useDeleteEvent();
    const updateMutation = useUpdateEvent();
    const {
        data: registrationsData,
        isLoading: isLoadingRegistrations,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useEventRegistrations(event._id);
    const updateStatusMutation = useUpdateRegistrationStatus();

    const registrations = registrationsData?.pages?.flatMap(page => page.data) || [];

    // Stats
    const capacity = event.maxParticipants || 100;
    const registered = registrations.filter((r: any) => r.status === 'registered' || r.status === 'approved').length || 0;
    const spotsLeft = capacity - registered;
    const progress = (capacity > 0) ? (registered / capacity) * 100 : 0;

    const tabs = [
        { key: 'about', label: 'Overview' },
        { key: 'registrations', label: `Registrations (${registrations.length || 0})` },
        { key: 'discussion', label: 'Discussion' },
    ];

    // Handlers
    const handleUpdateStatus = (regId: string, status: string) => {
        updateStatusMutation.mutate({ registrationId: regId, status, eventId: event._id });
    };

    const handleEdit = () => {
        setShowSettings(false);
        setShowEditModal(true);
    };

    const handleSave = (payload: Partial<IEvent>) => {
        updateMutation.mutate({ id: event._id, payload }, {
            onSuccess: () => {
                setShowEditModal(false);
            }
        });
    };

    const handleDelete = () => {
        setShowSettings(false);
        setTimeout(() => setShowDeleteConfirm(true), 250);
    };

    const confirmDelete = () => {
        deleteMutation.mutate(event._id, {
            onSuccess: () => router.back(),
        });
    };

    const handleToggleStatus = () => {
        setShowSettings(false);
        const newStatus = event.status === 'published' ? 'draft' : 'published';
        updateMutation.mutate({ id: event._id, payload: { status: newStatus } });
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return 'TBD';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const imageUri = event.thumbnailUrl || event.coverImage;

    const description = event.description || 'No description provided.';
    const isLongDescription = description.length > 180;

    return (
        <View className="flex-1 bg-[#111111]">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: isLargeScreen ? 60 : (tabBarHeight > 0 ? tabBarHeight + 140 : 180) }}
                onScroll={({ nativeEvent }) => {
                    if (activeTab === 'registrations' && hasNextPage && !isFetchingNextPage) {
                        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
                        if (isCloseToBottom) {
                            fetchNextPage();
                        }
                    }
                }}
                scrollEventThrottle={400}
            >
                <View style={isLargeScreen ? { flexDirection: 'row', maxWidth: 1152, alignSelf: 'center', width: '100%', paddingHorizontal: 24, gap: 48 } : undefined}>

                    {/* ── LEFT / MAIN COLUMN ── */}
                    <View style={isLargeScreen ? { flex: 2 } : undefined}>
                        {/* HERO IMAGE */}
                        <View className="px-4 pt-14" style={isLargeScreen ? { paddingHorizontal: 0, paddingTop: 40 } : undefined}>
                            <View style={{ width: '100%', height: 220, position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
                                <Image
                                    source={imageUri ? { uri: imageUri } : require('@/assets/netsaa.png')}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
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

                                    <View className="flex-row gap-2">
                                        <TouchableOpacity
                                            onPress={() => setShowSettings(true)}
                                            className="w-9 h-9 rounded-full bg-black/40 items-center justify-center border border-white/10"
                                        >
                                            <Settings size={18} color="#FFFFFF" />
                                        </TouchableOpacity>
                                        {/* Optional global edit shortcut 
                                        <TouchableOpacity
                                            onPress={handleEdit}
                                            className={`w-9 h-9 rounded-full bg-black/40 items-center justify-center border border-white/10`}
                                        >
                                            <Edit2 size={18} color="#FFFFFF" />
                                        </TouchableOpacity>
                                        */}
                                    </View>
                                </View>

                                {/* Badges */}
                                <View className="absolute bottom-4 left-4">
                                    <View className="flex-row items-center gap-2 flex-wrap">
                                        <View className="bg-blue-600 rounded-full px-3 py-1">
                                            <Text className="text-white font-semibold text-xs">
                                                {event.eventType || event.category || 'Event'}
                                            </Text>
                                        </View>
                                        <View className={`rounded-full px-3 py-1 border border-white/20 ${event.status === 'published' ? 'bg-emerald-600/80' : 'bg-black/50'}`}>
                                            <Text className="text-white text-xs font-semibold">
                                                {event.status || 'DRAFT'}
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

                            {/* Meta */}
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

                            {/* Colorful Info Cards */}
                            <View className="flex-row gap-3 mt-2">
                                {/* DATE */}
                                <View className="flex-1 rounded-2xl overflow-hidden">
                                    <LinearGradient
                                        colors={['#6366f1', '#818cf8']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ padding: 11, flex: 1, borderRadius: 16, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                                    >
                                        <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center">
                                            <Calendar size={18} color="#fff" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white font-bold text-xs" numberOfLines={2}>
                                                {formatDateTime(event.schedule?.startDate)}
                                                {event.schedule?.endDate ? ` - ${formatDateTime(event.schedule.endDate)}` : ''}
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </View>

                                {/* VENUE */}
                                <View className="flex-1 rounded-2xl overflow-hidden">
                                    <LinearGradient
                                        colors={['#e11d48', '#f43f5e']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ padding: 11, flex: 1, borderRadius: 16, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                                    >
                                        <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center">
                                            <MapPin size={18} color="#fff" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-white font-bold text-sm" numberOfLines={1}>{event.location?.venueName || 'TBD'}</Text>
                                            <Text className="text-white/70 text-xs mt-0.5" numberOfLines={1}>{event.location?.address || event.location?.city || ''}</Text>
                                        </View>
                                    </LinearGradient>
                                </View>
                            </View>
                        </View>

                        {/* TABS */}
                        <View className="mt-8 mb-4 w-full px-5" style={isLargeScreen ? { paddingHorizontal: 0 } : undefined}>
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
                                                <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : (
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
                                                <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}>
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
                                    <View>
                                        <View>
                                            <Text className="text-zinc-400 text-sm leading-relaxed" numberOfLines={showFullDescription ? undefined : 6}>
                                                {description}
                                            </Text>
                                            {isLongDescription && (
                                                <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)} className="flex-row items-center gap-1 mt-3">
                                                    <Text className="text-white text-sm font-semibold">{showFullDescription ? 'Show less' : 'Read full description'}</Text>
                                                    <ChevronDown size={14} color="#fff" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        {/* Prep required view */}
                                        {event.eventConfig?.preparationRequired === true && (
                                            <View className="rounded-2xl overflow-hidden mt-6">
                                                <LinearGradient colors={['#0d9488', '#14b8a6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, borderRadius: 16 }}>
                                                    <View className="flex-row items-center gap-2 mb-3">
                                                        <View className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center">
                                                            <ClipboardList size={18} color="#fff" />
                                                        </View>
                                                        <Text className="text-white text-xs font-bold uppercase tracking-wider">PREPARATION REQUIRED</Text>
                                                    </View>
                                                    <Text className="text-white/90 text-sm leading-relaxed mb-3">
                                                        {event.eventConfig.preparationNotes || "Check with organizer for details"}
                                                    </Text>
                                                </LinearGradient>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {activeTab === 'registrations' && (
                                    <View className="space-y-4">
                                        {isLoadingRegistrations ? (
                                            <ActivityIndicator color="#FFFFFF" className="mt-4" />
                                        ) : (!registrations || registrations.length === 0) ? (
                                            <View className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 items-center mt-4">
                                                <Text className="text-zinc-500">No registrations yet.</Text>
                                            </View>
                                        ) : (
                                            registrations.map((reg: any) => (
                                                <View key={reg._id} className="mb-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
                                                    {/* Registration Header */}
                                                    <View className="p-4 bg-zinc-800/50 border-b border-zinc-800 flex-row justify-between items-center">
                                                        <View>
                                                            <Text className="text-white font-semibold">
                                                                {reg.userId?.displayName || reg.userId?.email || 'User'}
                                                            </Text>
                                                            <Text className="text-zinc-500 text-xs mt-0.5">
                                                                {reg.quantity} Ticket{reg.quantity > 1 ? 's' : ''} • ID: {reg._id.slice(-6).toUpperCase()}
                                                            </Text>
                                                        </View>
                                                        <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                            <Text className="text-emerald-500 text-[8px] font-bold uppercase tracking-wider">{reg.status}</Text>
                                                        </View>
                                                    </View>

                                                    {/* Attendees List */}
                                                    <View className="p-2">
                                                        {reg.attendees?.length > 0 ? (
                                                            reg.attendees.map((attendee: any, index: number) => (
                                                                <View key={index} className="p-3 mb-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex-row justify-between items-center">
                                                                    <View className="flex-1 mr-3">
                                                                        <Text className="text-white font-bold text-base mb-0.5">{attendee.fullName || 'Attendee'}</Text>
                                                                        {attendee.email ? (
                                                                            <Text className="text-zinc-400 text-xs mb-0.5">{attendee.email}</Text>
                                                                        ) : null}
                                                                        {attendee.phone ? (
                                                                            <Text className="text-zinc-500 text-xs">{attendee.phone}</Text>
                                                                        ) : null}
                                                                    </View>

                                                                    {/* Actions */}
                                                                    <View className="flex-row gap-2">
                                                                        {attendee.phone && (
                                                                            <>
                                                                                <TouchableOpacity
                                                                                    onPress={() => Linking.openURL(`tel:${attendee.phone}`)}
                                                                                    className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 items-center justify-center"
                                                                                >
                                                                                    <Phone size={16} color="#3b82f6" />
                                                                                </TouchableOpacity>
                                                                                <TouchableOpacity
                                                                                    onPress={() => Linking.openURL(`whatsapp://send?phone=${attendee.phone}`)}
                                                                                    className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center"
                                                                                >
                                                                                    <MessageCircle size={16} color="#10b981" />
                                                                                </TouchableOpacity>
                                                                            </>
                                                                        )}
                                                                        <TouchableOpacity
                                                                            className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 items-center justify-center"
                                                                        >
                                                                            <Ticket size={16} color="#a855f7" />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                </View>
                                                            ))
                                                        ) : (
                                                            /* Fallback if no specific attendees array (e.g. legacy data) */
                                                            <View className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex-row justify-between items-center">
                                                                <View className="flex-1 mr-3">
                                                                    <Text className="text-white font-bold text-base mb-0.5">{reg.userId?.displayName || 'Attendee'}</Text>
                                                                    {reg.userId?.email ? <Text className="text-zinc-400 text-xs mb-0.5">{reg.userId.email}</Text> : null}
                                                                    {reg.userId?.phoneNumber ? <Text className="text-zinc-500 text-xs">{reg.userId.phoneNumber}</Text> : null}
                                                                </View>
                                                                <View className="flex-row gap-2">
                                                                    {reg.userId?.phoneNumber && (
                                                                        <>
                                                                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${reg.userId.phoneNumber}`)} className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 items-center justify-center">
                                                                                <Phone size={16} color="#3b82f6" />
                                                                            </TouchableOpacity>
                                                                            <TouchableOpacity onPress={() => Linking.openURL(`whatsapp://send?phone=${reg.userId.phoneNumber}`)} className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                                                                                <MessageCircle size={16} color="#10b981" />
                                                                            </TouchableOpacity>
                                                                        </>
                                                                    )}
                                                                    <TouchableOpacity className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 items-center justify-center">
                                                                        <Ticket size={16} color="#a855f7" />
                                                                    </TouchableOpacity>
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                        {isFetchingNextPage && (
                                            <ActivityIndicator color="#FFFFFF" className="my-4" />
                                        )}
                                    </View>
                                )}
                                {activeTab === 'discussion' && (
                                    <DiscussionTab id={event._id} type="event" />
                                )}
                            </View>
                        </View>
                    </View>

                    {/* ── RIGHT COLUMN: Desk Sidebar / Or below on mobile ── */}
                    <View style={isLargeScreen ? { flex: 1, minWidth: 280 } : { width: '100%', paddingHorizontal: 20, marginTop: 20 }}>
                        <View style={isLargeScreen ? { position: 'sticky' as any, top: 96 } : undefined}>
                            {/* Organizer Stats Card */}
                            <View className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800" style={{ gap: 20 }}>
                                {/* Price Editor */}
                                <View>
                                    <Text className="text-zinc-500 text-xs font-medium uppercase mb-2" style={{ letterSpacing: 1.2 }}>Ticket Price (Base)</Text>
                                    <View className="flex-row items-center border border-zinc-700 bg-zinc-950 px-4 py-3 rounded-xl">
                                        <Text className="text-white text-xl font-semibold mr-1">₹</Text>
                                        <Text className="text-xl font-semibold text-white p-0 m-0">{event.ticketPrice || 0}</Text>
                                    </View>
                                </View>

                                {/* Capacity Stats */}
                                <View className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                                    <View className="flex-row justify-between items-center mb-3">
                                        <Text className="text-zinc-400 text-sm font-medium">Capacity</Text>
                                        <Text className="text-white font-semibold">{registered} / {capacity}</Text>
                                    </View>
                                    <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <View
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.min(100, progress)}%` }}
                                        />
                                    </View>
                                    <Text className="text-zinc-500 text-xs mt-3 text-right">{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</Text>
                                </View>
                            </View>
                        </View>
                    </View >

                </View >
            </ScrollView >

            <EventEditModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                event={event}
                onSave={handleSave}
                isSaving={updateMutation.isPending}
            />

            <EventSettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                event={event}
            />

            <ConfirmationModal
                visible={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Event"
                message="Are you sure you want to delete this event?"
                confirmText="Delete"
                isDestructive
            />
        </View >
    );
};
