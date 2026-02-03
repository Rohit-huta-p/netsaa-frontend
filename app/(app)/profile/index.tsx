// app/(app)/profile/index.tsx
import React, { useState, useEffect } from "react";
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
    Platform,
    StatusBar,
    Pressable,
    Alert,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import {
    MapPin, Instagram,
    Play, Star, Quote, Plus,
    ArrowLeft, User, Ruler, Palette, Briefcase, Camera, Sparkles, X,
    Edit3, Shield, Check, ArrowRight, Menu, Calendar, Zap, Users, Activity, Award,
    Share2,
    Edit2,
    Video,
    Trash2
} from "lucide-react-native";
import { useAuthStore } from "../../../src/stores/authStore";
import authService from "../../../src/services/authService";
import { uploadMediaFlow, validateMediaFile, isLargeFile } from "../../../src/utils/upload";

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
type ProfileFormData = {
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
    profileImageUrl: string;
    galleryUrls: string[];  // Up to 5 photos
    videoUrls: string[];    // Up to 3 videos
};

type UploadingState = {
    [key: string]: { progress: number; uploading: boolean; localUri?: string };
};

// --- COMPONENTS ---

// 1. Brutalist Progress Bar (KEPT FROM OLD FILE AS PER INSTRUCTIONS TO KEEP LOGIC/WIZARD)
const ProgressBar = ({ step, total }: { step: number; total: number }) => {
    const progress = Math.min(((step + 1) / total) * 100, 100);
    return (
        <View className="mb-8">
            <View className="flex-row justify-between mb-2">
                <Text className="text-pink-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                    Completion
                </Text>
                <Text className="text-white font-black italic">{Math.round(progress)}%</Text>
            </View>
            <View className="h-1 bg-white/10 w-full">
                <View
                    style={{ width: `${progress}%` }}
                    className="h-full bg-pink-500 shadow-[0_0_15px_rgba(234,105,139,0.5)]"
                />
            </View>
        </View>
    );
};

// 2. Neon Selection Pill (KEPT)
const SelectionPill = ({ label, isSelected, onPress }: { label: string, isSelected: boolean, onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        className="mr-3 mb-3"
    >
        <View
            style={{
                backgroundColor: isSelected ? 'rgba(234, 105, 139, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: isSelected ? '#ea698b' : 'rgba(255, 255, 255, 0.1)',
            }}
        >
            <Text style={{
                color: isSelected ? '#ea698b' : '#a1a1aa',
                fontWeight: '700',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 2
            }}>
                {label}
            </Text>
        </View>
    </TouchableOpacity>
);


const TextInputStyled = (props: any) => (
    <TextInput
        {...props}
        placeholderTextColor="#3f3f46"
        style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            padding: 24,
            color: '#fff',
            fontSize: 18,
            fontWeight: '500',
            ...props.style
        }}
    />
);

// 4. WIZARD (Deep Black Theme) (KEPT EXACTLY AS BEFORE)
const ProfileWizard = ({
    initialData,
    initialStep = 0,
    userId,
    onClose,
    onSave
}: {
    initialData: ProfileFormData;
    initialStep: number;
    userId: string;
    onClose: () => void;
    onSave: (data: ProfileFormData) => void;
}) => {
    const [step, setStep] = useState(initialStep);
    const [formData, setFormData] = useState<ProfileFormData>(initialData);
    const [uploadingState, setUploadingState] = useState<UploadingState>({});

    const TOTAL_STEPS = 5;

    const handleNext = () => {
        if (step < TOTAL_STEPS - 1) setStep(step + 1);
        else onSave(formData);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
        else onClose();
    };


    const renderStep1_Basic = () => (
        <View className="space-y-8">
            <View>
                <Text className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">Origins</Text>
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Define your baseline.</Text>
            </View>

            <View>
                <Text className="text-zinc-500 mb-3 font-bold uppercase tracking-widest text-[10px]">Identity</Text>
                <TextInputStyled
                    value={formData.fullName}
                    onChangeText={(t: string) => setFormData({ ...formData, fullName: t })}
                    placeholder="STAGE NAME"
                />
            </View>

            <View>
                <Text className="text-zinc-500 mb-3 font-bold uppercase tracking-widest text-[10px]">Base</Text>
                <TextInputStyled
                    value={formData.location}
                    onChangeText={(t: string) => setFormData({ ...formData, location: t })}
                    placeholder="CITY, COUNTRY"
                />
            </View>

            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text className="text-zinc-500 mb-3 font-bold uppercase tracking-widest text-[10px]">Age</Text>
                    <TextInputStyled
                        value={formData.age}
                        onChangeText={(t: string) => setFormData({ ...formData, age: t })}
                        placeholder="00"
                        keyboardType="numeric"
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-zinc-500 mb-3 font-bold uppercase tracking-widest text-[10px]">Stats</Text>
                    <TextInputStyled
                        value={formData.height}
                        onChangeText={(t: string) => setFormData({ ...formData, height: t })}
                        placeholder="HEIGHT"
                    />
                </View>
            </View>
            <View>
                <Text className="text-zinc-500 mb-3 font-bold uppercase tracking-widest text-[10px]">Skin Tone</Text>
                <TextInputStyled
                    value={formData.skinTone}
                    onChangeText={(t: string) => setFormData({ ...formData, skinTone: t })}
                    placeholder="SKIN TONE"
                />
            </View>
        </View>
    );

    const renderStep2_Identity = () => (
        <View className="space-y-8">
            <View>
                <Text className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">Craft</Text>
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Claim your discipline.</Text>
            </View>

            <View>
                <Text className="text-zinc-500 mb-4 font-bold uppercase tracking-widest text-[10px]">Primary Role</Text>
                <View className="flex-row flex-wrap">
                    {["Actor", "Dancer", "Singer", "Model", "DJ", "Musician"].map(type => (
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
                <Text className="text-zinc-500 mb-4 font-bold uppercase tracking-widest text-[10px]">Arsenal (Skills)</Text>
                <View className="flex-row flex-wrap">
                    {["Contemporary", "Kathak", "Hip Hop", "Jazz", "Classical", "Folk", "Ballet", "Salsa", "Storytelling", "Choreography"].map(skill => (
                        <SelectionPill
                            key={skill}
                            label={skill}
                            isSelected={formData.skills.includes(skill)}
                            onPress={() => {
                                const newSkills = formData.skills.includes(skill)
                                    ? formData.skills.filter(s => s !== skill)
                                    : [...formData.skills, skill];
                                setFormData({ ...formData, skills: newSkills });
                            }}
                        />
                    ))}
                </View>
            </View>
        </View>
    );

    const renderStep3_About = () => (
        <View className="space-y-8">
            <View>
                <Text className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">Manifesto</Text>
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Your story, your words.</Text>
            </View>

            <View>
                <TextInputStyled
                    value={formData.bio}
                    onChangeText={(t: string) => setFormData({ ...formData, bio: t })}
                    placeholder="TELL THEM WHO YOU ARE..."
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    style={{ minHeight: 200, fontSize: 16, lineHeight: 24 }}
                />
            </View>

            <View>
                <Text className="text-zinc-500 mb-3 font-bold uppercase tracking-widest text-[10px]">Social Link</Text>
                <TextInputStyled
                    value={formData.instagramHandle}
                    onChangeText={(t: string) => setFormData({ ...formData, instagramHandle: t })}
                    placeholder="@USERNAME"
                />
            </View>
        </View>
    );

    const renderStep4_Experience = () => (
        <View className="space-y-8">
            <View>
                <Text className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">Legacy</Text>
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Where have you performed?</Text>
            </View>

            <View className="space-y-3">
                {formData.experience.map((exp, i) => (
                    <View key={i} className="flex-row items-center justify-between p-6 bg-white/5 border border-white/10">
                        <Text className="text-white font-bold text-lg uppercase tracking-wide flex-1">{exp}</Text>
                        <TouchableOpacity onPress={() => {
                            const newExp = formData.experience.filter((_, idx) => idx !== i);
                            setFormData({ ...formData, experience: newExp });
                        }}>
                            <X size={20} color="#71717a" />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity
                    onPress={() => {
                        const newExp = [...formData.experience, `EVENT ${formData.experience.length + 1}`];
                        setFormData({ ...formData, experience: newExp });
                    }}
                    className="p-6 border border-dashed border-white/20 items-center justify-center active:bg-white/5"
                >
                    <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">+ ADD PERFORMANCE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep5_Gallery = () => {

        const handlePickMedia = async (type: 'profile' | 'gallery' | 'video', index?: number) => {
            const mediaType = type === 'video'
                ? ImagePicker.MediaTypeOptions.Videos
                : ImagePicker.MediaTypeOptions.Images;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: mediaType,
                allowsEditing: type === 'profile',
                aspect: type === 'profile' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            const isVideo = type === 'video';

            // Validate file
            const validation = validateMediaFile(asset, isVideo);
            if (!validation.valid) {
                Alert.alert('Error', validation.error);
                return;
            }

            // Warn for large files
            if (isLargeFile(asset)) {
                Alert.alert(
                    'Large File',
                    'This file is large and may take a while to upload. Continue?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Continue', onPress: () => performUpload(type, asset, index) }
                    ]
                );
                return;
            }

            performUpload(type, asset, index);
        };

        const performUpload = async (
            type: 'profile' | 'gallery' | 'video',
            asset: ImagePicker.ImagePickerAsset,
            index?: number
        ) => {
            const uploadKey = type === 'profile' ? 'profile' : `${type}-${index}`;

            // Show local preview immediately
            setUploadingState(prev => ({
                ...prev,
                [uploadKey]: { progress: 0, uploading: true, localUri: asset.uri }
            }));

            const purpose = type === 'profile'
                ? 'avatar' as const
                : type === 'video'
                    ? 'portfolio' as const
                    : 'gallery' as const;

            const result = await uploadMediaFlow({
                asset,
                entityType: 'user',
                entityId: userId,
                purpose,
                onProgress: (progress) => {
                    setUploadingState(prev => ({
                        ...prev,
                        [uploadKey]: { ...prev[uploadKey], progress, uploading: true }
                    }));
                }
            });

            setUploadingState(prev => ({
                ...prev,
                [uploadKey]: { ...prev[uploadKey], progress: 100, uploading: false }
            }));

            if (result.success && result.url) {
                if (type === 'profile') {
                    setFormData(prev => ({ ...prev, profileImageUrl: result.url! }));
                } else if (type === 'gallery' && index !== undefined) {
                    setFormData(prev => {
                        const newUrls = [...prev.galleryUrls];
                        newUrls[index] = result.url!;
                        return { ...prev, galleryUrls: newUrls, hasPhotos: true };
                    });
                } else if (type === 'video' && index !== undefined) {
                    setFormData(prev => {
                        const newUrls = [...prev.videoUrls];
                        newUrls[index] = result.url!;
                        return { ...prev, videoUrls: newUrls };
                    });
                }
            } else {
                Alert.alert('Upload Failed', result.error || 'Unknown error');
            }
        };

        const removeMedia = (type: 'gallery' | 'video', index: number) => {
            if (type === 'gallery') {
                setFormData(prev => {
                    const newUrls = [...prev.galleryUrls];
                    newUrls[index] = '';
                    return { ...prev, galleryUrls: newUrls };
                });
            } else {
                setFormData(prev => {
                    const newUrls = [...prev.videoUrls];
                    newUrls[index] = '';
                    return { ...prev, videoUrls: newUrls };
                });
            }
        };

        const renderUploadSlot = (
            type: 'gallery' | 'video',
            index: number,
            url: string,
            aspectRatio: string = 'aspect-square'
        ) => {
            const uploadKey = `${type}-${index}`;
            const state = uploadingState[uploadKey];
            const isUploading = state?.uploading;

            return (
                <View key={`${type}-${index}`} className={`${aspectRatio} bg-white/5 border border-white/10 rounded-xl overflow-hidden relative`}>
                    {url ? (
                        <>
                            {type === 'video' ? (
                                Platform.OS === 'web' ? (
                                    <video
                                        src={url}
                                        controls
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => console.error('[Video] Playback error:', e)}
                                        onLoadedData={() => console.log('[Video] Loaded successfully')}
                                        className="cursor-pointer"
                                    />
                                ) : (
                                    <ExpoVideo
                                        source={{ uri: url }}
                                        style={{ width: '100%', height: '100%' }}
                                        useNativeControls
                                        resizeMode={ResizeMode.COVER}
                                        shouldPlay={false}
                                        isLooping={false}
                                        onError={(error) => console.error('[Video] Playback error:', error)}
                                        onLoad={() => console.log('[Video] Loaded successfully')}
                                    />
                                )
                            ) : (
                                <Image source={{ uri: url }} className="w-full h-full" />
                            )}
                            <TouchableOpacity
                                onPress={() => removeMedia(type, index)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                            >
                                <Trash2 size={14} color="#ef4444" />
                            </TouchableOpacity>
                        </>
                    ) : state?.localUri && type !== 'video' ? (
                        <View className="w-full h-full relative">
                            <Image source={{ uri: state.localUri }} className="w-full h-full" />
                            {isUploading && (
                                <View className="absolute inset-0 items-center justify-center bg-black/40">
                                    <ActivityIndicator size="small" color="#ea698b" />
                                    <Text className="text-white text-[10px] mt-2">{state?.progress || 0}%</Text>
                                </View>
                            )}
                        </View>
                    ) : isUploading ? (
                        <View className="w-full h-full items-center justify-center bg-black/40">
                            <ActivityIndicator size="small" color="#ea698b" />
                            <Text className="text-white text-[10px] mt-2">{state?.progress || 0}%</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handlePickMedia(type, index)}
                            className="w-full h-full items-center justify-center"
                        >
                            {type === 'video' ? (
                                <Video size={24} color="#3f3f46" />
                            ) : (
                                <Plus size={24} color="#3f3f46" />
                            )}
                            <Text className="text-zinc-600 text-[10px] mt-2 uppercase tracking-widest">
                                {type === 'video' ? 'Add Video' : 'Add Photo'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        };

        const profileState = uploadingState['profile'];

        return (
            <View className="space-y-8">
                <View>
                    <Text className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">Visuals</Text>
                    <Text className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Showcase your talent.</Text>
                </View>

                {/* Profile Image */}
                <View>
                    <Text className="text-zinc-500 mb-4 font-bold uppercase tracking-widest text-[10px]">Profile Photo</Text>
                    <TouchableOpacity
                        onPress={() => handlePickMedia('profile')}
                        className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 items-center justify-center"
                        disabled={profileState?.uploading}
                    >
                        {formData.profileImageUrl ? (
                            <Image source={{ uri: formData.profileImageUrl }} className="w-full h-full" />
                        ) : profileState?.localUri ? (
                            <View className="w-full h-full relative">
                                <Image source={{ uri: profileState.localUri }} className="w-full h-full" />
                                {profileState?.uploading && (
                                    <View className="absolute inset-0 items-center justify-center bg-black/40">
                                        <ActivityIndicator size="small" color="#ea698b" />
                                        <Text className="text-white text-[10px] mt-2">{profileState?.progress || 0}%</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="items-center">
                                <Camera size={32} color="#3f3f46" />
                                <Text className="text-zinc-600 text-[10px] mt-2 uppercase">Upload</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Photo Gallery - 5 slots */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Photo Gallery</Text>
                        <Text className="text-zinc-600 text-[10px]">{formData.galleryUrls.filter(u => u).length}/5</Text>
                    </View>
                    <View className="flex-row flex-wrap gap-3">
                        {[0, 1, 2, 3, 4].map(i => (
                            <View key={i} className="w-[30%]">
                                {renderUploadSlot('gallery', i, formData.galleryUrls[i] || '', 'aspect-square')}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Video Reels - 3 slots */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Video Reels</Text>
                        <Text className="text-zinc-600 text-[10px]">{formData.videoUrls.filter(u => u).length}/3</Text>
                    </View>
                    <View className="flex-row gap-3">
                        {[0, 1, 2].map(i => (
                            <View key={i} className="flex-1">
                                {renderUploadSlot('video', i, formData.videoUrls[i] || '', 'aspect-[9/16]')}
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    const stepRenderers = [
        renderStep1_Basic,
        renderStep2_Identity,
        renderStep3_About,
        renderStep4_Experience,
        renderStep5_Gallery
    ];

    return (
        <Modal visible animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-black">
                <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        className="flex-1"
                    >
                        {/* Header */}
                        <View className="px-6 py-6 border-b border-white/10 flex-row items-center justify-between">
                            <TouchableOpacity onPress={handleBack}>
                                <ArrowLeft size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <ScrollView className="flex-1 px-6 py-8" contentContainerStyle={{ paddingBottom: 100 }}>
                            <ProgressBar step={step} total={TOTAL_STEPS} />
                            {stepRenderers[step]()}
                        </ScrollView>

                        {/* Footer */}
                        <View className="px-6 py-6 border-t border-white/10 bg-black">
                            <TouchableOpacity
                                onPress={handleNext}
                                className="w-full py-5 bg-white items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                <Text className="text-black font-black text-lg uppercase italic tracking-tighter">
                                    {step === TOTAL_STEPS - 1 ? "PUBLISH PROFILE" : "NEXT STEP"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </Modal>
    );
};


// --- HELPER COMPONENT: Replicating Navbar from Design ---
const Navbar = () => {
    // Simplified RN version of the Navbar component in profile-v2
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

            {/* Desktop Menu - Hidden on Mobile, showed simplified if desktop */}
            {/* Note: RN doesn't handle hidden md:flex automatically without NativeWind config, but assuming standard breakpoints work or just simplified for mobile */}
            <View className="flex-row items-center gap-4">
                {/* Keeping it simple for mobile view mostly as RN is primarily mobile */}
                <TouchableOpacity>
                    <Menu size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- MAIN PAGE ---

export default function ProfilePage() {
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [wizardVisible, setWizardVisible] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);

    const profileData: ProfileFormData = {
        fullName: user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
        location: user?.location || "",
        age: user?.age || "",
        gender: user?.gender || "",
        height: user?.height || "",
        skinTone: user?.skinTone || "",
        artistType: user?.artistType || "",
        skills: user?.skills || [],
        bio: user?.bio || "",
        instagramHandle: user?.instagramHandle || "",
        experience: user?.experience || [],
        hasPhotos: user?.hasPhotos || false,
        profileImageUrl: user?.profileImageUrl || "",
        galleryUrls: [...(user?.galleryUrls || []), '', '', '', '', ''].slice(0, 5),
        videoUrls: [...(user?.videoUrls || []), '', '', ''].slice(0, 3)
    };

    const mockStats = { events: 47, connections: 234, rating: 4.9 };

    const openWizard = (step: number = 0) => {
        setWizardStep(step);
        setWizardVisible(true);
    };

    const handleSaveProfile = async (data: ProfileFormData) => {
        try {
            const updatePayload = {
                displayName: data.fullName,
                location: data.location,
                age: data.age,
                gender: data.gender,
                height: data.height,
                skinTone: data.skinTone,
                artistType: data.artistType,
                skills: data.skills,
                bio: data.bio,
                instagramHandle: data.instagramHandle,
                experience: data.experience,
                hasPhotos: data.hasPhotos,
                profileImageUrl: data.profileImageUrl,
                galleryUrls: data.galleryUrls.filter(url => url), // Only non-empty URLs
                videoUrls: data.videoUrls.filter(url => url)      // Only non-empty URLs
            };
            console.log('[Profile] Saving with payload:', JSON.stringify(updatePayload, null, 2));
            const updatedUser = await authService.updateProfile(updatePayload);
            console.log('[Profile] Backend returned:', JSON.stringify(updatedUser, null, 2));
            if (user) {
                const mergedUser = { ...user, ...updatedUser };
                console.log('[Profile] Merged user:', JSON.stringify(mergedUser, null, 2));
                useAuthStore.getState().setAuth({
                    user: mergedUser,
                    accessToken: useAuthStore.getState().accessToken || ''
                });
            }
            setWizardVisible(false);
        } catch (error) {
            console.error("Failed to save profile", error);
        }
    };

    // --- RENDER (Matched to profile-v2.tsx) ---
    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* Fixed Navbar simulation inside the simplified standard layout */}
                {/* <Navbar /> */}

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120, width: '80%', marginLeft: '10%', marginRight: '10%' }}>

                    {/* Header Section */}
                    <View className=" pt-12 pb-8 border-b  px-6 py-10 ">
                        <View className={`flex-col relative  ${isDesktop ? 'md:flex-row ' : ''} items-start gap-10 bg-zinc-900/80 rounded-2xl py-6 px-4`}>
                            {/* Avatar */}
                            <View className="relative">
                                <View className="w-32 h-32 md:w-44 md:h-44 rounded-2xl overflow-hidden border border-white/10 relative">
                                    <Image
                                        source={{ uri: user?.profileImageUrl || 'https://i.pravatar.cc/800?u=me' }}
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
                            <View className={`flex-row absolute right-5 top-4 gap-2 ${isDesktop ? 'w-auto' : ''}`}>
                                <TouchableOpacity
                                    className=" h-12 w-12 rounded-lg items-center justify-center "
                                >
                                    {/* <Text className="text-white font-black italic text-sm uppercase">Share Profile</Text> */}
                                    <Share2 size={16} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => openWizard(0)}
                                    className="  px-3 rounded-lg items-center justify-center"
                                >
                                    {/* <Text className="text-black font-black italic text-sm uppercase">Edit Profile</Text> */}
                                    <Edit3 size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Main Layout Grid */}
                    <View className="px-6 ">
                        <View className={`flex-col ${isDesktop ? 'md:flex-row' : ''} gap-16`}>

                            {/* SIDEBAR */}
                            <View className={`${isDesktop ? 'w-[300px]' : 'w-full'} space-y-12`}>
                                {/* Manifesto */}
                                <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
                                    <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Manifesto</Text>
                                    <Text className="text-zinc-400 leading-6 font-medium italic pl-6 border-l-2 border-zinc-800">
                                        "{profileData.bio || "No manifesto yet."}"
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
                                <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
                                    <Text className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">Socials</Text>
                                    <View className="flex-row items-center gap-4">
                                        <TouchableOpacity className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5">
                                            <Instagram size={18} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity className="w-10 h-10 rounded-xl bg-white/5 items-center justify-center border border-white/5">
                                            <Briefcase size={18} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* MAIN CONTENT */}
                            <View className="flex-1 space-y-20">

                                {/* Showcase */}
                                <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
                                    <View className="flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
                                        <Text className="text-2xl font-black text-white italic tracking-tight">FEATURED WORKS</Text>
                                        <TouchableOpacity onPress={() => openWizard(4)}>
                                            <Text className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Edit</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View className="space-y-8">
                                        {/* Photo Gallery - Always 5 slots */}
                                        <View>
                                            <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                                Photos ({profileData.galleryUrls.filter(u => u).length}/5)
                                            </Text>
                                            <View className="flex-row flex-wrap gap-3">
                                                {[0, 1, 2, 3, 4].map((index) => {
                                                    const url = profileData.galleryUrls[index];
                                                    return (
                                                        <TouchableOpacity
                                                            key={index}
                                                            onPress={() => openWizard(4)}
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

                                        {/* Video Reels - Always 3 slots */}
                                        <View>
                                            <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                                Video Reels ({profileData.videoUrls.filter(u => u).length}/3)
                                            </Text>
                                            <View className="flex-row gap-3">
                                                {[0, 1, 2].map((index) => {
                                                    const url = profileData.videoUrls[index];
                                                    return (
                                                        <TouchableOpacity
                                                            key={index}
                                                            onPress={() => !url && openWizard(4)}
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
                                </View>

                                {/* Professional History */}
                                <View className="bg-zinc-900/60 rounded-2xl py-6 px-6">
                                    <View className="flex-row items-center justify-between mb-8 border-b border-white/5 pb-4">
                                        <Text className="text-2xl font-black text-white italic tracking-tight">PROFESSIONAL HISTORY</Text>
                                        <Award size={20} color="#52525b" />
                                    </View>
                                    <View className="space-y-6">
                                        {profileData.experience.length > 0 ? profileData.experience.map((exp, i) => (
                                            <View key={i} className="flex-row items-center justify-between py-6 border-b border-white/5">
                                                <View className="flex-row items-center gap-6">
                                                    <Text className="text-[10px] font-black text-zinc-600">0{i + 1}</Text>
                                                    <View className="flex-col">
                                                        <Text className="text-lg font-bold text-white">{exp}</Text>
                                                        <Text className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-1">Event • 2026</Text>
                                                    </View>
                                                </View>
                                                <Text className="text-xs font-black text-zinc-500 italic">Jan 2026</Text>
                                            </View>
                                        )) : (
                                            <TouchableOpacity onPress={() => openWizard(3)} className="py-8 border border-dashed border-white/10 items-center justify-center">
                                                <Text className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Add Experience</Text>
                                            </TouchableOpacity>
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
                                            "Rahul's ability to blend traditional nuances with modern athleticism is unparalleled in the Delhi scene today."
                                        </Text>
                                        <View className="flex-row items-center gap-4 border-t border-white/5 pt-8">
                                            <View className="w-10 h-10 rounded-full bg-zinc-800" />
                                            <View>
                                                <Text className="text-sm text-white font-black uppercase italic">Aditi Rao</Text>
                                                <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Director • Piano Man Delhi</Text>
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

                {/* WIZARD MODAL */}
                {wizardVisible && (
                    <ProfileWizard
                        initialData={profileData}
                        initialStep={wizardStep}
                        userId={(user as any)?._id || (user as any)?.id || ''}
                        onClose={() => setWizardVisible(false)}
                        onSave={handleSaveProfile}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}