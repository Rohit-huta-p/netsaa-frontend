// src/components/profile/ProfileSidebar.tsx
import React from "react";
import { View } from "react-native";
import { ProfileSidebarProps } from "./types";
import { useAuthStore } from "@/stores/authStore";
import { useProfileUiStore } from "@/stores/profileUiStore";
import authService from "@/services/authService";
import { PhysicalSpecsSection } from "./sidebar_sections/PhysicalSpecsSection";
import { BioAndSkillsSection } from "./sidebar_sections/BioAndSkillsSection";
import { SocialsSection } from "./sidebar_sections/SocialsSection";

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    profileData,
    isDesktop,
    isEditable = false,
    isOrganizer = false,
}) => {
    const { user, setAuth, accessToken } = useAuthStore();
    const { setSaving, setSectionError, setEditSection } = useProfileUiStore();

    const handleSave = async (section: 'about' | 'basic' | 'identity' | 'socials', payload: any) => {
        setSaving(section);
        try {
            const updatedUser = await authService.updateProfile(payload);
            if (user) {
                setAuth({ user: { ...user, ...updatedUser }, accessToken: accessToken || '' });
                setEditSection(null);
            }
        } catch (err: any) {
            setSectionError(section, err?.message || 'Failed to save');
        } finally {
            setSaving(null);
        }
    };

    return (
        <View className={`${isDesktop ? 'w-[300px]' : 'w-full'} space-y-12`}>
            <BioAndSkillsSection
                isEditable={isEditable}
                isOrganizer={isOrganizer}
                initialBio={profileData.bio || ""}
                initialSkills={profileData.skills || []}
                onSaveBio={(bio) => handleSave('about', { bio })}
                onSaveSkills={(skills) => handleSave('identity', { skills })}
            />

            <PhysicalSpecsSection
                isEditable={isEditable}
                isOrganizer={isOrganizer}
                initialAge={profileData.age || ""}
                initialHeight={profileData.height || ""}
                initialSkinTone={profileData.skinTone || ""}
                initialSkinToneHex={profileData.skinToneHex || ""}
                onSave={(data) => handleSave('basic', data)}
            />
            <SocialsSection
                isEditable={isEditable}
                isOrganizer={isOrganizer}
                initialSocials={{
                    instagramHandle: profileData.instagramHandle || "",
                    youtubeUrl: profileData.youtubeUrl || "",
                    spotifyUrl: profileData.spotifyUrl || "",
                    soundcloudUrl: profileData.soundcloudUrl || "",
                }}
                onSave={(socials) => handleSave('socials', socials)}
            />
        </View>
    );
};

export default ProfileSidebar;

