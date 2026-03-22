import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Plus, X, Search, Edit2 } from "lucide-react-native";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { Pill, SectionActions, SKILL_OPTIONS } from "./SharedSidebarComponents";

interface CoreSkillsSectionProps {
    isEditable: boolean;
    initialSkills: string[];
    onSave: (skills: string[]) => Promise<void>;
}

export const CoreSkillsSection: React.FC<CoreSkillsSectionProps> = ({ isEditable, initialSkills, onSave }) => {
    const { activeEditSection, setEditSection } = useProfileUiStore();
    const [skills, setSkills] = useState<string[]>(initialSkills || []);
    const [skillSearchQuery, setSkillSearchQuery] = useState("");
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);

    const isDirty = JSON.stringify(skills) !== JSON.stringify(initialSkills || []);

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
        setSkills(initialSkills || []);
        setShowSkillDropdown(false);
        setSkillSearchQuery("");
        setEditSection(null);
    };

    const handleSave = async () => {
        await onSave(skills);
    };

    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative">
            <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Core Skills</Text>

            {activeEditSection === 'identity' && isEditable ? (
                <View>
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
                                    className="flex-1 text-white text-sm ml-2 h-8"
                                    autoFocus
                                />
                                {skillSearchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSkillSearchQuery("")}>
                                        <X size={14} color="#71717a" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View className="mt-2 bg-zinc-800 rounded-lg max-h-40 overflow-hidden border border-white/10">
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
                                        <Text className="text-zinc-300 text-xs font-bold uppercase">{skill}</Text>
                                    </TouchableOpacity>
                                ))}
                                {filteredSkills.length === 0 && skillSearchQuery.length === 0 && (
                                    <View className="px-4 py-3">
                                        <Text className="text-zinc-500 text-xs font-medium italic">Type to search existing skills</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                    <SectionActions
                        isDirty={isDirty}
                        isSaving={false}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </View>
            ) : (
                <View className="flex-row flex-wrap gap-2">
                    {(initialSkills && initialSkills.length > 0) ? initialSkills.map((skill, i) => (
                        <Pill key={i} label={skill} />
                    )) : (
                        <Text className="text-zinc-700 text-[10px] uppercase font-bold">No skills listed</Text>
                    )}
                </View>
            )}

            {isEditable && (
                <TouchableOpacity
                    onPress={() => activeEditSection === 'identity' ? setEditSection(null) : setEditSection('identity')}
                    className={`absolute top-4 right-4 p-2 rounded-full border ${activeEditSection === 'identity' ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/5 border-transparent'}`}
                >
                    <Edit2 size={12} color={activeEditSection === 'identity' ? "#ea698b" : "#71717a"} />
                </TouchableOpacity>
            )}
        </View>
    );
};
