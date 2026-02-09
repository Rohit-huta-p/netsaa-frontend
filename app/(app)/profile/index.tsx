// app/(app)/profile/index.tsx
import React, { useState } from "react";

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
    Alert,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import {
    Plus, ArrowLeft, Camera, X, Video, Trash2
} from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import authService from "@/services/authService";
import { uploadMediaFlow, validateMediaFile, isLargeFile } from "@/utils/upload";

import {
    ProfileHeader,
    ProfileSidebar,
    FeaturedWorks,
    ProfessionalHistory,
    Testimonials,
    ProfileFooter,
    ProfileData,
    ProfileStats,
} from "@/components/profile";

import { ShareBottomSheet } from "@/components/common/ShareBottomSheet";

// Tab bar height for dynamic padding
import { useMobileTabBarHeight } from "@/components/MobileTabBar";

// --- TYPES ---
type ProfileFormData = ProfileData & {
    galleryUrls: string[];
    videoUrls: string[];
};

type UploadingState = {
    [key: string]: { progress: number; uploading: boolean; localUri?: string };
};

// --- WIZARD COMPONENTS ---

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

const SelectionPill = ({ label, isSelected, onPress }: { label: string, isSelected: boolean, onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="mr-3 mb-3">
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
            outline: 'none',
            ...props.style
        }}
    />
);

// --- PROFILE WIZARD ---
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

            const validation = validateMediaFile(asset, isVideo);
            if (!validation.valid) {
                Alert.alert('Error', validation.error);
                return;
            }

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
                                    />
                                ) : (
                                    <ExpoVideo
                                        source={{ uri: url }}
                                        style={{ width: '100%', height: '100%' }}
                                        useNativeControls
                                        resizeMode={ResizeMode.COVER}
                                        shouldPlay={false}
                                        isLooping={false}
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

// --- MAIN PAGE ---

export default function ProfilePage() {
    const { user } = useAuthStore();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [wizardVisible, setWizardVisible] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [shareSheetVisible, setShareSheetVisible] = useState(false);
    const tabBarHeight = useMobileTabBarHeight();

    const profileData: ProfileFormData = {
        fullName: user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
        location: (user as any)?.location || "",
        age: (user as any)?.age || "",
        gender: (user as any)?.gender || "",
        height: (user as any)?.height || "",
        skinTone: (user as any)?.skinTone || "",
        artistType: (user as any)?.artistType || "",
        skills: (user as any)?.skills || [],
        bio: (user as any)?.bio || "",
        instagramHandle: (user as any)?.instagramHandle || "",
        experience: (user as any)?.experience || [],
        hasPhotos: (user as any)?.hasPhotos || false,
        profileImageUrl: user?.profileImageUrl || "",
        galleryUrls: [...((user as any)?.galleryUrls || []), '', '', '', '', ''].slice(0, 5),
        videoUrls: [...((user as any)?.videoUrls || []), '', '', ''].slice(0, 3)
    };

    const stats: ProfileStats = {
        connections: 234,
        events: 47,
        rating: 4.9
    };

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
                galleryUrls: data.galleryUrls.filter(url => url),
                videoUrls: data.videoUrls.filter(url => url)
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

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            <SafeAreaView className="flex-1" edges={['top']}>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: tabBarHeight > 0 ? tabBarHeight + 60 : 120, width: '80%', marginLeft: '10%', marginRight: '10%' }}>

                    {/* Header Section */}
                    <ProfileHeader
                        fullName={profileData.fullName}
                        artistType={profileData.artistType}
                        location={profileData.location}
                        profileImageUrl={profileData.profileImageUrl}
                        stats={stats}
                        isDesktop={isDesktop}
                        isEditable={true}
                        onEditPress={() => openWizard(0)}
                        onSharePress={() => setShareSheetVisible(true)}
                    />

                    {/* Main Layout Grid */}
                    <View className="px-6">
                        <View className={`flex-col ${isDesktop ? 'md:flex-row' : ''} gap-16`}>

                            {/* SIDEBAR */}
                            <ProfileSidebar
                                profileData={profileData}
                                isDesktop={isDesktop}
                                isEditable={true}
                                onEditPress={openWizard}
                            />

                            {/* MAIN CONTENT */}
                            <View className="flex-1 space-y-20">
                                {/* Featured Works */}
                                <FeaturedWorks
                                    galleryUrls={profileData.galleryUrls || []}
                                    videoUrls={profileData.videoUrls || []}
                                    hasPhotos={profileData.hasPhotos}
                                    isDesktop={isDesktop}
                                    isEditable={true}
                                    onEditPress={() => openWizard(4)}
                                />

                                {/* Professional History */}
                                <ProfessionalHistory
                                    experience={profileData.experience}
                                    isEditable={true}
                                    onEditPress={() => openWizard(3)}
                                />

                                {/* Testimonials */}
                                <Testimonials
                                    testimonial={{
                                        text: "Rahul's ability to blend traditional nuances with modern athleticism is unparalleled in the Delhi scene today.",
                                        author: "Aditi Rao",
                                        role: "Director • Piano Man Delhi"
                                    }}
                                />
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer */}
                <ProfileFooter />

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

                {/* Share Bottom Sheet */}
                <ShareBottomSheet
                    visible={shareSheetVisible}
                    onClose={() => setShareSheetVisible(false)}
                    type="profile"
                    data={user}
                />
            </SafeAreaView>
        </View>
    );
}