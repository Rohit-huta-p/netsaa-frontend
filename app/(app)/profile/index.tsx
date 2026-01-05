// app/(app)/profile/index.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    useWindowDimensions,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
    MapPin, Mail, Phone, Instagram,
    Play, Image as ImageIcon, Star, Quote, Plus,
    ArrowLeft, Check, ChevronRight, User, Ruler, Palette, Mic2, Briefcase, Camera, Sparkles, X,
    Edit3
} from "lucide-react-native";
import { useAuthStore } from "../../../src/stores/authStore";
import authService from "../../../src/services/authService";


// --- TYPES ---

type ProfileFormData = {
    // Step 1: Basic
    fullName: string;
    location: string;
    age: string;
    gender: string;
    height: string;
    skinTone: string;
    // Step 2: Identity
    artistType: string;
    skills: string[];
    // Step 3: About
    bio: string;
    instagramHandle: string;
    // Step 4: Experience (Simple strings for demo)
    experience: string[];
    // Step 5: Gallery (Placeholder logic)
    hasPhotos: boolean;
};

// --- COMPONENTS ---

// 1. Progress Bar (Gamification)
const ProgressBar = ({ step, total }: { step: number; total: number }) => {
    const progress = Math.min(((step + 1) / total) * 100, 100);
    return (
        <View className="mb-8">
            <View className="flex-row justify-between mb-2">
                <Text className="text-pink-400 font-bold text-xs uppercase tracking-widest">
                    Profile Completion
                </Text>
                <Text className="text-white font-bold text-xs">{Math.round(progress)}%</Text>
            </View>
            <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <LinearGradient
                    colors={['#ec4899', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${progress}%`, height: '100%' }}
                />
            </View>
        </View>
    );
};

// 2. Selection Pill (Large Touch Target)
const SelectionPill = ({ label, isSelected, onPress }: { label: string, isSelected: boolean, onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`px-5 py-3 rounded-full border mr-2 mb-2 ${isSelected
            ? "bg-purple-600 border-purple-500"
            : "bg-white/5 border-white/10"
            }`}
    >
        <Text className={`font-bold ${isSelected ? "text-white" : "text-gray-400"}`}>
            {label}
        </Text>
    </TouchableOpacity>
);

// 3. THE WIZARD (Full Screen Edit Mode)
const ProfileWizard = ({
    initialData,
    initialStep = 0,
    onClose,
    onSave
}: {
    initialData: ProfileFormData;
    initialStep: number;
    onClose: () => void;
    onSave: (data: ProfileFormData) => void;
}) => {
    const [step, setStep] = useState(initialStep);
    const [formData, setFormData] = useState<ProfileFormData>(initialData);

    const TOTAL_STEPS = 5;

    const handleNext = () => {
        if (step < TOTAL_STEPS - 1) setStep(step + 1);
        else onSave(formData);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
        else onClose();
    };

    // --- STEP RENDERERS ---

    const renderStep1_Basic = () => (
        <View className="space-y-6">
            <View>
                <Text className="text-3xl font-black text-white mb-2">The Basics</Text>
                <Text className="text-gray-400 text-base">Let's start with who you are.</Text>
            </View>

            <View>
                <Text className="text-gray-300 mb-2 font-bold">Display Name</Text>
                <TextInput
                    value={formData.fullName}
                    onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                    className="bg-white/10 text-white p-5 rounded-2xl border border-white/10 text-lg"
                    placeholder="What should we call you?"
                    placeholderTextColor="#52525b"
                />
            </View>

            <View>
                <Text className="text-gray-300 mb-2 font-bold">Based In</Text>
                <View className="flex-row items-center bg-white/10 rounded-2xl border border-white/10 px-4">
                    <MapPin size={20} color="#9ca3af" />
                    <TextInput
                        value={formData.location}
                        onChangeText={(t) => setFormData({ ...formData, location: t })}
                        className="flex-1 text-white p-5 text-lg"
                        placeholder="City, State"
                        placeholderTextColor="#52525b"
                    />
                </View>
            </View>

            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text className="text-gray-300 mb-2 font-bold">Age</Text>
                    <TextInput
                        value={formData.age}
                        onChangeText={(t) => setFormData({ ...formData, age: t })}
                        className="bg-white/10 text-white p-5 rounded-2xl border border-white/10 text-lg"
                        keyboardType="numeric"
                        placeholder="21"
                        placeholderTextColor="#52525b"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-gray-300 mb-2 font-bold">Gender</Text>
                    <TextInput
                        value={formData.gender}
                        onChangeText={(t) => setFormData({ ...formData, gender: t })}
                        className="bg-white/10 text-white p-5 rounded-2xl border border-white/10 text-lg"
                        placeholder="Optional"
                        placeholderTextColor="#52525b"
                    />
                </View>
            </View>

            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text className="text-gray-300 mb-2 font-bold">Height</Text>
                    <TextInput
                        value={formData.height}
                        onChangeText={(t) => setFormData({ ...formData, height: t })}
                        className="bg-white/10 text-white p-5 rounded-2xl border border-white/10 text-lg"
                        placeholder="e.g. 5'9"
                        placeholderTextColor="#52525b"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-gray-300 mb-2 font-bold">Skin Tone</Text>
                    <TextInput
                        value={formData.skinTone}
                        onChangeText={(t) => setFormData({ ...formData, skinTone: t })}
                        className="bg-white/10 text-white p-5 rounded-2xl border border-white/10 text-lg"
                        placeholder="Optional"
                        placeholderTextColor="#52525b"
                    />
                </View>
            </View>

            <Text className="text-white/40 text-sm italic">
                🔒 Adding physical details helps casting directors find you for specific roles.
            </Text>
        </View>
    );

    const renderStep2_Identity = () => (
        <View className="space-y-6">
            <View>
                <Text className="text-3xl font-black text-white mb-2">Artist Identity</Text>
                <Text className="text-gray-400 text-base">What is your main craft?</Text>
            </View>

            <View>
                <Text className="text-gray-300 mb-3 font-bold">I am primarily a...</Text>
                <View className="flex-row flex-wrap">
                    {["Dancer", "Musician", "Actor", "Model", "Crew"].map((type) => (
                        <SelectionPill
                            key={type}
                            label={type}
                            isSelected={formData.artistType === type}
                            onPress={() => setFormData({ ...formData, artistType: type })}
                        />
                    ))}
                </View>
            </View>

            <View>
                <Text className="text-gray-300 mb-3 font-bold">Styles & Skills</Text>
                <View className="flex-row flex-wrap">
                    {["Contemporary", "Hip-Hop", "Ballet", "Jazz", "Tap", "Krump", "Vocals", "Guitar"].map((skill) => {
                        const isSelected = formData.skills.includes(skill);
                        return (
                            <SelectionPill
                                key={skill}
                                label={skill}
                                isSelected={isSelected}
                                onPress={() => {
                                    const newSkills = isSelected
                                        ? formData.skills.filter(s => s !== skill)
                                        : [...formData.skills, skill];
                                    setFormData({ ...formData, skills: newSkills });
                                }}
                            />
                        );
                    })}
                </View>
                <Text className="text-white/40 text-sm mt-2">
                    Tip: Select everything you're comfortable performing professionally.
                </Text>
            </View>
        </View>
    );

    const renderStep3_About = () => (
        <View className="space-y-6">
            <View>
                <Text className="text-3xl font-black text-white mb-2">About You</Text>
                <Text className="text-gray-400 text-base">Your chance to say hello.</Text>
            </View>

            <View>
                <Text className="text-gray-300 mb-2 font-bold">Your Bio</Text>
                <TextInput
                    value={formData.bio}
                    onChangeText={(t) => setFormData({ ...formData, bio: t })}
                    className="bg-white/10 text-white p-5 rounded-2xl border border-white/10 text-lg min-h-[160px]"
                    multiline
                    textAlignVertical="top"
                    placeholder="Tell us about your training, your passion, or what you're looking for..."
                    placeholderTextColor="#52525b"
                />
            </View>

            <View>
                <Text className="text-gray-300 mb-2 font-bold">Instagram Handle</Text>
                <View className="flex-row items-center bg-white/10 rounded-2xl border border-white/10 px-4">
                    <Text className="text-gray-500 text-lg font-bold">@</Text>
                    <TextInput
                        value={formData.instagramHandle}
                        onChangeText={(t) => setFormData({ ...formData, instagramHandle: t })}
                        className="flex-1 text-white p-5 text-lg"
                        placeholder="username"
                        placeholderTextColor="#52525b"
                    />
                </View>
                <Text className="text-white/40 text-sm mt-2">
                    We'll link this to your profile so organizers can see your clips.
                </Text>
            </View>
        </View>
    );

    const renderStep4_Experience = () => (
        <View className="space-y-6">
            <View>
                <Text className="text-3xl font-black text-white mb-2">Experience</Text>
                <Text className="text-gray-400 text-base">Show them what you've done.</Text>
            </View>

            <View className="space-y-3">
                {formData.experience.map((exp, index) => (
                    <View key={index} className="flex-row items-center bg-white/5 p-4 rounded-xl border border-white/10">
                        <View className="bg-green-500/20 p-2 rounded-full mr-3">
                            <Check size={14} color="#4ade80" />
                        </View>
                        <Text className="text-white font-medium flex-1 text-lg">{exp}</Text>
                        <TouchableOpacity onPress={() => {
                            const newExp = [...formData.experience];
                            newExp.splice(index, 1);
                            setFormData({ ...formData, experience: newExp });
                        }}>
                            <X size={20} color="#ef4444" opacity={0.7} />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                className="flex-row items-center justify-center p-6 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 mt-2 active:bg-white/10"
                onPress={() => {
                    // Simple implementation for demo: Add a placeholder
                    setFormData({ ...formData, experience: [...formData.experience, "New Performance (Tap to edit)"] });
                }}
            >
                <Plus size={24} color="white" />
                <Text className="text-white font-bold ml-2 text-lg">Add Gig / Event</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep5_Gallery = () => (
        <View className="space-y-6">
            <View>
                <Text className="text-3xl font-black text-white mb-2">Gallery</Text>
                <Text className="text-gray-400 text-base">
                    Profiles with media get <Text className="text-pink-400 font-bold">3x more</Text> opportunities.
                </Text>
            </View>

            <View className="flex-row gap-4 mt-4">
                <TouchableOpacity className="flex-1 aspect-[3/4] bg-white/5 rounded-3xl border-2 border-dashed border-white/20 items-center justify-center active:bg-white/10">
                    <Camera size={40} color="#52525b" />
                    <Text className="text-gray-500 mt-4 font-bold">Upload Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 aspect-[3/4] bg-white/5 rounded-3xl border-2 border-dashed border-white/20 items-center justify-center active:bg-white/10">
                    <Play size={40} color="#52525b" />
                    <Text className="text-gray-500 mt-4 font-bold">Add Video</Text>
                </TouchableOpacity>
            </View>

            <Text className="text-white/40 text-center text-sm mt-4">
                You can upload high-res images or link videos later.
            </Text>
        </View>
    );

    return (
        <Modal animationType="slide" visible={true} presentationStyle="pageSheet">
            <SafeAreaView className="flex-1 bg-[#09090b]">
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center justify-between border-b border-white/10">
                    <TouchableOpacity onPress={handleBack} className="p-2 -ml-2 rounded-full active:bg-white/10">
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-gray-500 font-medium">Step {step + 1} of {TOTAL_STEPS}</Text>
                    <View className="w-8" />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView className="flex-1 px-6 pt-8">
                        <ProgressBar step={step} total={TOTAL_STEPS} />

                        {step === 0 && renderStep1_Basic()}
                        {step === 1 && renderStep2_Identity()}
                        {step === 2 && renderStep3_About()}
                        {step === 3 && renderStep4_Experience()}
                        {step === 4 && renderStep5_Gallery()}

                        <View className="h-32" />
                    </ScrollView>

                    {/* Fixed Footer */}
                    <View className="p-6 border-t border-white/10 bg-[#09090b]">
                        <TouchableOpacity
                            onPress={handleNext}
                            className="w-full py-5 rounded-full bg-white flex-row items-center justify-center shadow-lg shadow-purple-500/20 active:bg-gray-200"
                        >
                            <Text className="text-black font-black text-xl mr-2">
                                {step === TOTAL_STEPS - 1 ? "Complete Profile" : "Next Step"}
                            </Text>
                            {step < TOTAL_STEPS - 1 ? (
                                <ChevronRight size={24} color="black" />
                            ) : (
                                <Check size={24} color="black" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

// 4. MAIN PROFILE SCREEN (Read-Only)
export default function Profile() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const authUser = useAuthStore(state => state.user);

    // Local state for the Wizard
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStartStep, setWizardStartStep] = useState(0);

    const [profileData, setProfileData] = useState<ProfileFormData>({
        fullName: authUser?.displayName || "User",
        location: "",
        age: "",
        gender: "",
        height: "",
        skinTone: "",
        artistType: "",
        skills: [],
        bio: "",
        instagramHandle: "",
        experience: [],
        hasPhotos: false
    });


    // In the future, this could come from a route param to view other users

    // const { id } = useLocalSearchParams();

    // const isOwnProfile = !id || id === authUser?._id;

    // const user = isOwnProfile ? authUser : fetchedUser;



    const isOwnProfile = true;

    const user = authUser;



    // Placeholder Data for fields not yet in User model

    // Set some to undefined/empty to test the "missing" logic

    // Placeholder Data for stats (not part of form yet)
    const mockStats = {
        events: 47,
        connections: 234,
        rating: 4.8
    };



    if (!user) {

        return (

            <SafeAreaView className="flex-1 bg-black items-center justify-center">

                <Text className="text-white">Please login to view profile</Text>

            </SafeAreaView>

        );

    }



    const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

    const primaryRole = user.roles?.[0] || user.role || 'Member';

    const userEmail = user.email; // Email is usually present for own profile



    // --- Helper Components for Missing Data ---



    type FieldStatus = 'present' | 'missing_own' | 'missing_other';



    const getFieldStatus = (value: any): FieldStatus => {

        if (value && (Array.isArray(value) ? value.length > 0 : true)) return 'present';

        return isOwnProfile ? 'missing_own' : 'missing_other';

    };



    const openWizard = (step: number) => {
        setWizardStartStep(step);
        setIsWizardOpen(true);
    };

    const handleSaveProfile = async (newData: ProfileFormData) => {
        try {
            // Optimistic update
            setProfileData(newData);
            setIsWizardOpen(false);

            // Call API
            const apiPayload = {
                ...newData,
                displayName: newData.fullName, // Map local form field to backend expected field
                hasPhotos: undefined // Exclude local-only fields
            };
            const updatedUser = await authService.updateProfile(apiPayload);

            // Update Auth Store
            if (authUser) {
                // Merge existing user with updates
                useAuthStore.getState().setAuth({
                    user: { ...authUser, ...updatedUser },
                    accessToken: useAuthStore.getState().accessToken || ''
                });
            }
        } catch (error) {
            console.error("Failed to update profile", error);
            // Revert on error (could add more sophisticated rollback here)
            // For now just alerting the user
            alert("Failed to save changes. Please try again.");
        }
    };

    // --- Sub-components for Read-Only View ---


    const InfoItem = ({ icon: Icon, value, placeholder, label }: { icon: any, value?: string, placeholder: string, label?: string }) => {

        const status = getFieldStatus(value);



        if (status === 'missing_other') return (

            <View className="flex-row items-center gap-1.5 opacity-50">

                <Icon size={14} color="#9ca3af" />

                <Text className="text-gray-500 text-sm italic">NOT SPECIFIED</Text>

            </View>

        );



        return (

            <View className={`flex-row items-center gap-1.5 ${status === 'missing_own' ? 'opacity-70' : ''}`}>

                <Icon size={14} color={status === 'missing_own' ? '#60a5fa' : '#9ca3af'} />

                <Text className={`${status === 'missing_own' ? 'text-blue-400 italic' : 'text-gray-400'} text-sm`}>

                    {status === 'missing_own' ? placeholder : value}

                </Text>

            </View>

        );

    };



    const SectionHeader = ({ title, onAdd, showAdd }: { title: string, onAdd?: () => void, showAdd?: boolean }) => (

        <View className="flex-row items-center justify-between mb-4 ml-1">

            <Text className="text-lg font-bold text-white">{title}</Text>

            {showAdd && (

                <TouchableOpacity onPress={onAdd} className="bg-white/10 p-1.5 rounded-full">

                    <Plus size={16} color="#60a5fa" />

                </TouchableOpacity>

            )}

        </View>

    );


    // --- Helper Components for Missing Data ---

    const EmptyStateLink = ({ text, onPress, icon: Icon }: { text: string, onPress: () => void, icon?: any }) => (
        <TouchableOpacity
            onPress={onPress}
            className="flex-row items-center bg-white/5 border border-dashed border-white/20 px-4 py-3 rounded-xl active:bg-white/10"
        >
            {Icon && <Icon size={16} color="#60a5fa" className="mr-2" />}
            <Text className="text-blue-400 font-bold text-sm">{text}</Text>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#09090b]">
            {isWizardOpen && (
                <ProfileWizard
                    initialData={profileData}
                    initialStep={wizardStartStep}
                    onClose={() => setIsWizardOpen(false)}
                    onSave={handleSaveProfile}
                />
            )}
            {/* Ambient Background Glow */}
            <LinearGradient
                colors={['#4c1d95', '#09090b']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.3 }}
                className="absolute top-0 left-0 right-0 h-[500px]"
            />

            <SafeAreaView edges={['top']} className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

                    {/* --- SECTION 1: HEADER CARD --- */}
                    <View className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 overflow-hidden relative">
                        {/* Subtle inner glow */}
                        <View className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-3xl rounded-full -mr-10 -mt-10" />

                        <View className="flex-col md:flex-row gap-6 items-start">
                            {/* Avatar with Neon Ring */}
                            <View className="relative">
                                <LinearGradient
                                    colors={['#ec4899', '#8b5cf6']}
                                    className="p-[3px] rounded-full"
                                >
                                    <View className="bg-black rounded-full p-1">
                                        <Image
                                            source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                                            className="w-24 h-24 rounded-full"
                                        />
                                    </View>
                                </LinearGradient>
                                <View className="absolute bottom-0 right-0 bg-black p-1 rounded-full border border-white/10">
                                    <View className="bg-green-500 w-3 h-3 rounded-full" />
                                </View>
                            </View>

                            {/* Main Info */}
                            <View className="flex-1 space-y-3">
                                <View className="flex-row flex-wrap items-center gap-3">
                                    <Text className="text-3xl font-black text-white">
                                        {profileData.fullName || "User"}
                                    </Text>

                                    {profileData.artistType ? (
                                        <LinearGradient
                                            colors={['#db2777', '#be185d']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            className="px-3 py-1 rounded-full"
                                        >
                                            <Text className="text-white text-xs font-bold uppercase tracking-wide">
                                                {profileData.artistType}
                                            </Text>
                                        </LinearGradient>
                                    ) : (
                                        <TouchableOpacity onPress={() => openWizard(1)} className="bg-white/10 px-3 py-1 rounded-full border border-dashed border-white/30">
                                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wide">+ Add Role</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Contact Row */}
                                <View className="flex-row flex-wrap gap-4">
                                    {profileData.location ? (
                                        <View className="flex-row items-center gap-1.5">
                                            <MapPin size={14} color="#9ca3af" />
                                            <Text className="text-gray-400 text-sm">{profileData.location}</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity onPress={() => openWizard(0)} className="flex-row items-center gap-1.5">
                                            <MapPin size={14} color="#60a5fa" />
                                            <Text className="text-blue-400 text-sm italic">Add Location</Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Email/Phone - keeping hardcoded placeholders or hidden if private for now, or could use authUser data */}
                                    <View className="flex-row items-center gap-1.5">
                                        <Mail size={14} color="#9ca3af" />
                                        <Text className="text-gray-400 text-sm">{authUser?.email || "No Email"}</Text>
                                    </View>
                                </View>

                                {/* Skills */}
                                <View className="flex-row flex-wrap gap-2 mt-1">
                                    {profileData.skills.length > 0 ? (
                                        profileData.skills.map((skill) => (
                                            <View key={skill} className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                                                <Text className="text-gray-300 text-xs font-medium">{skill}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <EmptyStateLink text="Add skills to show your expertise" onPress={() => openWizard(1)} />
                                    )}
                                </View>
                            </View>

                            {/* Edit Button */}
                            <TouchableOpacity onPress={() => openWizard(0)}>
                                <LinearGradient
                                    colors={['#8b5cf6', '#6d28d9']}
                                    className="flex-row items-center gap-2 px-4 py-2 rounded-xl"
                                >
                                    <Edit3 size={16} color="white" />
                                    <Text className="text-white font-bold text-sm">Edit Profile</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Stats Row - keeping mocked for layout demo */}
                        <View className="flex-row mt-8 pt-6 border-t border-white/10 gap-12">
                            <View>
                                <Text className="text-2xl font-black text-white">{mockStats.events}</Text>
                                <Text className="text-xs text-gray-400 font-medium uppercase tracking-wider">Events</Text>
                            </View>
                            <View>
                                <Text className="text-2xl font-black text-white">{mockStats.connections}</Text>
                                <Text className="text-xs text-gray-400 font-medium uppercase tracking-wider">Connections</Text>
                            </View>
                            <View>
                                <View className="flex-row items-center gap-1">
                                    <Star size={20} color="#fbbf24" fill="#fbbf24" />
                                    <Text className="text-2xl font-black text-white">{mockStats.rating}</Text>
                                </View>
                                <Text className="text-xs text-gray-400 font-medium uppercase tracking-wider">Rating</Text>
                            </View>
                        </View>
                    </View>

                    {/* --- LAYOUT GRID --- */}
                    <View className={`flex-col ${isDesktop ? 'md:flex-row' : ''} gap-6`}>

                        {/* --- LEFT COLUMN (Sidebar) --- */}
                        <View className={`${isDesktop ? 'w-[32%]' : 'w-full'} space-y-6`}>

                            {/* About Card */}
                            <View className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <Text className="text-lg font-bold text-white mb-4">About</Text>

                                {profileData.bio ? (
                                    <Text className="text-gray-400 leading-6 mb-6">
                                        {profileData.bio}
                                    </Text>
                                ) : (
                                    <View className="mb-6">
                                        <EmptyStateLink text="Add a bio to increase your chances" onPress={() => openWizard(2)} />
                                    </View>
                                )}

                                <View className="space-y-4">
                                    <View className="flex-row justify-between border-b border-white/5 pb-2">
                                        <Text className="text-gray-500">Age</Text>
                                        <Text className="text-white font-medium">{profileData.age || <Text className="text-white/20">-</Text>}</Text>
                                    </View>
                                    <View className="flex-row justify-between border-b border-white/5 pb-2">
                                        <Text className="text-gray-500">Height</Text>
                                        <Text className="text-white font-medium">{profileData.height || <Text className="text-white/20">-</Text>}</Text>
                                    </View>
                                    <View className="flex-row justify-between border-b border-white/5 pb-2">
                                        <Text className="text-gray-500">Skin Tone</Text>
                                        <Text className="text-white font-medium">{profileData.skinTone || <Text className="text-white/20">-</Text>}</Text>
                                    </View>
                                    {(!profileData.age && !profileData.height && !profileData.skinTone) && (
                                        <EmptyStateLink text="Add details" onPress={() => openWizard(0)} />
                                    )}
                                </View>
                            </View>

                            {/* Instagram Card */}
                            {profileData.instagramHandle ? (
                                <TouchableOpacity className="bg-white/5 border border-white/10 rounded-3xl p-4 flex-row items-center gap-4 active:bg-white/10 transition-all">
                                    <LinearGradient
                                        colors={['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888']}
                                        className="w-12 h-12 rounded-full items-center justify-center"
                                    >
                                        <Instagram size={24} color="white" />
                                    </LinearGradient>
                                    <View>
                                        <Text className="text-white font-bold text-base">Instagram</Text>
                                        <Text className="text-blue-400 text-sm">@{profileData.instagramHandle}</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <EmptyStateLink text="Add Instagram to link your clips" icon={Instagram} onPress={() => openWizard(2)} />
                            )}
                        </View>


                        {/* --- RIGHT COLUMN (Content) --- */}
                        <View className={`${isDesktop ? 'flex-1' : 'w-full'} space-y-6`}>

                            {/* Gallery Section */}
                            <View>
                                <Text className="text-lg font-bold text-white mb-4 ml-1">Gallery</Text>
                                {profileData.hasPhotos ? (
                                    <View className="flex-row gap-3">
                                        {/* Item 1 */}
                                        <View className="flex-1 aspect-square bg-white/5 border border-white/10 rounded-2xl items-center justify-center relative overflow-hidden group">
                                            {/* Mock Image Gradient Overlay */}
                                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} className="absolute inset-0 z-10" />
                                            <ImageIcon size={24} color="#52525b" />
                                        </View>
                                        {/* Item 2 */}
                                        <View className="flex-1 aspect-square bg-white/5 border border-white/10 rounded-2xl items-center justify-center">
                                            <ImageIcon size={24} color="#52525b" />
                                        </View>
                                        {/* Item 3 (Video) */}
                                        <View className="flex-1 aspect-square bg-white/5 border border-white/10 rounded-2xl items-center justify-center relative">
                                            <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 backdrop-blur-sm">
                                                <Play size={16} color="white" fill="white" />
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    <EmptyStateLink text="Add photos to get 3x more views" icon={Camera} onPress={() => openWizard(4)} />
                                )}
                            </View>

                            {/* Experience Section */}
                            <View>
                                <Text className="text-lg font-bold text-white mb-4 ml-1">Experience</Text>
                                {profileData.experience.length > 0 ? (
                                    <View className="space-y-3">
                                        {profileData.experience.map((exp, i) => (
                                            <View key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-row items-center justify-between">
                                                <View className="flex-row items-center gap-4">
                                                    <View className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
                                                        <Text className="text-lg">🎭</Text>
                                                    </View>
                                                    <View>
                                                        <Text className="text-white font-bold">{exp}</Text>
                                                        <Text className="text-gray-400 text-xs mt-0.5">Verified</Text>
                                                    </View>
                                                </View>
                                                <View className="bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                                                    <Text className="text-green-400 text-xs font-bold">Attended</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <EmptyStateLink text="Add experience to build credibility" icon={Briefcase} onPress={() => openWizard(3)} />
                                )}
                            </View>

                            {/* Testimonials Section */}
                            <View>
                                <Text className="text-lg font-bold text-white mb-4 ml-1">Testimonials</Text>
                                <View className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl p-6 relative">
                                    <Quote size={48} color="rgba(255,255,255,0.05)" className="absolute top-4 right-4" />

                                    <View className="flex-row items-center gap-2 mb-3">
                                        <Text className="text-white font-bold text-base">Sarah Johnson</Text>
                                        <View className="flex-row">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} color="#fbbf24" fill="#fbbf24" />)}
                                        </View>
                                    </View>

                                    <Text className="text-gray-300 italic leading-6">
                                        "Alex is an incredible instructor with amazing energy. The workshop was both challenging and fun! Would definitely hire again."
                                    </Text>
                                </View>
                            </View>

                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}