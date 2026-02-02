// app/(app)/profile/[id].tsx
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    useWindowDimensions,
    ActivityIndicator,
    StatusBar,
    Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    MapPin, Instagram,
    Play, Star, Quote, Plus,
    ArrowLeft, User, Ruler, Palette, Briefcase, Camera, Sparkles, X,
    Edit3, Shield, Check, ArrowRight, Menu, Calendar, Zap, Users, Activity, Award, Mail,
    Share2
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import authService from "../../../src/services/authService";
import { User as UserType } from "../../../src/types";
import useAuthStore from "@/stores/authStore";

// --- THEME ---
const THEME = {
    colors: {
        bg: '#000000',
        card: 'rgba(255, 255, 255, 0.03)',
        border: 'rgba(255, 255, 255, 0.08)',
        primary: '#ffffff',
        secondary: '#a1a1aa', // zinc-400
        accent: '#ea698b', // netsa-10
    }
};

// --- TYPES ---
type ProfileData = {
    fullName: string;
    location: string;
    age: string;
    gender: string;
    height: string;
    skinTone: string;
    artistType: string;
    skills: string[];
    bio: string;
    instagramHandle: string;
    experience: string[];
    hasPhotos: boolean;
};

// --- HELPER COMPONENT: Replicating Navbar from Design ---
const Navbar = () => {
    return (
        <View className="flex-row items-center justify-between px-6 py-6 pt-4 bg-transparent z-50">
            <View className="flex-row items-center gap-2">
                <LinearGradient
                    colors={['#18181b', '#ea698b']}
                    start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}
                    className="w-8 h-8 rounded items-center justify-center"
                >
                    <Sparkles size={20} color="white" />
                </LinearGradient>
                <Text className="text-xl font-bold tracking-tight text-white uppercase italic">NETSA</Text>
            </View>

            <View className="flex-row items-center gap-4">
                <TouchableOpacity>
                    <Menu size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function UserProfile() {
    const { user } = useAuthStore();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const [profile, setProfile] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return;
            if (id === user?._id) {
                setProfile(user);
                return;
            }
            try {
                setLoading(true);
                const fetchedUser = await authService.getUserById(Array.isArray(id) ? id[0] : id);
                setProfile(fetchedUser);
                setError("");
            } catch (err) {
                console.error("Failed to fetch user", err);
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id]);

    // Map User to ProfileData (Handling missing fields gracefully)
    const profileData: ProfileData = {
        fullName: profile?.displayName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Artist',
        location: (profile as any)?.location || "",
        age: (profile as any)?.age || "",
        gender: (profile as any)?.gender || "",
        height: (profile as any)?.height || "",
        skinTone: (profile as any)?.skinTone || "",
        artistType: (profile as any)?.artistType || profile?.roles?.[0] || "",
        skills: (profile as any)?.skills || [],
        bio: (profile as any)?.bio || "",
        instagramHandle: (profile as any)?.instagramHandle || "",
        experience: (profile as any)?.experience || [],
        hasPhotos: (profile as any)?.hasPhotos || false
    };

    // Mock stats for now
    const mockStats = {
        connections: profile?.connections || 234,
        events: profile?.events || 47,
        rating: profile?.rating || 4.9
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#ea698b" />
            </View>
        );
    }

    if (error || !profile) {
        return (
            <View className="flex-1 bg-black items-center justify-center p-6">
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-6">User Unavailable</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-white/10 px-6 py-3 border border-white/20">
                    <Text className="text-white font-bold uppercase tracking-widest text-[10px]">Return Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* Navbar */}
                <View className="flex-row items-center justify-between px-6 py-6 pt-4 bg-transparent z-50">
                    <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-2">
                        <ArrowLeft size={20} color="white" />
                        <Text className="text-white font-bold text-[10px] uppercase tracking-widest">Back</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity>
                            <Menu size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120, width: '80%', marginLeft: '10%', marginRight: '10%' }}>


                    {/* Header Section */}
                    <View className="relative pt-12 pb-8 border-b  px-6 py-10 ">
                        <View className={`flex-col ${isDesktop ? 'md:flex-row ' : ''} items-start gap-10 bg-zinc-900/80 rounded-2xl py-6 px-4`}>
                            {/* Avatar */}
                            <View className="relative">
                                <View className="w-32 h-32 md:w-44 md:h-44 rounded-2xl overflow-hidden border border-white/10 relative">
                                    <Image
                                        source={{ uri: (profile as any)?.profileImageUrl || 'https://i.pravatar.cc/800?u=me' }}
                                        className="w-full h-full opacity-90"
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
                                    {profileData.location ? (
                                        <View className="flex-row items-center gap-1">
                                            <MapPin size={10} color="#71717a" />
                                            <Text className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">{profileData.location}</Text>
                                        </View>
                                    ) : null}
                                </View>

                                <View>
                                    <Text className="text-4xl md:text-5xl font-black tracking-tight text-white italic uppercase leading-none mb-1">
                                        {profileData.fullName || "YOUR NAME"}
                                    </Text>
                                    <Text className="text-lg md:text-xl text-zinc-400 font-medium italic">
                                        {profileData.artistType || "ADD YOUR ROLE"}
                                    </Text>
                                </View>

                                {/* Stats Bar */}
                                <View className="flex-row flex-wrap items-center gap-6 pt-6 ">
                                    <View>
                                        <Text className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Base</Text>
                                        {profileData.location ? (
                                            <>
                                                {/* <MapPin size={10} color="#71717a" /> */}
                                                <Text className="text-sm text-white font-black italic">{profileData.location.charAt(0).toUpperCase() + profileData.location.slice(1)}</Text>
                                            </>
                                        ) : null}
                                    </View>
                                    <View>
                                        <Text className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Connections</Text>
                                        <Text className="text-sm text-white font-black italic">{mockStats.connections}</Text>
                                    </View>
                                    {/* <View>
                                        <Text className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Rating</Text>
                                        <View className="flex-row items-center gap-1">
                                            <Star size={12} fill="#ea698b" color="#ea698b" />
                                            <Text className="text-sm text-white font-black italic">{mockStats.rating}</Text>
                                        </View>
                                    </View> */}
                                </View>
                            </View>

                            {/* Actions - Mapped to EDIT MODE functionality */}
                            <View className={`flex-row gap-2 ${isDesktop ? 'w-auto' : 'w-full'}`}>
                                <TouchableOpacity
                                    className=" h-12 w-12 rounded-lg items-center justify-center "
                                >
                                    {/* <Text className="text-white font-black italic text-sm uppercase">Share Profile</Text> */}
                                    <Share2 size={16} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    // onPress={() => openWizard(0)}
                                    className="  px-3 rounded-lg items-center justify-center"
                                >
                                    {/* <Text className="text-black font-black italic text-sm uppercase">Edit Profile</Text> */}
                                    <Edit3 size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Main Layout Grid */}
                    <View className="px-6 py-16">
                        <View className={`flex-col ${isDesktop ? 'md:flex-row' : ''} gap-16`}>

                            {/* SIDEBAR */}
                            <View className={`${isDesktop ? 'w-[300px]' : 'w-full'} space-y-12`}>

                                {/* Physical Specs */}
                                <View className="bg-zinc-900/60 p-6 rounded-2xl">
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

                                {/* Manifesto */}
                                <View className="bg-zinc-900/60 p-6 rounded-2xl">
                                    <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Manifesto</Text>
                                    <Text className="text-zinc-400 leading-6 font-medium italic pl-6 border-l-2 border-zinc-800">
                                        "{profileData.bio || "No manifesto available."}"
                                    </Text>
                                </View>

                                {/* Skills */}
                                <View className="bg-zinc-900/60 p-6 rounded-2xl">
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

                                {/* Availability (Static for now as per design) */}
                                <View className="p-8 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-6">
                                    <View className="flex-row items-center gap-3">
                                        <Zap size={18} color="#ea698b" fill="#ea698b" />
                                        <Text className="text-pink-500 text-xs font-black uppercase tracking-widest">Availability</Text>
                                    </View>
                                    <Text className="text-zinc-400 text-sm">
                                        Next free slot: <Text className="text-white font-bold">Feb 12th, 2026</Text>
                                    </Text>
                                    <TouchableOpacity className="flex-row items-center gap-2">
                                        <Text className="text-[10px] font-black uppercase tracking-widest text-white">View Calendar</Text>
                                        <ArrowRight size={12} color="white" />
                                    </TouchableOpacity>
                                </View>

                                {/* Socials */}
                                <View>
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
                                        <TouchableOpacity className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5">
                                            <Briefcase size={18} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* MAIN CONTENT */}
                            <View className="flex-1 space-y-20">

                                {/* Showcase */}
                                <View className="bg-zinc-900/60 p-6 rounded-2xl">
                                    <View className="flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
                                        <Text className="text-2xl font-black text-white italic tracking-tight">FEATURED WORKS</Text>
                                        <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">View All / 12</Text>
                                    </View>

                                    {/* Grid Simulation */}
                                    {profileData.hasPhotos ? (
                                        <View className="flex-col gap-4">
                                            {/* Item 1 - Wide */}
                                            <View className="w-full aspect-[21/9] bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden relative">
                                                <Image
                                                    source={{ uri: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=600" }}
                                                    className="w-full h-full opacity-80"
                                                />
                                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} className="absolute inset-0" />
                                                <View className="absolute bottom-6 left-6">
                                                    <Text className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-1">Performance</Text>
                                                    <Text className="text-lg text-white font-black italic uppercase tracking-tight">Midnight Solitude</Text>
                                                </View>
                                            </View>

                                            {/* Row of 2 */}
                                            <View className={`flex-row gap-4 ${isDesktop ? '' : 'flex-wrap'}`}>
                                                <View className="flex-1 aspect-square bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden relative">
                                                    <Image
                                                        source={{ uri: "https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=600" }}
                                                        className="w-full h-full opacity-80"
                                                    />
                                                </View>
                                                <View className="flex-1 aspect-square bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden relative">
                                                    <Image
                                                        source={{ uri: "https://images.unsplash.com/photo-1535525153412-5a42439a210d?q=80&w=600" }}
                                                        className="w-full h-full opacity-80"
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    ) : (
                                        <View className="py-12 border border-dashed border-white/10 items-center justify-center">
                                            <Text className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No Portfolio Content</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Professional History */}
                                <View className="bg-zinc-900/60 p-6 rounded-2xl">
                                    <View className="flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
                                        <Text className="text-2xl font-black text-white italic tracking-tight">PROFESSIONAL HISTORY</Text>
                                        <Award size={20} color="#52525b" />
                                    </View>
                                    <View>
                                        {profileData.experience.length > 0 ? profileData.experience.map((exp, i) => (
                                            <View key={i} className="flex-row items-center justify-between py-6 border-b border-white/5">
                                                <View className="flex-row items-center gap-6">
                                                    <Text className="text-[10px] font-black text-zinc-600">0{i + 1}</Text>
                                                    <View>
                                                        <Text className="text-lg font-bold text-white">{exp}</Text>
                                                        <Text className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-1">Verified Event</Text>
                                                    </View>
                                                </View>
                                                <Text className="text-xs font-black text-zinc-500 italic">2026</Text>
                                            </View>
                                        )) : (
                                            <View className="py-8 border border-dashed border-white/10 items-center justify-center">
                                                <Text className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No History Listed</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {/* Testimonials (Static Placeholder as per design) */}
                                <View className="p-12 rounded-[2rem] bg-zinc-900/20 border border-white/5 relative overflow-hidden">
                                    <View className="absolute -top-4 -right-4 rotate-12 opacity-5">
                                        <Quote size={128} color="white" />
                                    </View>
                                    <View className="relative z-10">
                                        <View className="flex-row gap-1 mb-6">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="#ea698b" color="#ea698b" />)}
                                        </View>
                                        <Text className="text-2xl md:text-3xl font-medium italic tracking-tight leading-relaxed text-zinc-200 mb-10">
                                            "The artist demonstrates exceptional skill and professionalism. Truly a rising star."
                                        </Text>
                                        <View className="flex-row items-center gap-4 border-t border-white/5 pt-8">
                                            <View className="w-10 h-10 rounded-full bg-zinc-800" />
                                            <View>
                                                <Text className="text-sm text-white font-black uppercase italic">Event Organizer</Text>
                                                <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Director • Verified Venue</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Visual Replica */}
                <View className="py-8 border-t border-white/5 bg-black px-6">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">© 2026 NETSA PLATFORMS.</Text>
                        <View className="flex-row gap-4">
                            <Text className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Privacy</Text>
                            <Text className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Terms</Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}
