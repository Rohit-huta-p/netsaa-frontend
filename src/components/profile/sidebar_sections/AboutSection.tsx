import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Edit2 } from "lucide-react-native";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { EditableInput, SectionActions } from "./SharedSidebarComponents";
import useAuthStore from "@/stores/authStore";

interface AboutSectionProps {
    isEditable: boolean;
    initialBio: string;
    onSave: (bio: string) => Promise<void>;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isEditable, initialBio, onSave }) => {
    const { role } = useAuthStore();
    console.log("role: ", role)
    const { activeEditSection, setEditSection } = useProfileUiStore();
    const [bio, setBio] = useState(initialBio || "");

    const handleCancel = () => {
        setBio(initialBio || "");
        setEditSection(null);
    };

    const handleSave = async () => {
        await onSave(bio);
    };

    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative">
            <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">
                {role === 'creative_lead' ? 'About' : 'Bio'}
            </Text>
            {isEditable && (
                <TouchableOpacity
                    onPress={() => activeEditSection === 'about' ? setEditSection(null) : setEditSection('about')}
                    className={`absolute top-4 right-4 p-2 rounded-full border ${activeEditSection === 'about' ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/5 border-transparent'}`}
                >
                    <Edit2 size={12} color={activeEditSection === 'about' ? "#ea698b" : "#71717a"} />
                </TouchableOpacity>
            )}
            {activeEditSection === 'about' && isEditable ? (
                <>
                    <EditableInput
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell your story..."
                        multiline
                    />
                    <SectionActions
                        isDirty={bio !== (initialBio || "")}
                        isSaving={false}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </>
            ) : (
                <Text className="text-zinc-400 leading-6 font-medium italic pl-6 border-l-2 border-zinc-800">
                    "{initialBio || "No manifesto available."}"
                </Text>
            )}
        </View>
    );
};
