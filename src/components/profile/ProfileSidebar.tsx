// src/components/profile/ProfileSidebar.tsx
import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Linking,
} from "react-native";
import {
    Calendar,
    Ruler,
    User,
    Instagram,
    Briefcase,
    Zap,
    ArrowRight,
} from "lucide-react-native";
import { ProfileSidebarProps } from "./types";

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    profileData,
    isDesktop,
    isEditable = false,
    onEditPress,
}) => {
    return (
        <View className={`${isDesktop ? 'w-[300px]' : 'w-full'} space-y-12`}>
            {/* Manifesto */}
            <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
                <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Manifesto</Text>
                <Text className="text-zinc-400 leading-6 font-medium italic pl-6 border-l-2 border-zinc-800">
                    "{profileData.bio || "No manifesto available."}"
                </Text>
            </View>

            {/* Physical Specs */}
            <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
                <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 pl-4 border-l-2 border-pink-500">Physical Specs</Text>
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
            </View>

            {/* Skills */}
            <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
                <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Core Skills</Text>
                <View className="flex-row flex-wrap gap-2">
                    {profileData.skills.length > 0 ? profileData.skills.map((skill, i) => (
                        <View key={i} className="bg-zinc-900 border border-white/5 px-3 py-1 rounded-lg">
                            <Text className="text-zinc-400 text-[10px] font-bold uppercase">{skill}</Text>
                        </View>
                    )) : (
                        <Text className="text-zinc-700 text-[10px] uppercase font-bold">No skills listed</Text>
                    )}
                </View>
            </View>

            {/* Availability */}
            <View className="relative overflow-hidden p-8 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-6">
                <View className="absolute inset-0 bg-black/60 z-10 items-center justify-center">
                    <Text className="text-white font-black text-xs uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full bg-black/40">Coming Soon</Text>
                </View>
                <View className="opacity-30">
                    <View className="flex-row items-center gap-3">
                        <Zap size={18} color="#ea698b" fill="#ea698b" />
                        <Text className="text-pink-500 text-xs font-black uppercase tracking-widest">Availability</Text>
                    </View>
                    <Text className="text-zinc-400 text-sm mt-6">
                        Next free slot: <Text className="text-white font-bold">Feb 12th, 2026</Text>
                    </Text>
                    <TouchableOpacity className="flex-row items-center gap-2 mt-6" disabled>
                        <Text className="text-[10px] font-black uppercase tracking-widest text-white">View Calendar</Text>
                        <ArrowRight size={12} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Socials */}
            <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
                <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Socials</Text>
                <View className="flex-row items-center gap-4">
                    {profileData.instagramHandle && (
                        <TouchableOpacity
                            className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5"
                            onPress={() => Linking.openURL(`https://instagram.com/${profileData.instagramHandle}`)}
                        >
                            <Instagram size={18} color="white" />
                        </TouchableOpacity>
                    )}
                    {/* <TouchableOpacity className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5">
                        <Briefcase size={18} color="white" />
                    </TouchableOpacity> */}
                </View>
            </View>
        </View>
    );
};

export default ProfileSidebar;
