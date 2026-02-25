// src/components/profile/sheets/MediaPickerBottomSheet.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    Image,
    Platform,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { X, Plus, Trash2, Camera, Video } from "lucide-react-native";
import { uploadMediaFlow, validateMediaFile, isLargeFile } from "@/utils/upload";
import { useProfileUiStore } from "@/stores/profileUiStore";
import { useAuthStore } from "@/stores/authStore";
import authService from "@/services/authService";

interface MediaPickerBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    profileImageUrl: string;
    galleryUrls: string[];
    videoUrls: string[];
    userId: string;
}

type UploadingState = {
    [key: string]: { progress: number; uploading: boolean; localUri?: string };
};

export const MediaPickerBottomSheet: React.FC<MediaPickerBottomSheetProps> = ({
    visible,
    onClose,
    profileImageUrl: initialProfileImage,
    galleryUrls: initialGallery,
    videoUrls: initialVideos,
    userId,
}) => {
    const [profileImageUrl, setProfileImageUrl] = useState(initialProfileImage);
    const [galleryUrls, setGalleryUrls] = useState<string[]>(
        [...initialGallery, '', '', '', '', ''].slice(0, 5)
    );
    const [videoUrls, setVideoUrls] = useState<string[]>(
        [...initialVideos, '', '', ''].slice(0, 3)
    );
    const [uploadingState, setUploadingState] = useState<UploadingState>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setSaving, setSectionError, clearSectionDraft } = useProfileUiStore();

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
                setProfileImageUrl(result.url);
            } else if (type === 'gallery' && index !== undefined) {
                setGalleryUrls(prev => {
                    const arr = [...prev];
                    arr[index] = result.url!;
                    return arr;
                });
            } else if (type === 'video' && index !== undefined) {
                setVideoUrls(prev => {
                    const arr = [...prev];
                    arr[index] = result.url!;
                    return arr;
                });
            }
        } else {
            Alert.alert('Upload Failed', result.error || 'Unknown error');
        }
    };

    const removeMedia = (type: 'gallery' | 'video', index: number) => {
        if (type === 'gallery') {
            setGalleryUrls(prev => {
                const arr = [...prev];
                arr[index] = '';
                return arr;
            });
        } else {
            setVideoUrls(prev => {
                const arr = [...prev];
                arr[index] = '';
                return arr;
            });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaving('media');
        setError(null);
        try {
            const payload = {
                profileImageUrl,
                galleryUrls: galleryUrls.filter(u => u),
                videoUrls: videoUrls.filter(u => u),
                hasPhotos: galleryUrls.some(u => u) || !!profileImageUrl,
            };
            const updatedUser = await authService.updateProfile(payload);
            const user = useAuthStore.getState().user;
            if (user) {
                useAuthStore.getState().setAuth({
                    user: { ...user, ...updatedUser },
                    accessToken: useAuthStore.getState().accessToken || '',
                });
            }
            clearSectionDraft('media');
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to save media';
            setError(msg);
            setSectionError('media', msg);
        } finally {
            setIsSaving(false);
            setSaving(null);
        }
    };

    const handleCancel = () => {
        setProfileImageUrl(initialProfileImage);
        setGalleryUrls([...initialGallery, '', '', '', '', ''].slice(0, 5));
        setVideoUrls([...initialVideos, '', '', ''].slice(0, 3));
        setError(null);
        onClose();
    };

    const renderSlot = (type: 'gallery' | 'video', index: number, url: string) => {
        const uploadKey = `${type}-${index}`;
        const state = uploadingState[uploadKey];
        const isUploading = state?.uploading;
        const isVideoType = type === 'video';

        return (
            <View key={`${type}-${index}`} className={`${isVideoType ? 'aspect-[9/16]' : 'aspect-square'} bg-white/5 border border-white/10 rounded-xl overflow-hidden relative`}>
                {url ? (
                    <>
                        {isVideoType ? (
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
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
                        >
                            <Trash2 size={12} color="#ef4444" />
                        </TouchableOpacity>
                    </>
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
                        {isVideoType ? <Video size={20} color="#3f3f46" /> : <Plus size={20} color="#3f3f46" />}
                        <Text className="text-zinc-600 text-[9px] mt-1 uppercase tracking-widest">
                            {isVideoType ? 'Add Video' : 'Add Photo'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const profileState = uploadingState['profile'];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-black">
                <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
                    {/* Header */}
                    <View className="px-6 py-5 border-b border-white/10 flex-row items-center justify-between">
                        <View>
                            <Text className="text-white font-black text-xl uppercase italic tracking-tight">Media</Text>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Showcase your talent</Text>
                        </View>
                        <TouchableOpacity onPress={handleCancel} className="p-2">
                            <X size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 120 }}>
                        {/* Profile Image */}
                        <View className="mb-8">
                            <Text className="text-zinc-500 mb-4 font-bold uppercase tracking-widest text-[10px]">Profile Photo</Text>
                            <TouchableOpacity
                                onPress={() => handlePickMedia('profile')}
                                className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 items-center justify-center"
                                disabled={profileState?.uploading}
                            >
                                {profileImageUrl ? (
                                    <Image source={{ uri: profileImageUrl }} className="w-full h-full" />
                                ) : profileState?.uploading ? (
                                    <View className="items-center">
                                        <ActivityIndicator size="small" color="#ea698b" />
                                        <Text className="text-white text-[10px] mt-1">{profileState?.progress || 0}%</Text>
                                    </View>
                                ) : (
                                    <View className="items-center">
                                        <Camera size={28} color="#3f3f46" />
                                        <Text className="text-zinc-600 text-[9px] mt-1 uppercase">Upload</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Photo Gallery */}
                        <View className="mb-8">
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Photo Gallery</Text>
                                <Text className="text-zinc-600 text-[10px]">{galleryUrls.filter(u => u).length}/5</Text>
                            </View>
                            <View className="flex-row flex-wrap gap-3">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <View key={i} className="w-[30%]">
                                        {renderSlot('gallery', i, galleryUrls[i] || '')}
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Video Reels */}
                        <View>
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Video Reels</Text>
                                <Text className="text-zinc-600 text-[10px]">{videoUrls.filter(u => u).length}/3</Text>
                            </View>
                            <View className="flex-row gap-3">
                                {[0, 1, 2].map(i => (
                                    <View key={i} className="flex-1">
                                        {renderSlot('video', i, videoUrls[i] || '')}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Error */}
                    {error && (
                        <View className="mx-6 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <Text className="text-red-400 text-xs font-bold">{error}</Text>
                        </View>
                    )}

                    {/* Footer */}
                    <View className="px-6 py-5 border-t border-white/10 bg-black flex-row gap-3">
                        <TouchableOpacity
                            onPress={handleCancel}
                            className="flex-1 py-4 border border-white/10 rounded-xl items-center justify-center"
                        >
                            <Text className="text-white font-bold uppercase tracking-widest text-xs">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-4 bg-white rounded-xl items-center justify-center"
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Text className="text-black font-black uppercase tracking-tighter text-sm italic">Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default MediaPickerBottomSheet;
