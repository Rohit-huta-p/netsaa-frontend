// src/components/profile/ProfileHeader.tsx
import React from "react";
import noAvatar from "@/assets/no-avatar.jpg";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
} from "react-native";
import {
    MapPin,
    Share2,
    Edit3,
} from "lucide-react-native";
import { ProfileHeaderProps } from "./types";

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    fullName,
    artistType,
    location,
    profileImageUrl,
    stats,
    isDesktop,
    isEditable = false,
    onEditPress,
    onSharePress,
}) => {
    return (
        <View className="relative pt-12 pb-8 border-b px-6 py-10">
            <View className={`flex-col ${isDesktop ? 'md:flex-row' : ''} items-start gap-10 bg-zinc-900/80 rounded-2xl py-6 px-4`}>
                {/* Avatar */}
                <View className="relative">
                    <View className="w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border border-white/10 relative">
                        <Image
                            source={profileImageUrl ? { uri: profileImageUrl } : noAvatar}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                            className="rounded-full mr-4 bg-gray-800"
                            resizeMode="cover"
                        />
                    </View>
                    {/* Available Tag */}
                    <View className="absolute -bottom-2 -right-2 bg-green-500 px-2 py-0.5 rounded-lg border-2 border-black">
                        <Text className="text-black font-black text-[8px] uppercase tracking-tighter">Available</Text>
                    </View>
                </View>

                {/* Info */}
                <View className="flex-1 space-y-3">
                    <View className="flex-row items-center gap-3">
                        <View className="bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                            <Text className="text-pink-500 text-[9px] font-bold uppercase tracking-widest">Verified Artist</Text>
                        </View>
                        {location ? (
                            <View className="flex-row items-center gap-1">
                                <MapPin size={10} color="#71717a" />
                                <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">{location}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View>
                        <Text className="text-4xl md:text-5xl font-black tracking-tight text-white italic uppercase leading-none mb-1">
                            {fullName || "YOUR NAME"}
                        </Text>
                        <Text className="text-lg md:text-xl text-zinc-400 font-medium italic">
                            {artistType || "ADD YOUR ROLE"}
                        </Text>
                    </View>

                    {/* Stats Bar */}
                    <View className="flex-row flex-wrap items-center gap-6 pt-6">
                        <View>
                            <Text className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Base</Text>
                            <Text className="text-sm text-white font-black italic">
                                {location ? location.charAt(0).toUpperCase() + location.slice(1) : "TBA"}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Connections</Text>
                            <Text className="text-sm text-white font-black italic">{stats.connections}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View className={`flex-row ${isEditable ? 'absolute right-5 top-4' : ''} gap-2 ${isDesktop ? 'w-auto' : ''}`}>
                    <TouchableOpacity
                        onPress={onSharePress}
                        className="h-12 w-12 rounded-lg items-center justify-center"
                    >
                        <Share2 size={16} color="#fff" />
                    </TouchableOpacity>
                    {isEditable && onEditPress && (
                        <TouchableOpacity
                            onPress={onEditPress}
                            className="px-3 rounded-lg items-center justify-center"
                        >
                            <Edit3 size={16} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

export default ProfileHeader;
