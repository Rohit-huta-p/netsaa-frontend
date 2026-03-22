import React, { useState } from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Instagram, Youtube, Music2, Headphones, Edit2 } from "lucide-react-native";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { EditableInput, SectionActions } from "./SharedSidebarComponents";

interface SocialsSectionProps {
    isEditable: boolean;
    isOrganizer?: boolean;
    initialSocials: {
        instagramHandle?: string;
        youtubeUrl?: string;
        spotifyUrl?: string;
        soundcloudUrl?: string;
    };
    onSave: (socials: { instagramHandle: string; youtubeUrl: string; spotifyUrl: string; soundcloudUrl: string; }) => Promise<void>;
}

import { Colors } from "@/constants/Colors";

export const SocialsSection: React.FC<SocialsSectionProps> = ({ isEditable, isOrganizer, initialSocials, onSave }) => {
    const { activeEditSection, setEditSection } = useProfileUiStore();
    const [socials, setSocials] = useState({
        instagramHandle: initialSocials.instagramHandle || "",
        youtubeUrl: initialSocials.youtubeUrl || "",
        spotifyUrl: initialSocials.spotifyUrl || "",
        soundcloudUrl: initialSocials.soundcloudUrl || "",
    });

    const isDirty = socials.instagramHandle !== (initialSocials.instagramHandle || "") ||
        socials.youtubeUrl !== (initialSocials.youtubeUrl || "") ||
        socials.spotifyUrl !== (initialSocials.spotifyUrl || "") ||
        socials.soundcloudUrl !== (initialSocials.soundcloudUrl || "");

    const handleCancel = () => {
        setSocials({
            instagramHandle: initialSocials.instagramHandle || "",
            youtubeUrl: initialSocials.youtubeUrl || "",
            spotifyUrl: initialSocials.spotifyUrl || "",
            soundcloudUrl: initialSocials.soundcloudUrl || "",
        });
        setEditSection(null);
    };

    const handleSave = async () => {
        await onSave(socials);
    };

    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6 relative">
            <Text className={`text-xs font-black uppercase tracking-[0.3em] mb-6 text-white`}>Socials</Text>
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
                        isDirty={isDirty}
                        isSaving={false}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </View>
            ) : (
                <View className="flex-row items-center gap-4">
                    {/* Instagram */}
                    <TouchableOpacity
                        className={`w-10 h-10 rounded-xl bg-white/5 items-center justify-center border ${initialSocials.instagramHandle ? 'border-white/10' : 'border-transparent'}`}
                        onPress={() => initialSocials.instagramHandle && Linking.openURL(`https://instagram.com/${initialSocials.instagramHandle}`)}
                        disabled={!initialSocials.instagramHandle}
                    >
                        <Instagram size={18} color={initialSocials.instagramHandle ? "white" : "#3f3f46"} />
                    </TouchableOpacity>

                    {/* YouTube */}
                    <TouchableOpacity
                        className={`w-10 h-10 rounded-xl bg-white/5 items-center justify-center border ${initialSocials.youtubeUrl ? 'border-white/10' : 'border-transparent'}`}
                        onPress={() => initialSocials.youtubeUrl && Linking.openURL(initialSocials.youtubeUrl)}
                        disabled={!initialSocials.youtubeUrl}
                    >
                        <Youtube size={18} color={initialSocials.youtubeUrl ? "white" : "#3f3f46"} />
                    </TouchableOpacity>

                    {/* Spotify */}
                    <TouchableOpacity
                        className={`w-10 h-10 rounded-xl bg-white/5 items-center justify-center border ${initialSocials.spotifyUrl ? 'border-white/10' : 'border-transparent'}`}
                        onPress={() => initialSocials.spotifyUrl && Linking.openURL(initialSocials.spotifyUrl)}
                        disabled={!initialSocials.spotifyUrl}
                    >
                        <Music2 size={18} color={initialSocials.spotifyUrl ? "white" : "#3f3f46"} />
                    </TouchableOpacity>

                    {/* SoundCloud */}
                    <TouchableOpacity
                        className={`w-10 h-10 rounded-xl bg-white/5 items-center justify-center border ${initialSocials.soundcloudUrl ? 'border-white/10' : 'border-transparent'}`}
                        onPress={() => initialSocials.soundcloudUrl && Linking.openURL(initialSocials.soundcloudUrl)}
                        disabled={!initialSocials.soundcloudUrl}
                    >
                        <Headphones size={18} color={initialSocials.soundcloudUrl ? "white" : "#3f3f46"} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};
