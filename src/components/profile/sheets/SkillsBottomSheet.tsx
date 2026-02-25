// src/components/profile/sheets/SkillsBottomSheet.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { useAuthStore } from "@/stores/authStore";
import authService from "@/services/authService";

interface SkillsBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    currentArtistType: string;
    currentSkills: string[];
}

const ARTIST_TYPES = ["Actor", "Dancer", "Singer", "Model", "DJ", "Musician"];
const SKILL_OPTIONS = [
    "Contemporary", "Kathak", "Hip Hop", "Jazz", "Classical",
    "Folk", "Ballet", "Salsa", "Storytelling", "Choreography",
    "Beatboxing", "Freestyle", "Improv", "Voice Acting", "Emceeing",
];

const Pill = ({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="mr-2 mb-2">
        <View
            style={{
                backgroundColor: isSelected ? 'rgba(234, 105, 139, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isSelected ? '#ea698b' : 'rgba(255, 255, 255, 0.1)',
            }}
        >
            <Text style={{
                color: isSelected ? '#ea698b' : '#a1a1aa',
                fontWeight: '700',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
            }}>
                {label}
            </Text>
        </View>
    </TouchableOpacity>
);

export const SkillsBottomSheet: React.FC<SkillsBottomSheetProps> = ({
    visible,
    onClose,
    currentArtistType,
    currentSkills,
}) => {
    const [artistType, setArtistType] = useState(currentArtistType);
    const [skills, setSkills] = useState<string[]>(currentSkills);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setSaving, setSectionError, clearSectionDraft } = useProfileUiStore();

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaving('identity');
        setError(null);
        try {
            const payload = { artistType, skills };
            const updatedUser = await authService.updateProfile(payload);
            const user = useAuthStore.getState().user;
            if (user) {
                useAuthStore.getState().setAuth({
                    user: { ...user, ...updatedUser },
                    accessToken: useAuthStore.getState().accessToken || '',
                });
            }
            clearSectionDraft('identity');
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to save skills';
            setError(msg);
            setSectionError('identity', msg);
        } finally {
            setIsSaving(false);
            setSaving(null);
        }
    };

    const handleCancel = () => {
        setArtistType(currentArtistType);
        setSkills(currentSkills);
        setError(null);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-black">
                <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
                    {/* Header */}
                    <View className="px-6 py-5 border-b border-white/10 flex-row items-center justify-between">
                        <View>
                            <Text className="text-white font-black text-xl uppercase italic tracking-tight">Identity & Skills</Text>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                Claim your discipline
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleCancel} className="p-2">
                            <X size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 120 }}>
                        {/* Artist Type */}
                        <View className="mb-8">
                            <Text className="text-zinc-500 mb-4 font-bold uppercase tracking-widest text-[10px]">Primary Role</Text>
                            <View className="flex-row flex-wrap">
                                {ARTIST_TYPES.map(type => (
                                    <Pill
                                        key={type}
                                        label={type}
                                        isSelected={artistType === type}
                                        onPress={() => setArtistType(type)}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Skills */}
                        <View>
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Skills</Text>
                                <Text className="text-zinc-600 text-[10px]">{skills.length} selected</Text>
                            </View>
                            <View className="flex-row flex-wrap">
                                {SKILL_OPTIONS.map(skill => (
                                    <Pill
                                        key={skill}
                                        label={skill}
                                        isSelected={skills.includes(skill)}
                                        onPress={() => toggleSkill(skill)}
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Error */}
                    {error && (
                        <View className="mx-6 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <Text className="text-red-400 text-xs font-bold">{error}</Text>
                        </View>
                    )}

                    {/* Footer */}
                    <View className="px-6 py-5 border-t border-white/10 bg-black flex-row gap-3">
                        <TouchableOpacity
                            onPress={handleCancel}
                            className="flex-1 py-4 border border-white/10 rounded-xl items-center justify-center"
                        >
                            <Text className="text-white font-bold uppercase tracking-widest text-xs">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-4 bg-white rounded-xl items-center justify-center"
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Text className="text-black font-black uppercase tracking-tighter text-sm italic">Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default SkillsBottomSheet;
