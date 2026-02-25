// app/(app)/profile/index.tsx
import React, { useState } from "react";
import {
    View,
    ScrollView,
    useWindowDimensions,
    StatusBar,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/authStore";
import { useProfileUiStore } from "@/stores/profileUiStore";
import authService from "@/services/authService";

import {
    ProfileHeader,
    ProfileSidebar,
    FeaturedWorks,
    ProfessionalHistory,
    Testimonials,
    ProfileFooter,
    UnsavedChangesBar,
    ProfileData,
    ProfileStats,
} from "@/components/profile";

import ProfileWizard from "@/components/profile/ProfileWizard";
import { ShareBottomSheet } from "@/components/common/ShareBottomSheet";
import ExperienceBottomSheet from "@/components/profile/sheets/ExperienceBottomSheet";
import SkillsBottomSheet from "@/components/profile/sheets/SkillsBottomSheet";
import MediaPickerBottomSheet from "@/components/profile/sheets/MediaPickerBottomSheet";

import { useMobileTabBarHeight } from "@/components/MobileTabBar";

type ProfileFormData = ProfileData & {
    galleryUrls: string[];
    videoUrls: string[];
};

export default function ProfilePage() {
    const { user } = useAuthStore();
    const { activeSheet, closeSheet } = useProfileUiStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [wizardVisible, setWizardVisible] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [shareSheetVisible, setShareSheetVisible] = useState(false);
    const tabBarHeight = useMobileTabBarHeight();

    const profileData: ProfileFormData = {
        fullName: user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
        location: (user as any)?.location || "",
        age: (user as any)?.age || "",
        gender: (user as any)?.gender || "",
        height: (user as any)?.height || "",
        skinTone: (user as any)?.skinTone || "",
        artistType: (user as any)?.artistType || "",
        skills: (user as any)?.skills || [],
        bio: (user as any)?.bio || "",
        instagramHandle: (user as any)?.instagramHandle || "",
        youtubeUrl: (user as any)?.youtubeUrl || "",
        spotifyUrl: (user as any)?.spotifyUrl || "",
        soundcloudUrl: (user as any)?.soundcloudUrl || "",
        experience: (user as any)?.experience || [],
        hasPhotos: (user as any)?.hasPhotos || false,
        profileImageUrl: user?.profileImageUrl || "",
        galleryUrls: [...((user as any)?.galleryUrls || []), '', '', '', '', ''].slice(0, 5),
        videoUrls: [...((user as any)?.videoUrls || []), '', '', ''].slice(0, 3)
    };

    const stats: ProfileStats = {
        connections: 0,
        events: 0,
        rating: 0
    };

    const userId = (user as any)?._id || (user as any)?.id || '';

    // NOTE: Wizard is preserved for onboarding, but regular editing uses inline mode
    const openWizard = (step: number = 0) => {
        setWizardStep(step);
        setWizardVisible(true);
    };

    // Keep this logic for the onboarding wizard flow
    const handleSaveProfile = async (data: ProfileFormData) => {
        try {
            const updatePayload = {
                displayName: data.fullName,
                location: data.location,
                age: data.age,
                gender: data.gender,
                height: data.height,
                skinTone: data.skinTone,
                artistType: data.artistType,
                skills: data.skills,
                bio: data.bio,
                instagramHandle: data.instagramHandle,
                youtubeUrl: data.youtubeUrl,
                spotifyUrl: data.spotifyUrl,
                soundcloudUrl: data.soundcloudUrl,
                experience: data.experience,
                hasPhotos: data.hasPhotos,
                profileImageUrl: data.profileImageUrl,
                galleryUrls: data.galleryUrls.filter(url => url),
                videoUrls: data.videoUrls.filter(url => url)
            };
            console.log('[Profile] Saving with payload:', JSON.stringify(updatePayload, null, 2));
            const updatedUser = await authService.updateProfile(updatePayload);
            if (user) {
                const mergedUser = { ...user, ...updatedUser };
                useAuthStore.getState().setAuth({
                    user: mergedUser,
                    accessToken: useAuthStore.getState().accessToken || ''
                });
            }
            setWizardVisible(false);
        } catch (error) {
            console.error("Failed to save profile", error);
            Alert.alert("Error", "Failed to save profile.");
        }
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>

                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        paddingBottom: tabBarHeight > 0 ? tabBarHeight + 60 : 120,
                        width: '100%',
                        maxWidth: 1300,
                        alignSelf: 'center'
                    }}
                >
                    {/* Header Section */}
                    <ProfileHeader
                        fullName={profileData.fullName}
                        artistType={profileData.artistType}
                        location={profileData.location}
                        profileImageUrl={profileData.profileImageUrl}
                        stats={stats}
                        isDesktop={isDesktop}
                        isEditable={true}
                        onSharePress={() => setShareSheetVisible(true)}
                    />

                    {/* Main Layout Grid */}
                    <View className="px-6">
                        <View className={`flex-col ${isDesktop ? 'md:flex-row' : ''} gap-16`}>

                            {/* SIDEBAR */}
                            <ProfileSidebar
                                profileData={profileData}
                                isDesktop={isDesktop}
                                isEditable={true}
                            />

                            {/* MAIN CONTENT */}
                            <View className="flex-1 space-y-20">
                                {/* Featured Works */}
                                <FeaturedWorks
                                    galleryUrls={profileData.galleryUrls || []}
                                    videoUrls={profileData.videoUrls || []}
                                    hasPhotos={profileData.hasPhotos}
                                    isDesktop={isDesktop}
                                    isEditable={true}
                                />

                                {/* Professional History */}
                                <ProfessionalHistory
                                    experience={profileData.experience}
                                    isEditable={true}
                                />

                                {/* Testimonials */}
                                <Testimonials />
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer */}
                <ProfileFooter />

                {/* Unsaved Changes Bar */}
                <UnsavedChangesBar />

                {/* BOTTOM SHEETS */}
                <ExperienceBottomSheet
                    key={`exp-${activeSheet}`}
                    visible={activeSheet === 'experience'}
                    onClose={closeSheet}
                    experience={profileData.experience}
                />

                <SkillsBottomSheet
                    key={`skills-${activeSheet}`}
                    visible={activeSheet === 'identity'}
                    onClose={closeSheet}
                    currentArtistType={profileData.artistType}
                    currentSkills={profileData.skills}
                />

                <MediaPickerBottomSheet
                    key={`media-${activeSheet}`}
                    visible={activeSheet === 'media'}
                    onClose={closeSheet}
                    profileImageUrl={profileData.profileImageUrl || ''}
                    galleryUrls={profileData.galleryUrls}
                    videoUrls={profileData.videoUrls}
                    userId={userId}
                />


                {/* WIZARD MODAL (Onboarding only) */}
                {wizardVisible && (
                    <ProfileWizard
                        initialData={profileData}
                        initialStep={wizardStep}
                        userId={userId}
                        onClose={() => setWizardVisible(false)}
                        onSave={handleSaveProfile}
                    />
                )}

                {/* Share Bottom Sheet */}
                <ShareBottomSheet
                    visible={shareSheetVisible}
                    onClose={() => setShareSheetVisible(false)}
                    type="profile"
                    data={user}
                />
            </SafeAreaView>
        </View>
    );
}