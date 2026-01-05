import React, { useState, useEffect } from "react"; // Added useEffect for state sync if needed
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Users, Edit2, ArrowLeft, Settings, Calendar, MapPin, Plus, Check, X } from "lucide-react-native"; // Added missing icons
import { useRouter } from "expo-router";

import { IEvent } from "@/types/event";
import { useDeleteEvent, useUpdateEvent, useEventRegistrations, useUpdateRegistrationStatus } from "@/hooks/useEvents"; // Added useUpdateEvent

import AppScrollView from "../AppScrollView";
// import { EventHero } from "./shared/EventHero"; // Removed
// import { EventMetaInfo } from "./shared/EventMetaInfo"; // Removed

import { EventSettingsModal } from "./shared/EventSettingsModal";
import { ConfirmationModal } from "./shared/ConfirmationModal";
import { EditableField } from "@/components/ui/EditableField"; // Added EditableField import
import { EventHero } from "./shared/EventHero";
import { SegmentedTabs as Tabs } from "../common/SegmentedTabs";

interface OrganizerEventDetailsProps {
    event: IEvent;
}

export const OrganizerEventDetails: React.FC<OrganizerEventDetailsProps> = ({
    event,
}) => {
    const [activeTab, setActiveTab] = useState("About");
    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // In-Place Edit State
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState(event);

    // State synced via key prop in parent

    const router = useRouter();
    const deleteMutation = useDeleteEvent();
    const updateMutation = useUpdateEvent();

    // Registration Management
    const { data: registrations, isLoading: isLoadingRegistrations } = useEventRegistrations(event._id);
    const updateStatusMutation = useUpdateRegistrationStatus();

    const handleUpdateStatus = (regId: string, status: string) => {
        updateStatusMutation.mutate({ registrationId: regId, status, eventId: event._id });
    };

    /* ---------- MOCKED STATS (replace later) ---------- */
    const registered = 18;
    const totalApplications = 32;
    const max = formData.maxParticipants || event.maxParticipants;
    const spotsLeft = max - registered;
    const progress = (registered / max) * 100;

    const tabs = ["About", "Registrations", "Discussion"];

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
        setFormData(event); // Revert changes
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

    const renderTabContent = () => {
        switch (activeTab) {
            case "About":
                return (
                    <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10">
                        <Text className="text-lg font-satoshi-bold text-white mb-3">About This Event</Text>
                        <EditableField
                            isEditing={isEditMode}
                            value={formData.description || ""}
                            label="Description"
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            multiline
                            textStyle="text-netsa-text-secondary leading-relaxed font-inter"
                        />
                    </View>
                );

            case "Registrations":
                if (isLoadingRegistrations) {
                    return (
                        <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10 min-h-[200px] justify-center items-center">
                            <ActivityIndicator color="#A855F7" />
                        </View>
                    );
                }

                if (!registrations || registrations.length === 0) {
                    return (
                        <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10 min-h-[200px] justify-center items-center">
                            <Text className="text-netsa-text-muted font-inter">No registrations yet.</Text>
                        </View>
                    );
                }

                return (
                    <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10">
                        {registrations.map((reg: any) => (
                            <View key={reg._id} className="flex-row items-center justify-between py-4 border-b border-white/10 last:border-0">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3">
                                        <Users size={20} color="#C9C9D1" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-satoshi-bold text-base">
                                            {typeof reg.userId === 'object' ? reg.userId.displayName || reg.userId.email : 'Unknown User'}
                                        </Text>
                                        <Text className="text-netsa-text-muted text-xs font-inter capitalize">
                                            {reg.status}
                                        </Text>
                                    </View>
                                </View>

                                {reg.status === 'registered' && (
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity
                                            onPress={() => handleUpdateStatus(reg._id, 'approved')}
                                            className="p-2 bg-green-500/20 rounded-full"
                                        >
                                            <Check size={16} color="#4ade80" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleUpdateStatus(reg._id, 'rejected')}
                                            className="p-2 bg-red-500/20 rounded-full"
                                        >
                                            <X size={16} color="#f87171" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                );

            case "Discussion":
                return (
                    <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10 min-h-[200px] justify-center items-center">
                        <Text className="text-netsa-text-muted font-inter">
                            Discussion view coming soon
                        </Text>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-netsa-bg relative">
            <AppScrollView className="flex-1 py-4">

                {/* 🔹 FULL WIDTH CONTEXT */}
                <View className="w-full">
                    {/* 🔹 CENTERED CONTENT (80%) */}
                    <View className="w-full max-w-[80%] mx-auto">
                        <View className="flex-row justify-between items-center mb-6">
                            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-white/10">
                                <ArrowLeft size={24} color="#FFFFFF" />
                            </TouchableOpacity>

                        </View>
                        <EventHero onSettingsPress={() => setShowSettings(true)} />
                        {/* ---------- HEADER ---------- */}


                        {/* ---------- CONTENT ---------- */}
                        <View className="px-6">


                            {/* TAGS */}
                            <View className="flex-row flex-wrap gap-2 mb-4">
                                {formData.tags?.map((tag, i) => (
                                    <View
                                        key={i}
                                        className="px-3 py-1 rounded-full bg-netsa-accent-purple/20 border border-netsa-accent-purple/30 flex-row items-center"
                                    >
                                        {isEditMode ? (
                                            <TextInput
                                                value={tag}
                                                onChangeText={(text) => {
                                                    const newTags = [...(formData.tags || [])];
                                                    newTags[i] = text;
                                                    setFormData({ ...formData, tags: newTags });
                                                }}
                                                className="text-xs font-satoshi-bold text-netsa-accent-purple min-w-[40px] p-0"
                                                placeholder="Tag"
                                                placeholderTextColor="#a78bfa"
                                            />
                                        ) : (
                                            <Text className="text-xs font-satoshi-bold text-netsa-accent-purple">
                                                {tag}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                                {isEditMode && (
                                    <TouchableOpacity
                                        onPress={() => setFormData({ ...formData, tags: [...(formData.tags || []), "New Tag"] })}
                                        className="px-3 py-1 rounded-full bg-white/10 border border-white/20 flex-row items-center"
                                    >
                                        <Plus size={12} color="#C9C9D1" />
                                        <Text className="text-xs font-medium text-netsa-text-muted ml-1">Add</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* TITLE + META + STATS */}
                            <View className="flex-col md:flex-row gap-6">

                                {/* LEFT */}
                                <View className="flex-1">
                                    <EditableField
                                        isEditing={isEditMode}
                                        value={formData.title}
                                        label="Event Title"
                                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                                        textStyle="text-3xl font-satoshi-black text-white mb-4"
                                        containerStyle="mb-2"
                                        multiline
                                    />

                                    <Text className="font-satoshi-bold text-netsa-text-primary mb-2">
                                        {event.organizerSnapshot?.name || "Organizer"}
                                    </Text>

                                    <View className="space-y-4 mt-1">
                                        <View className="flex-row items-start">
                                            <View className="mt-1 mr-2">
                                                <Calendar size={18} color="#9A9AA3" />
                                            </View>
                                            <View className="flex-1 flex-row gap-2">
                                                <View className="flex-1">
                                                    <EditableField
                                                        isEditing={isEditMode}
                                                        value={isEditMode ? String(formData.schedule?.startDate || "").split('T')[0] : (formData.schedule?.startDate ? new Date(formData.schedule.startDate).toLocaleDateString() : "")}
                                                        label={isEditMode ? "Date (YYYY-MM-DD)" : undefined}
                                                        placeholder="YYYY-MM-DD"
                                                        // Update nested schedule.startDate
                                                        onChangeText={(text) => {
                                                            setFormData({
                                                                ...formData,
                                                                schedule: {
                                                                    ...formData.schedule,
                                                                    startDate: text, // Assuming text is valid ISO or date string
                                                                    endDate: formData.schedule.endDate
                                                                }
                                                            })
                                                        }}
                                                        textStyle="text-netsa-text-secondary text-sm font-inter"
                                                        containerStyle="mb-0"
                                                    />
                                                </View>
                                                <View className="flex-1">
                                                    {/* Time field - keeping it simple for now, maybe map to time string if needed or remove */}
                                                    <EditableField
                                                        isEditing={isEditMode}
                                                        value={formData.time || ""}
                                                        label={isEditMode ? "Time" : undefined}
                                                        placeholder="Time"
                                                        onChangeText={(text) => setFormData({ ...formData, time: text })}
                                                        textStyle="text-netsa-text-secondary text-sm font-inter"
                                                        containerStyle="mb-0"
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center">
                                            <EditableField
                                                isEditing={isEditMode}
                                                value={formData.location?.city || ""}
                                                label={isEditMode ? "Location" : undefined}
                                                onChangeText={(text) => setFormData({
                                                    ...formData,
                                                    location: { ...formData.location, city: text }
                                                })}
                                                icon={<MapPin size={18} color="#9A9AA3" />}
                                                textStyle="ml-3 text-netsa-text-secondary text-sm font-inter"
                                                containerStyle="mb-0"
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* RIGHT — ORGANIZER CARD */}
                                <View className="flex flex-col items-start justify-evenly w-full md:w-56 bg-netsa-card rounded-2xl p-5 shadow-lg border border-white/10">
                                    <View className="w-full">
                                        <EditableField
                                            isEditing={isEditMode}
                                            value={String(formData.ticketPrice || 0)}
                                            label="Price"
                                            keyboardType="numeric"
                                            onChangeText={(text) => setFormData({ ...formData, ticketPrice: Number(text) })}
                                            textStyle="text-2xl font-satoshi-black text-netsa-accent-purple mb-2"
                                        >
                                            <Text className="text-2xl font-satoshi-black text-netsa-accent-purple mb-2">
                                                ₹{formData.ticketPrice?.toLocaleString()}/-
                                            </Text>
                                        </EditableField>

                                        <View className="flex-row items-center mb-2">
                                            <Users size={14} color="#9A9AA3" />
                                            <Text className="text-xs text-netsa-text-muted ml-1 font-inter">
                                                {registered}/{max} registered
                                            </Text>
                                        </View>

                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-[10px] text-netsa-text-muted font-inter">
                                                Spots remaining
                                            </Text>
                                            <Text className="text-[10px] text-netsa-text-muted font-inter">
                                                {spotsLeft}
                                            </Text>
                                        </View>

                                        {/* Gradient 2 Progress Bar */}
                                        <View className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                                            <View
                                                style={{ width: `${progress}%` }}
                                                className="h-full bg-gradient-to-r from-[#3D79FB] to-[#8B5CF6]"
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity className="bg-gradient-to-r from-[#3D79FB] to-[#8B5CF6] py-3 rounded-lg w-full active:opacity-90">
                                        <Text className="text-center text-white font-satoshi-bold text-xs">
                                            Review Applications
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* ---------- TABS ---------- */}
                            <Tabs
                                tabs={[
                                    { key: "About", title: "About" },
                                    { key: "Registrations", title: "Registrations" },
                                    { key: "Discussion", title: "Discussion" }
                                ]}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />

                            {/* ---------- TAB CONTENT ---------- */}
                            {renderTabContent()}

                            <View className="h-16" />
                        </View>
                    </View>
                </View>

                {/* ---------- SETTINGS MODAL ---------- */}
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
                    message="Are you sure you want to delete this event? This action cannot be undone."
                    confirmText="Delete"
                    isDestructive
                />
            </AppScrollView>

            {/* SAVE BAR - OUTSIDE SCROLLVIEW */}
            {isEditMode && (
                <View className="absolute bottom-0 left-0 right-0 bg-netsa-card border-t border-white/10 px-6 py-4 flex-row justify-between z-50 pb-8">
                    <Text className="text-sm text-netsa-text-secondary self-center font-inter">
                        You have unsaved changes
                    </Text>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={handleCancel}
                            className="px-4 py-2 bg-white/10 rounded-lg"
                        >
                            <Text className="font-satoshi-medium text-white">Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            className="px-6 py-2 bg-netsa-accent-purple rounded-lg shadow-sm"
                        >
                            <Text className="font-satoshi-bold text-white">Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};
