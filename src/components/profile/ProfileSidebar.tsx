// src/components/profile/ProfileSidebar.tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Linking,
    TextInput,
    ActivityIndicator,
} from "react-native";
import {
    Calendar,
    Ruler,
    User,
    Instagram,
    Youtube,
    Music2,
    Headphones,
    Plus,
    X,
    Search,
    Edit2,
    Check,
} from "lucide-react-native";
import { ProfileSidebarProps } from "./types";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { useAuthStore } from "@/stores/authStore";
import authService from "@/services/authService";

const SKILL_OPTIONS = [
    "Contemporary", "Kathak", "Hip Hop", "Jazz", "Classical",
    "Folk", "Ballet", "Salsa", "Storytelling", "Choreography",
    "Beatboxing", "Freestyle", "Improv", "Voice Acting", "Emceeing",
];

const DEFINED_SKIN_TONES = [
    { label: "Fair", hex: "#fcd9b8" },
    { label: "Light", hex: "#f0cbb0" },
    { label: "Medium", hex: "#dcb084" },
    { label: "Olive", hex: "#c29367" },
    { label: "Tan", hex: "#a57245" },
    { label: "Brown", hex: "#7b4b2a" },
    { label: "Dark", hex: "#4b2a1a" },
];

const Pill = ({ label, isSelected, onPress, onRemove }: { label: string; isSelected?: boolean; onPress?: () => void; onRemove?: () => void }) => (
    <View
        style={{
            backgroundColor: isSelected ? 'rgba(234, 105, 139, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isSelected ? '#ea698b' : 'rgba(255, 255, 255, 0.1)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
        }}
    >
        <Text style={{
            color: isSelected ? '#ea698b' : '#a1a1aa',
            fontWeight: '700',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
        }}>
            {label}
        </Text>
        {onRemove && (
            <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={12} color={isSelected ? '#ea698b' : '#a1a1aa'} />
            </TouchableOpacity>
        )}
    </View>
);

const EditableInput = ({
    value,
    onChangeText,
    placeholder,
    multiline = false,
}: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    multiline?: boolean;
}) => (
    <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        multiline={multiline}
        className={`bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm ${multiline ? 'min-h-[100px] text-top' : ''
            }`}
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
    />
);

const SectionActions = ({
    isDirty,
    isSaving,
    onSave,
    onCancel,
}: {
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
}) => {
    if (!isDirty) return null;
    return (
        <View className="flex-row items-center justify-end gap-2 mt-4">
            <TouchableOpacity
                onPress={onCancel}
                className="px-3 py-2 rounded-lg border border-white/10"
            >
                <Text className="text-zinc-400 text-[10px] font-bold uppercase">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={onSave}
                disabled={isSaving}
                className="px-3 py-2 rounded-lg bg-pink-500 border border-pink-600 flex-row items-center gap-2"
            >
                {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={12} color="#fff" />}
                <Text className="text-white text-[10px] font-bold uppercase">Save</Text>
            </TouchableOpacity>
        </View>
    );
};

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    profileData,
    isDesktop,
    isEditable = false,
}) => {
    const { activeEditSection, setEditSection, openSheet, setSaving, setSectionError } = useProfileUiStore();
    const { user, setAuth, accessToken } = useAuthStore();

    // Local State for Inline Edits
    const [bio, setBio] = useState(profileData.bio || "");
    const [age, setAge] = useState(profileData.age || "");
    const [height, setHeight] = useState(profileData.height || "");
    const [skinTone, setSkinTone] = useState(profileData.skinTone || "");
    const [skills, setSkills] = useState<string[]>(profileData.skills || []);
    const [skillSearchQuery, setSkillSearchQuery] = useState("");
    const [showSkillDropdown, setShowSkillDropdown] = useState(false);
    const [socials, setSocials] = useState({
        instagramHandle: profileData.instagramHandle || "",
        youtubeUrl: profileData.youtubeUrl || "",
        spotifyUrl: profileData.spotifyUrl || "",
        soundcloudUrl: profileData.soundcloudUrl || "",
    });

    // Reset when exiting edit mode
    useEffect(() => {
        if (!activeEditSection) {
            setBio(profileData.bio || "");
            setAge(profileData.age || "");
            setHeight(profileData.height || "");
            setSkinTone(profileData.skinTone || "");
            setSkills(profileData.skills || []);
            setSkillSearchQuery("");
            setShowSkillDropdown(false);
            setSocials({
                instagramHandle: profileData.instagramHandle || "",
                youtubeUrl: profileData.youtubeUrl || "",
                spotifyUrl: profileData.spotifyUrl || "",
                soundcloudUrl: profileData.soundcloudUrl || "",
            });
        }
    }, [activeEditSection, profileData]);

    const handleSave = async (section: 'about' | 'basic' | 'identity' | 'socials') => {
        setSaving(section);
        try {
            let payload = {};
            if (section === 'about') {
                payload = { bio, ...socials };
            } else if (section === 'basic') {
                payload = { age, height, skinTone };
            } else if (section === 'identity') {
                payload = { skills };
            } else if (section === 'socials') {
                payload = { ...socials };
            }
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

    const isSocialsDirty = socials.instagramHandle !== (profileData.instagramHandle || "") ||
        socials.youtubeUrl !== (profileData.youtubeUrl || "") ||
        socials.spotifyUrl !== (profileData.spotifyUrl || "") ||
        socials.soundcloudUrl !== (profileData.soundcloudUrl || "");

    const isBasicDirty = age !== (profileData.age || "") ||
        height !== (profileData.height || "") ||
        skinTone !== (profileData.skinTone || "");

    const isIdentityDirty = JSON.stringify(skills) !== JSON.stringify(profileData.skills || []);

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

    return (
        <View className={`${isDesktop ? 'w-[300px]' : 'w-full'} space-y-12`}>
            {/* Manifesto */}
            <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative">
                <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Bio</Text>
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
                            isDirty={bio !== (profileData.bio || "")}
                            isSaving={false}
                            onSave={() => handleSave('about')}
                            onCancel={() => {
                                setBio(profileData.bio || "");
                                setEditSection(null);
                            }}
                        />
                    </>
                ) : (
                    <Text className="text-zinc-400 leading-6 font-medium italic pl-6 border-l-2 border-zinc-800">
                        "{profileData.bio || "No manifesto available."}"
                    </Text>
                )}
            </View>

            {/* Physical Specs */}
            <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative">
                <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 pl-4 border-l-2 border-pink-500">Physical Specs</Text>
                {isEditable && (
                    <TouchableOpacity
                        onPress={() => activeEditSection === 'basic' ? setEditSection(null) : setEditSection('basic')}
                        className={`absolute top-4 right-4 p-2 rounded-full border ${activeEditSection === 'basic' ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/5 border-transparent'}`}
                    >
                        <Edit2 size={12} color={activeEditSection === 'basic' ? "#ea698b" : "#71717a"} />
                    </TouchableOpacity>
                )}
                {activeEditSection === 'basic' && isEditable ? (
                    <View className="space-y-4">
                        <View>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Age</Text>
                            <EditableInput value={age} onChangeText={setAge} placeholder="Age" />
                        </View>
                        <View>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Height</Text>
                            <EditableInput value={height} onChangeText={setHeight} placeholder="Height" />
                        </View>
                        <View>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-2">Skin Tone</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {DEFINED_SKIN_TONES.map(tone => {
                                    const isSelected = skinTone === tone.label;
                                    return (
                                        <TouchableOpacity
                                            key={tone.label}
                                            onPress={() => setSkinTone(tone.label)}
                                            style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: 11,
                                                backgroundColor: tone.hex,
                                                borderWidth: 2,
                                                borderColor: isSelected ? '#ea698b' : 'transparent',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isSelected && <Check size={16} color={tone.hex === "#fcd9b8" || tone.hex === "#f0cbb0" ? "#000" : "#fff"} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {skinTone ? (
                                <Text className="text-zinc-400 text-xs mt-2 italic">{skinTone}</Text>
                            ) : null}
                        </View>
                        <SectionActions
                            isDirty={isBasicDirty}
                            isSaving={false}
                            onSave={() => handleSave('basic')}
                            onCancel={() => {
                                setAge(profileData.age || "");
                                setHeight(profileData.height || "");
                                setSkinTone(profileData.skinTone || "");
                                setEditSection(null);
                            }}
                        />
                    </View>
                ) : (
                    <View className="gap-4 bg-zinc-900/30 p-5 rounded-xl border border-white/5">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <Calendar size={14} color="#71717a" />
                                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Age</Text>
                            </View>
                            <Text className="text-white text-xs font-black italic">{profileData.age || "-"} Years</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <Ruler size={14} color="#71717a" />
                                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Height</Text>
                            </View>
                            <Text className="text-white text-xs font-black italic">{profileData.height || "-"}</Text>
                        </View>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <User size={14} color="#71717a" />
                                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Skin Tone</Text>
                            </View>
                            <Text className="text-white text-xs font-black italic">{profileData.skinTone || "-"}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Skills */}
            <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative z-50">
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
                            isDirty={isIdentityDirty}
                            isSaving={false}
                            onSave={() => handleSave('identity')}
                            onCancel={() => {
                                setSkills(profileData.skills || []);
                                setShowSkillDropdown(false);
                                setSkillSearchQuery("");
                                setEditSection(null);
                            }}
                        />
                    </View>
                ) : (
                    <View className="flex-row flex-wrap gap-2">
                        {profileData.skills.length > 0 ? profileData.skills.map((skill, i) => (
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

            {/* Socials */}
            <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative">
                <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Socials</Text>
                {isEditable && (
                    <TouchableOpacity
                        onPress={() => activeEditSection === 'socials' ? setEditSection(null) : setEditSection('socials')}
                        className={`absolute top-4 right-4 p-2 rounded-full border ${activeEditSection === 'socials' ? 'bg-pink-500/10 border-pink-500/20' : 'bg-white/5 border-transparent'}`}
                    >
                        <Edit2 size={12} color={activeEditSection === 'socials' ? "#ea698b" : "#71717a"} />
                    </TouchableOpacity>
                )}
                {activeEditSection === 'socials' && isEditable ? (
                    <View className="space-y-4">
                        <View>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Instagram Handle</Text>
                            <EditableInput value={socials.instagramHandle} onChangeText={t => setSocials(s => ({ ...s, instagramHandle: t }))} placeholder="username" />
                        </View>
                        <View>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">YouTube URL</Text>
                            <EditableInput value={socials.youtubeUrl} onChangeText={t => setSocials(s => ({ ...s, youtubeUrl: t }))} placeholder="https://youtube.com/..." />
                        </View>
                        <View>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Spotify URL</Text>
                            <EditableInput value={socials.spotifyUrl} onChangeText={t => setSocials(s => ({ ...s, spotifyUrl: t }))} placeholder="https://open.spotify.com/..." />
                        </View>
                        <View>
                            <Text className="text-zinc-500 text-[10px] uppercase font-bold mb-1">SoundCloud URL</Text>
                            <EditableInput value={socials.soundcloudUrl} onChangeText={t => setSocials(s => ({ ...s, soundcloudUrl: t }))} placeholder="https://soundcloud.com/..." />
                        </View>
                        <SectionActions
                            isDirty={isSocialsDirty}
                            isSaving={false}
                            onSave={() => handleSave('socials')}
                            onCancel={() => {
                                setSocials({
                                    instagramHandle: profileData.instagramHandle || "",
                                    youtubeUrl: profileData.youtubeUrl || "",
                                    spotifyUrl: profileData.spotifyUrl || "",
                                    soundcloudUrl: profileData.soundcloudUrl || "",
                                });
                                setEditSection(null);
                            }}
                        />
                    </View>
                ) : (
                    <View className="flex-row items-center gap-4">
                        {profileData.instagramHandle && (
                            <TouchableOpacity
                                className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5"
                                onPress={() => Linking.openURL(`https://instagram.com/${profileData.instagramHandle}`)}
                            >
                                <Instagram size={18} color="white" />
                            </TouchableOpacity>
                        )}
                        {profileData.youtubeUrl && (
                            <TouchableOpacity
                                className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5"
                                onPress={() => Linking.openURL(profileData.youtubeUrl!)}
                            >
                                <Youtube size={18} color="white" />
                            </TouchableOpacity>
                        )}
                        {profileData.spotifyUrl && (
                            <TouchableOpacity
                                className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5"
                                onPress={() => Linking.openURL(profileData.spotifyUrl!)}
                            >
                                <Music2 size={18} color="white" />
                            </TouchableOpacity>
                        )}
                        {profileData.soundcloudUrl && (
                            <TouchableOpacity
                                className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5"
                                onPress={() => Linking.openURL(profileData.soundcloudUrl!)}
                            >
                                <Headphones size={18} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

export default ProfileSidebar;
