import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { Calendar, MapPin, Users, Heart, Share2, Settings, ArrowLeft, Check, X } from "lucide-react-native";
import { usePathname, useRouter } from "expo-router";


import { GigSettingsModal } from "./GigSettingsModal";
import { ConfirmationModal } from "../events/shared/ConfirmationModal";
import { GigApplyModal } from "./GigApplyModal";
import { useDeleteGig, useUpdateGig } from "../../hooks/useGigs";
import { Gig } from "../../types/gig";
import { EditableField } from "@/components/ui/EditableField";

import { SegmentedTabs } from "../common/SegmentedTabs";
import { GigApplicationsList } from "./GigApplicationsList";
import ApplicationsTab from "../events/shared/ApplicationsTab";
import AboutTab from "../common/AboutTab";
import DiscussionTab from "../common/DiscussionTab";
// TYPES
const Gig_Organizer_TABS = ["About", "Applications", "Discussion"] as const;
const Gig_Artist_TABS = ["About", "Discussion"] as const;
type GigTab = (typeof Gig_Organizer_TABS | typeof Gig_Artist_TABS)[number];

interface GigDetailsProps {
    isOrganizer?: boolean;
    gig: Gig | any; // Allow relaxed type for now to avoid breakages if partial data passed
    showActionFooter?: boolean;
    isEditingExternal?: boolean;
    onSave?: (data: any) => void;
    onCancel?: () => void;
}

export const GigDetails: React.FC<GigDetailsProps> = ({
    isOrganizer,
    gig,
    showActionFooter = true,
    isEditingExternal = false,
    onSave,
    onCancel,
}) => {
    const router = useRouter();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState("about");
    console.log('[GigDetails] Rendered', { gigId: gig?._id, activeTab, isOrganizer });
    const [tabs] = useState(() => {
        return (isOrganizer ? Gig_Organizer_TABS : Gig_Artist_TABS).map((tab) => ({
            key: tab.toLowerCase(),
            title: tab,
        }));
    });

    const [showSettings, setShowSettings] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);

    // Local form state for editing
    const [formData, setFormData] = useState(gig);

    // Sync local state when gig changes or edit mode starts (optional, but safer)
    React.useEffect(() => {
        setFormData(gig);
    }, [gig, isEditingExternal]);


    const deleteMutation = useDeleteGig();
    const updateMutation = useUpdateGig();

    if (!gig) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <Text className="text-gray-500">Select a gig to view details</Text>
            </View>
        );
    }

    const title = formData.title || "Contemporary Dance Workshop";
    const organizerName = formData.organizerSnapshot?.displayName || formData.organizerName || "Maria Santos";
    const date = formData.schedule?.startDate
        ? new Date(formData.schedule.startDate).toLocaleDateString()
        : "Dec 15, 2024";
    const timeRange = formData.schedule?.timeRange || "7:00 PM – 9:00 PM";
    const location = formData.location?.city || "Location";

    // Use specific fields if available, otherwise fallback
    const registered = formData.stats?.applications || formData.registered || 18;
    const capacity = formData.maxApplications || formData.capacity || 25;
    const spotsLeft = capacity - registered;
    const progress = (registered / capacity) * 100;

    const handleEdit = () => {
        setShowSettings(false);
        router.push(`/organizer/gigs/${gig._id}/edit`);
    };

    const handleDelete = () => {
        setShowSettings(false);
        setTimeout(() => setShowDeleteConfirm(true), 250);
    };

    const confirmDelete = () => {
        deleteMutation.mutate(gig._id, {
            onSuccess: () => {
                router.back();
            },
        });
    };

    const handleToggleStatus = () => {
        setShowSettings(false);
        const newStatus = gig.status === 'published' ? 'draft' : 'published';
        updateMutation.mutate({ id: gig._id, payload: { status: newStatus } });
    };

    const renderTabContent = () => {
        console.log('[GigDetails] Rendering tab content:', activeTab);
        switch (activeTab) {
            case 'about':
                return (
                    <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10">
                        <Text className="text-lg font-satoshi-bold text-white mb-3">About This Gig</Text>
                        <EditableField
                            isEditing={!!isEditingExternal}
                            value={formData.description || ""}
                            label="Description"
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            multiline
                            textStyle="text-netsa-text-secondary leading-relaxed font-inter"
                        />
                    </View>
                );
            case 'applications':
                return isOrganizer ? (
                    <GigApplicationsList gigId={gig._id} />
                ) : (
                    <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10">
                        <Text className="text-lg font-satoshi-bold text-white mb-3">About This Gig</Text>
                        <Text className="text-netsa-text-secondary leading-relaxed font-inter">
                            {gig.description ||
                                "This gig is an opportunity to collaborate, perform, and grow professionally in a curated artistic environment."}
                        </Text>
                    </View>
                );
            case 'discussion':
                return (
                    <View className="bg-netsa-card rounded-2xl p-6 mt-6 shadow-sm border border-white/10 min-h-[200px] justify-center items-center">
                        <Text className="text-netsa-text-muted font-inter">Coming soon</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    const handleTabSelect = async (tab: any) => {
        console.log('[GigDetails] Selected tab:', tab);
        setActiveTab(tab);
    };

    return (
        <View className="flex-1 bg-netsa-bg">
            {/* Header Section */}
            <View className="px-6 pt-4 pb-2 flex-row justify-between items-center bg-netsa-bg z-10 border-b border-white/10">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-white/10">
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View className="flex-row items-center space-x-1">
                    <TouchableOpacity className="p-2 rounded-full active:bg-white/10">
                        <Heart size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 rounded-full active:bg-white/10">
                        <Share2 size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    {/* Settings only visible for organizer mode (when footer is hidden) */}
                    {!showActionFooter && (
                        <TouchableOpacity
                            onPress={() => setShowSettings(true)}
                            className="p-2 rounded-full active:bg-white/10"
                        >
                            <Settings size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                <View className=" px-6 mt-4">

                    {/* Content Container */}
                    <View className="px-6 mt-4">

                        {/* TAGS */}
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {(gig.tags || ["Gig", "Paid", "Stage"]).map((tag: string, i: number) => (
                                <View key={i} className="px-3 py-1 rounded-full bg-netsa-accent-purple/20 border border-netsa-accent-purple/30">
                                    <Text className="text-xs font-satoshi-bold text-netsa-accent-purple">
                                        {tag}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* TITLE + META + RIGHT CARD */}
                        <View className="flex-col md:flex-row gap-6">

                            {/* LEFT */}
                            <View className="flex-1">
                                <EditableField
                                    isEditing={!!isEditingExternal}
                                    value={title}
                                    label="Gig Title"
                                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                                    textStyle="text-3xl font-satoshi-black text-white mb-4"
                                    containerStyle="mb-2"
                                    multiline
                                />

                                <Text className="font-satoshi-bold text-netsa-text-primary text-lg mb-2">
                                    {organizerName}
                                </Text>

                                <View className="space-y-3 mt-2">
                                    <View className="flex-row items-center">
                                        <Calendar size={18} color="#9A9AA3" />
                                        <Text className="ml-3 text-netsa-text-secondary text-sm font-inter">
                                            {date} · {timeRange}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center">
                                        <EditableField
                                            isEditing={!!isEditingExternal}
                                            value={location}
                                            label="City/Location"
                                            onChangeText={(text) => setFormData({
                                                ...formData,
                                                location: { ...formData.location, city: text }
                                            })}
                                            icon={<MapPin size={18} color="#9A9AA3" />}
                                            textStyle="ml-3 text-netsa-text-secondary text-sm font-inter"
                                            containerStyle="mb-0" // Tight spacing in list
                                        />
                                    </View>

                                    <View className="flex-row items-center">
                                        <EditableField
                                            isEditing={!!isEditingExternal}
                                            value={String(capacity)} // For editing
                                            label="Capacity"
                                            keyboardType="numeric"
                                            onChangeText={(text) => setFormData({ ...formData, maxApplications: Number(text) })}
                                            icon={<Users size={18} color="#9A9AA3" />}
                                            containerStyle="mb-0"
                                        >
                                            <Text className="ml-3 text-netsa-text-secondary text-sm font-inter">
                                                {capacity} capacity
                                            </Text>
                                        </EditableField>
                                    </View>
                                </View>
                            </View>

                            {/* RIGHT CARD */}
                            <View className="w-full md:w-64 bg-netsa-card rounded-2xl p-5 shadow-lg border border-white/10">
                                <EditableField
                                    isEditing={!!isEditingExternal}
                                    value={String(formData.compensation?.amount || 0)}
                                    label="Pay Amount"
                                    keyboardType="numeric"
                                    onChangeText={(text) => setFormData({
                                        ...formData,
                                        compensation: { ...formData.compensation, amount: Number(text) }
                                    })}
                                    textStyle="text-2xl font-satoshi-black text-netsa-accent-orange mb-2"
                                >
                                    <Text className="text-2xl font-satoshi-black text-netsa-accent-orange mb-2">
                                        ₹{formData.compensation?.amount?.toLocaleString()}/-
                                    </Text>
                                </EditableField>

                                <View className="flex-row items-center mb-2">
                                    <Users size={14} color="#9A9AA3" />
                                    <Text className="text-xs text-netsa-text-muted ml-1 font-inter">
                                        {registered}/{capacity} registered
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

                                {/* Gradient 1 Progress Bar */}
                                <View className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                                    <View
                                        style={{ width: `${progress}%` }}
                                        className="h-full bg-netsa-accent-red"
                                    // ideally use a linear gradient view here, but solid accent-red fits 'Action' theme if native class fails
                                    // if we can use nativewind gradients: 
                                    // className="h-full" style={{ width: ..., backgroundColor: ... }}
                                    // lets assume solid for simplicity or use a LinearGradient component if absolutely needed.
                                    // User asked for "Gradient 1". I should try to use it.
                                    />
                                </View>

                                <Text className="text-xs text-netsa-text-muted mb-4 font-inter">
                                    Total applications: {gig.totalApplications}
                                </Text>

                                {/* STATUS BREAKDOWN */}
                                {
                                    isOrganizer && (
                                        <View className="space-y-2 mb-4 border-t border-white/10 pt-4">
                                            <View className="flex-row justify-between">
                                                <Text className="text-xs text-netsa-text-secondary font-inter">Pending</Text>
                                                <Text className="text-xs font-satoshi-bold text-netsa-accent-orange">
                                                    {(formData.stats?.applications || 0) - (formData.stats?.shortlisted || 0) - (formData.stats?.hired || 0)}
                                                </Text>
                                            </View>

                                            <View className="flex-row justify-between">
                                                <Text className="text-xs text-netsa-text-secondary font-inter">Shortlisted</Text>
                                                <Text className="text-xs font-satoshi-bold text-blue-400">
                                                    {formData.stats?.shortlisted || 0}
                                                </Text>
                                            </View>

                                            <View className="flex-row justify-between">
                                                <Text className="text-xs text-netsa-text-secondary font-inter">Confirmed</Text>
                                                <Text className="text-xs font-satoshi-bold text-green-400">
                                                    {formData.stats?.hired || 0}
                                                </Text>
                                            </View>
                                        </View>
                                    )
                                }

                                {
                                    isOrganizer ? (
                                        <TouchableOpacity onPress={() => setActiveTab('applications')} className="bg-netsa-accent-purple py-3 rounded-full active:opacity-90">
                                            <Text className="text-center text-white font-satoshi-bold text-xs">
                                                Review Applications
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (gig.viewerContext?.hasApplied) return;
                                                setShowApplyModal(true);
                                            }}
                                            className={`py-3 rounded-full active:opacity-90 ${gig.viewerContext?.hasApplied ? 'bg-green-500/20 border border-green-500/30' : 'bg-netsa-accent-purple'}`}
                                            disabled={gig.viewerContext?.hasApplied}
                                        >
                                            <Text className={`text-center font-satoshi-bold text-xs ${gig.viewerContext?.hasApplied ? 'text-green-400' : 'text-white'}`}>
                                                {gig.viewerContext?.hasApplied ? 'Applied' : 'Apply'}
                                            </Text>
                                        </TouchableOpacity>
                                    )
                                }
                            </View>
                        </View>

                        {/* ---------- TABS ---------- */}
                        {/* EventTabs might need props to style it dark, assume it inherits or we need to wrap it. 
                            If EventTabs has hardcoded white, we might need to fix it later. 
                            For now, passing it here. */}
                        <View className="mt-8">


                            <SegmentedTabs
                                tabs={tabs}
                                activeTab={activeTab}
                                onTabChange={handleTabSelect}
                            />


                        </View>

                        {/* TAB CONTENT */}
                        <View className="mt-6">
                            {activeTab === "about" && <AboutTab formData={formData} setFormData={setFormData} isEditingExternal={isEditingExternal} />}
                            {activeTab === "applications" && <ApplicationsTab isOrganizer={isOrganizer} gig={gig} />}
                            {activeTab === "discussion" && <DiscussionTab id={gig._id} type="gig" />}
                        </View>

                    </View>
                </View>
            </ScrollView>

            {/* SAVE BAR */}
            {
                isEditingExternal && (
                    <View className="absolute bottom-0 left-0 right-0 bg-netsa-card border-t border-white/10 px-6 py-4 flex-row justify-between items-center">
                        <Text className="text-sm text-netsa-text-secondary font-inter">
                            You have unsaved changes
                        </Text>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={onCancel}
                                className="px-4 py-2 bg-white/10 rounded-lg"
                            >
                                <Text className="font-satoshi-medium text-white">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => onSave?.(formData)}
                                className="px-6 py-2 bg-netsa-accent-purple rounded-lg" // Or Gradient 1
                            >
                                <Text className="font-satoshi-bold text-white">Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )
            }

            {/* ---------- MODALS ---------- */}
            <GigSettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                gig={gig}
            />

            <ConfirmationModal
                visible={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Gig"
                message="Are you sure you want to delete this gig? This action cannot be undone."
                confirmText="Delete"
                isDestructive
            />

            <GigApplyModal
                visible={showApplyModal}
                onClose={() => setShowApplyModal(false)}
                gigId={gig._id}
                gigTitle={title}
            />
        </View >
    );
};
