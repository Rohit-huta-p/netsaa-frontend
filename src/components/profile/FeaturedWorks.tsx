// src/components/profile/FeaturedWorks.tsx
import React from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Platform,
} from "react-native";
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { LinearGradient } from "expo-linear-gradient";
import {
    Camera,
    Play,
} from "lucide-react-native";
import { FeaturedWorksProps } from "./types";

export const FeaturedWorks: React.FC<FeaturedWorksProps> = ({
    galleryUrls,
    videoUrls,
    hasPhotos,
    isEditable = false,
    isDesktop,
    onEditPress,
}) => {
    // Ensure arrays have proper length
    const photos = [...(galleryUrls || []), '', '', '', '', ''].slice(0, 5);
    const videos = [...(videoUrls || []), '', '', ''].slice(0, 3);

    return (
        <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
            <View className="flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
                <Text className="text-2xl font-black text-white italic tracking-tight">FEATURED WORKS</Text>
                {isEditable && onEditPress ? (
                    <TouchableOpacity onPress={onEditPress}>
                        <Text className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Edit</Text>
                    </TouchableOpacity>
                ) : (
                    <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        View All / {photos.filter(u => u).length + videos.filter(u => u).length}
                    </Text>
                )}
            </View>

            {isEditable ? (
                // Editable Mode - Show slots
                <View className="space-y-8">
                    {/* Photo Gallery - 5 slots */}
                    <View>
                        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                            Photos ({photos.filter(u => u).length}/5)
                        </Text>
                        <View className="flex-row flex-wrap gap-3">
                            {[0, 1, 2, 3, 4].map((index) => {
                                const url = photos[index];
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={onEditPress}
                                        className="w-[18%] aspect-square rounded-xl overflow-hidden border border-white/10"
                                        style={{ minWidth: 60 }}
                                    >
                                        {url ? (
                                            <Image source={{ uri: url }} className="w-full h-full" />
                                        ) : (
                                            <View className="w-full h-full bg-zinc-800/50 items-center justify-center">
                                                <Camera size={20} color="#52525b" />
                                                <Text className="text-zinc-600 text-[8px] mt-1 text-center">Add</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Video Reels - 3 slots */}
                    <View>
                        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                            Video Reels ({videos.filter(u => u).length}/3)
                        </Text>
                        <View className="flex-row gap-3">
                            {[0, 1, 2].map((index) => {
                                const url = videos[index];
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => !url && onEditPress?.()}
                                        activeOpacity={url ? 1 : 0.7}
                                        className="flex-1 aspect-[9/16] rounded-xl overflow-hidden border border-white/10"
                                        style={{ maxWidth: 120 }}
                                    >
                                        {url ? (
                                            Platform.OS === 'web' ? (
                                                <video
                                                    src={url}
                                                    controls
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <ExpoVideo
                                                    source={{ uri: url }}
                                                    style={{ width: '100%', height: '100%' }}
                                                    useNativeControls
                                                    resizeMode={ResizeMode.COVER}
                                                    shouldPlay={false}
                                                />
                                            )
                                        ) : (
                                            <View className="w-full h-full bg-zinc-800/50 items-center justify-center">
                                                <Play size={24} color="#52525b" />
                                                <Text className="text-zinc-600 text-[8px] mt-2 text-center">Add{'\n'}Reel</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            ) : (
                // View-only Mode - Show showcase
                hasPhotos ? (
                    <View className="flex-col gap-4">
                        {/* Item 1 - Wide */}
                        <View className="w-full aspect-[21/9] bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden relative">
                            <Image
                                source={{ uri: photos[0] || "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600" }}
                                className="w-full h-full opacity-80"
                            />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} className="absolute inset-0" />
                            <View className="absolute bottom-6 left-6">
                                <Text className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-1">Performance</Text>
                                <Text className="text-lg text-white font-black italic uppercase tracking-tight">Featured Work</Text>
                            </View>
                        </View>

                        {/* Row of 2 */}
                        <View className={`flex-row gap-4 ${isDesktop ? '' : 'flex-wrap'}`}>
                            <View className="flex-1 aspect-square bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden relative">
                                <Image
                                    source={{ uri: photos[1] || "https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=600" }}
                                    className="w-full h-full opacity-80"
                                />
                            </View>
                            <View className="flex-1 aspect-square bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden relative">
                                <Image
                                    source={{ uri: photos[2] || "https://images.unsplash.com/photo-1535525153412-5a42439a210d?q=80&w=600" }}
                                    className="w-full h-full opacity-80"
                                />
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="py-12 border border-dashed border-white/10 items-center justify-center">
                        <Text className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No Portfolio Content</Text>
                    </View>
                )
            )}
        </View>
    );
};

export default FeaturedWorks;
