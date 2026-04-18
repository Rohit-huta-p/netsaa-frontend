import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Edit2, Plus, X, Search } from "lucide-react-native";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { EditableInput, SectionActions, Pill, SKILL_OPTIONS } from "./SharedSidebarComponents";
import { AITextInput } from "@/components/ui/AITextInput";
import useAuthStore from "@/stores/authStore";

interface BioAndSkillsSectionProps {
    isEditable: boolean;
    isOrganizer?: boolean;
    initialBio: string;
    initialSkills: string[];
    onSaveBio: (bio: string) => Promise<void>;
    onSaveSkills: (skills: string[]) => Promise<void>;
}

export const BioAndSkillsSection: React.FC<BioAndSkillsSectionProps> = ({
    isEditable,
    isOrganizer,
    initialBio,
    initialSkills,
    onSaveBio,
    onSaveSkills
}) => {
    const { role } = useAuthStore();
    const { activeEditSection, setEditSection, savingSection } = useProfileUiStore();

    // Bio State
    const [bio, setBio] = useState(initialBio || "");

    // Skills State
    const [skills, setSkills] = useState<string[]>(initialSkills || []);
    const [skillSearchQuery, setSkillSearchQuery] = useState("");
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);

    const isSkillsDirty = JSON.stringify(skills) !== JSON.stringify(initialSkills || []);
    const isBioDirty = bio !== (initialBio || "");
    const isDirty = isBioDirty || isSkillsDirty;

    const filteredSkills = SKILL_OPTIONS.filter(s =>
        s.toLowerCase().includes(skillSearchQuery.toLowerCase()) && !skills.includes(s)
    );
    const exactMatch = SKILL_OPTIONS.find(s => s.toLowerCase() === skillSearchQuery.toLowerCase());

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
        setSkillSearchQuery("");
        setShowSkillDropdown(false);
    };

    const removeSkill = (skill: string) => {
        setSkills(prev => prev.filter(s => s !== skill));
    };

    const handleCancel = () => {
        setBio(initialBio || "");
        setSkills(initialSkills || []);
        setShowSkillDropdown(false);
        setSkillSearchQuery("");
        setEditSection(null);
    };

    const handleSave = async () => {
        if (isBioDirty) await onSaveBio(bio);
        if (isSkillsDirty) await onSaveSkills(skills);
        setEditSection(null);
    };

    const isEditing = activeEditSection === 'about';

    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative">
            <View className="flex-row items-center justify-between mb-6">
                <Text className={`text-xs font-black uppercase tracking-[0.3em] text-white`}>
                    Profile Info
                </Text>
                {isEditable && (
                    <TouchableOpacity
                        onPress={() => isEditing ? setEditSection(null) : setEditSection('about')}
                        className={`p-2 rounded-full border ${isEditing ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/5 border-transparent'}`}
                    >
                        <Edit2 size={12} color={isEditing ? "#ea698b" : "#71717a"} />
                    </TouchableOpacity>
                )}
            </View>

            {isEditing && isEditable ? (
                <View>
                    <View className="mb-6">
                        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                            {role === 'organizer' ? 'About' : 'Bio'}
                        </Text>
                        <AITextInput
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell your story..."
                            multiline
                            style={{ minHeight: 120 }}
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Core Skills</Text>
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {skills.length > 0 ? skills.map((skill, i) => (
                                <Pill
                                    key={i}
                                    label={skill}
                                    isSelected={true}
                                    onRemove={() => removeSkill(skill)}
                                />
                            )) : null}
                            <TouchableOpacity
                                onPress={() => setShowSkillDropdown(!showSkillDropdown)}
                                className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg flex-row items-center justify-center"
                            >
                                <Plus size={16} color="#a1a1aa" />
                            </TouchableOpacity>
                        </View>

                        {showSkillDropdown && (
                            <View className="mb-4">
                                <View className="flex-row items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                    <Search size={14} color="#71717a" />
                                    <TextInput
                                        value={skillSearchQuery}
                                        onChangeText={setSkillSearchQuery}
                                        placeholder="Search or add skill..."
                                        placeholderTextColor="#52525b"
                                        className="flex-1 text-white text-sm ml-2 h-4 outline-none"
                                        autoFocus
                                    />
                                    {skillSearchQuery.length > 0 && (
                                        <TouchableOpacity onPress={() => setSkillSearchQuery("")}>
                                            <X size={14} color="#71717a" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <ScrollView className="mt-2 bg-zinc-800 rounded-lg max-h-40 border border-white/10">
                                    {(skillSearchQuery.length > 0 && !exactMatch) && (
                                        <TouchableOpacity
                                            onPress={() => toggleSkill(skillSearchQuery.trim())}
                                            className="px-4 py-3 border-b border-white/5 flex-row items-center gap-2"
                                        >
                                            <Plus size={14} color="#ea698b" />
                                            <Text className="text-pink-500 text-xs font-bold uppercase">Add "{skillSearchQuery}"</Text>
                                        </TouchableOpacity>
                                    )}
                                    {filteredSkills.map(skill => (
                                        <TouchableOpacity
                                            key={skill}
                                            onPress={() => toggleSkill(skill)}
                                            className="px-4 py-3 border-b border-white/5"
                                        >
                                            <Text className="text-zinc-300 text-[10px] font-bold uppercase">{skill}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <SectionActions
                        isDirty={isDirty}
                        isSaving={savingSection === 'about' || savingSection === 'identity'}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </View>
            ) : (
                <View>
                    <View className="mb-8">
                        <Text className="text-zinc-400 leading-6 font-medium italic pl-4 border-l-2 border-zinc-800">
                            "{initialBio || "No manifesto available."}"
                        </Text>
                    </View>

                    <View className="h-[1px] bg-zinc-800/50 mb-8" />

                    <View className="flex-row flex-wrap gap-2">
                        {(initialSkills && initialSkills.length > 0) ? initialSkills.map((skill, i) => (
                            <Pill key={i} label={skill} />
                        )) : (
                            <Text className="text-zinc-700 text-[10px] uppercase font-bold">No skills listed</Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};
