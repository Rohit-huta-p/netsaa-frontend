import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, TextInput, Alert, FlatList } from 'react-native';
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Check,
    X,
    Edit2,
    Plus,
    Settings,
    ArrowLeft,
    Share2,
    Heart,
    Zap,
    ShieldCheck
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { IEvent } from '@/types/event';
import { useDeleteEvent, useUpdateEvent, useEventRegistrations, useUpdateRegistrationStatus } from '@/hooks/useEvents';
import { EventSettingsModal } from './shared/EventSettingsModal';
import { ConfirmationModal } from './shared/ConfirmationModal';
import { EditableField } from '@/components/ui/EditableField';
import DiscussionTab from '../common/DiscussionTab';

interface OrganizerEventDetailsProps {
    event: IEvent;
}

export const OrganizerEventDetails: React.FC<OrganizerEventDetailsProps> = ({
    event,
}) => {
    const router = useRouter();

    // State
    const [activeTab, setActiveTab] = useState('About');
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState(event);

    // Mutations
    const deleteMutation = useDeleteEvent();
    const updateMutation = useUpdateEvent();
    const { data: registrations, isLoading: isLoadingRegistrations } = useEventRegistrations(event._id);
    const updateStatusMutation = useUpdateRegistrationStatus();

    // Stats
    const capacity = formData.maxParticipants || event.maxParticipants || 100;
    const registered = registrations?.filter((r: any) => r.status === 'registered' || r.status === 'approved').length || 0;
    const spotsLeft = capacity - registered;
    const progress = (registered / capacity) * 100;

    const tabs = [
        { key: 'About', label: 'About' },
        { key: 'Registrations', label: `Registrations (${registrations?.length || 0})` },
        { key: 'Discussion', label: 'Discussion' },
    ];

    // Handlers
    const handleUpdateStatus = (regId: string, status: string) => {
        updateStatusMutation.mutate({ registrationId: regId, status, eventId: event._id });
    };

    const handleEdit = () => {
        setShowSettings(false);
        setIsEditMode(true);
    };

    const handleSave = () => {
        updateMutation.mutate({ id: event._id, payload: formData }, {
            onSuccess: () => {
                setIsEditMode(false);
            }
        });
    };

    const handleCancel = () => {
        setIsEditMode(false);
        setFormData(event);
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

    // Helper to format image uri
    const imageUri = formData.coverImage || formData.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000";

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
                                        {formData.eventType || 'EVENT'}
                                    </Text>
                                </View>
                                <View className={`rounded-full px-4 py-1 ${event.status === 'published' ? 'bg-emerald-600' : 'bg-zinc-600'}`}>
                                    <Text className="text-white font-black text-[10px] uppercase tracking-[0.2em]">
                                        {event.status || 'DRAFT'}
                                    </Text>
                                </View>
                            </View>
                            <EditableField
                                isEditing={isEditMode}
                                value={formData.title}
                                label={isEditMode ? "Title" : undefined}
                                onChangeText={(text) => setFormData({ ...formData, title: text })}
                                textStyle="text-3xl md:text-5xl font-black text-white leading-tight mb-2"
                                containerStyle="mb-0"
                            />
                        </View>
                    </View>

                    {/* Top Actions */}
                    <View className="absolute top-4 right-4 flex-row gap-3 z-30">
                        <TouchableOpacity
                            onPress={() => setShowSettings(true)}
                            className="w-10 h-10 rounded-2xl bg-black/50 border border-white/10 items-center justify-center"
                        >
                            <Settings size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={isEditMode ? handleSave : handleEdit}
                            className={`w-10 h-10 rounded-2xl items-center justify-center border border-white/10 ${isEditMode ? 'bg-blue-600' : 'bg-black/50'}`}
                        >
                            {isEditMode ? <Check size={20} color="#FFFFFF" /> : <Edit2 size={20} color="#FFFFFF" />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* MAIN CONTENT */}
                <View className="md:flex-row md:justify-between items-start">
                    {/* LEFT COLUMN */}
                    <View className="flex-1 w-full md:mr-10">
                        {/* Meta Header */}
                        <View className="mb-8 pl-1">
                            {/* Tags */}
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {formData.tags?.map((tag: string, i: number) => (
                                    <View key={i} className="px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700 flex-row items-center">
                                        {isEditMode ? (
                                            <TextInput
                                                value={tag}
                                                onChangeText={(text) => {
                                                    const newTags = [...(formData.tags || [])];
                                                    newTags[i] = text;
                                                    setFormData({ ...formData, tags: newTags });
                                                }}
                                                className="text-white text-xs font-bold min-w-[40px] p-0 outline-none"
                                            />
                                        ) : (
                                            <Text className="text-zinc-400 text-xs">#{tag}</Text>
                                        )}
                                    </View>
                                ))}
                                {isEditMode && (
                                    <TouchableOpacity
                                        onPress={() => setFormData({ ...formData, tags: [...(formData.tags || []), "New Tag"] })}
                                        className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-600/50 flex-row items-center"
                                    >
                                        <Plus size={12} color="#3B82F6" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Quick Meta */}
                            <View className="flex-row justify-start gap-8 mb-4">
                                {/* Location */}
                                <View className="flex-row items-center gap-2">
                                    <View className="w-10 h-10 rounded-2xl bg-blue-500/10 items-center justify-center">
                                        <MapPin size={20} color="#3B82F6" />
                                    </View>
                                    <View className="flex-1">
                                        <EditableField
                                            isEditing={isEditMode}
                                            value={formData.location?.venueName || ""}
                                            placeholder="Venue Name"
                                            onChangeText={(text) => setFormData({ ...formData, location: { ...formData.location, venueName: text } })}
                                            textStyle="text-[12px] font-bold text-white mb-0.5"
                                            containerStyle="mb-0"
                                        />
                                        <EditableField
                                            isEditing={isEditMode}
                                            value={formData.location?.address || ""}
                                            placeholder="Address"
                                            onChangeText={(text) => setFormData({ ...formData, location: { ...formData.location, address: text } })}
                                            textStyle="text-[10px] text-zinc-400"
                                            containerStyle="mb-0"
                                        />
                                    </View>
                                </View>

                                {/* Date */}
                                <View className="flex-row items-center gap-2">
                                    <View className="w-10 h-10 rounded-2xl bg-purple-500/10 items-center justify-center">
                                        <Calendar size={20} color="#A855F7" />
                                    </View>
                                    <View className="flex-1">
                                        <EditableField
                                            isEditing={isEditMode}
                                            value={formData.schedule?.startDate ? new Date(formData.schedule.startDate).toISOString().split('T')[0] : ""}
                                            placeholder="YYYY-MM-DD"
                                            onChangeText={(text) => setFormData({
                                                ...formData,
                                                schedule: { ...formData.schedule, startDate: text }
                                            })}
                                            textStyle="text-[12px] font-bold text-white mb-0.5"
                                            containerStyle="mb-0"
                                        />
                                        <Text className="text-[10px] text-zinc-400">
                                            {formData.schedule?.startDate ? new Date(formData.schedule.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* RIGHT COLUMN (Stats) */}
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
                                    <Text className="text-xl font-black text-white mr-1">₹</Text>
                                    <EditableField
                                        isEditing={isEditMode}
                                        value={String(formData.ticketPrice || 0)}
                                        keyboardType="numeric"
                                        onChangeText={(text) => setFormData({ ...formData, ticketPrice: Number(text) })}
                                        textStyle="text-3xl font-black text-white"
                                        containerStyle="min-w-[50px] items-center"
                                    />
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
                                        style={{ width: `${progress}%` }}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity className="w-full py-4 rounded-2xl bg-zinc-800 items-center justify-center flex-row mb-4">
                                <Text className="text-zinc-500 font-bold">Organizer View</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* TABS - INLINE */}
                <View className="mt-8 mb-12">
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={tabs}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                key={item.key}
                                onPress={() => setActiveTab(item.key as any)}
                                className={`px-6 py-4 mb-5 ${activeTab === item.key ? 'border-b-2 border-blue-500' : ''}`}
                            >
                                <Text
                                    className={`text-[11px] font-black uppercase tracking-[0.15em] ${activeTab === item.key ? 'text-white' : 'text-zinc-500'}`}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />

                    {/* Tab Content */}
                    <View className="mt-4">
                        {activeTab === 'About' && (
                            <View className="space-y-6">
                                <View>
                                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                                        EVENT DESCRIPTION
                                    </Text>
                                    <View className="border-l-4 border-blue-500/30 pl-6">
                                        <EditableField
                                            isEditing={isEditMode}
                                            value={formData.description || ""}
                                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                                            multiline
                                            textStyle="text-xl text-zinc-300 leading-relaxed font-light"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        {activeTab === 'Registrations' && (
                            <View className="space-y-4">
                                {isLoadingRegistrations ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (!registrations || registrations.length === 0) ? (
                                    <View className="p-8 rounded-2xl bg-zinc-900/30 border border-white/5 items-center">
                                        <Text className="text-zinc-500">No registrations yet.</Text>
                                    </View>
                                ) : (
                                    registrations.map((reg: any) => (
                                        <View key={reg._id} className="p-6 rounded-3xl bg-zinc-900/30 border border-white/5">
                                            <View className="flex-row justify-between items-center mb-4">
                                                <View className="flex-row items-center gap-4">
                                                    <View className="w-12 h-12 rounded-2xl bg-zinc-800 items-center justify-center">
                                                        <Users size={20} color="#FFFFFF" />
                                                    </View>
                                                    <View>
                                                        <Text className="text-white font-black text-lg">
                                                            {reg.userId?.displayName || reg.userId?.email || 'User'}
                                                        </Text>
                                                        <Text className="text-zinc-500 text-xs uppercase tracking-wider font-bold">
                                                            {reg.status}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {reg.status === 'registered' && (
                                                    <View className="flex-row gap-2">
                                                        <TouchableOpacity
                                                            onPress={() => handleUpdateStatus(reg._id, 'approved')}
                                                            className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center"
                                                        >
                                                            <Check size={20} color="#10B981" />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleUpdateStatus(reg._id, 'rejected')}
                                                            className="w-10 h-10 rounded-xl bg-rose-500/20 items-center justify-center"
                                                        >
                                                            <X size={20} color="#F43F5E" />
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}

                        {activeTab === 'Discussion' && (
                            <DiscussionTab id={event._id} type="event" />
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Editing Save Bar */}
            {isEditMode && (
                <View className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-white/10 px-6 py-4 flex-row justify-between z-50">
                    <Text className="text-sm text-zinc-400 self-center">
                        Unsaved changes
                    </Text>
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={handleCancel}
                            className="px-4 py-2 bg-white/10 rounded-lg"
                        >
                            <Text className="font-bold text-white">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            className="px-6 py-2 bg-blue-600 rounded-lg"
                        >
                            <Text className="font-bold text-white">Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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
        </View>
    );
};
