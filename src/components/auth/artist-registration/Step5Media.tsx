import React from 'react';
import {
    View, Text, TouchableOpacity, Image, Alert,
    ActivityIndicator, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Plus, X, Image as ImageIcon, Play, User } from 'lucide-react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { StepHeader, RK, RK_FONT, useAccent } from '@/components/auth/register-kit';

const MIN_PHOTOS = 2;
const FRAME_SIZE = 84;
const MAX_VIDEOS = 2;

interface Props {
    photos: ImagePickerAsset[];
    setPhotos: (p: ImagePickerAsset[]) => void;
    avatar?: ImagePickerAsset | null;
    setAvatar?: (a: ImagePickerAsset | null) => void;
    videoAssets?: ImagePickerAsset[];
    setVideoAssets?: (v: ImagePickerAsset[]) => void;
    uploading?: boolean;
    onSkip?: () => void;
    totalSteps?: number;
}

export function Step5Media({
    photos,
    setPhotos,
    avatar = null,
    setAvatar,
    videoAssets = [],
    setVideoAssets,
    uploading = false,
    totalSteps = 5,
}: Props) {
    const accent = useAccent();

    const pickPhoto = async (idx: number) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo access to add portfolio images.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.85,
            aspect: [1, 1],
        });
        if (result.canceled || !result.assets?.[0]) return;
        const next = [...photos];
        next[idx] = result.assets[0];
        setPhotos(next.filter(Boolean));
    };

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo access to add a profile photo.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.9,
            aspect: [1, 1],
        });
        if (result.canceled || !result.assets?.[0]) return;
        setAvatar?.(result.assets[0]);
    };

    const removePhoto = (idx: number) => setPhotos(photos.filter((_, i) => i !== idx));

    const pickVideo = async (idx: number) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow media access to add a performance video.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 0.8,
            videoMaxDuration: 90,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const next = [...videoAssets];
        next[idx] = result.assets[0];
        setVideoAssets?.(next.filter(Boolean));
    };

    const removeVideo = (idx: number) => setVideoAssets?.(videoAssets.filter((_, i) => i !== idx));

    const filled = photos.length;
    const meetsMin = filled >= MIN_PHOTOS;

    // Render frames: filled slots, then required placeholders, then one add button, then a dim optional slot
    const frames: Array<'filled' | 'required' | 'add' | 'optional'> = [];
    for (let i = 0; i < filled; i++) frames.push('filled');
    for (let i = filled; i < MIN_PHOTOS; i++) frames.push('required');
    frames.push('add');
    if (frames.length < 5) frames.push('optional');

    return (
        <View>
            <StepHeader
                eyebrow={`STEP 5 OF ${totalSteps}`}
                title="Show your art"
                sub="Your portfolio is how hirers find you."
            />

            {/* ── Avatar ring ── */}
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{
                    width: 72, height: 72, borderRadius: 36,
                    borderWidth: 1.5, borderColor: RK.hair2, borderStyle: 'dashed',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <View style={{
                        width: 56, height: 56, borderRadius: 28, backgroundColor: RK.surface2,
                        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    }}>
                        {avatar
                            ? <Image source={{ uri: avatar.uri }} style={{ width: 56, height: 56 }} />
                            : <User size={22} color={RK.dim} strokeWidth={1.5} />}
                    </View>

                    <View style={{
                        position: 'absolute', bottom: -9, left: '50%', transform: [{ translateX: -24 }],
                        backgroundColor: RK.surface2, borderWidth: 1, borderColor: RK.hair, borderRadius: 20,
                        paddingHorizontal: 7, paddingVertical: 2,
                    }}>
                        <Text style={{ fontFamily: RK_FONT.mono, fontSize: 7, color: RK.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
                            Optional
                        </Text>
                    </View>
                </View>
                <Text style={{ fontFamily: RK_FONT.body, fontSize: 11, color: RK.muted, marginTop: 16 }}>
                    Tap to add profile photo
                </Text>
            </TouchableOpacity>

            {/* ── Photos ── */}
            <View style={{ marginBottom: 16 }}>
                <View style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: RK.hair, marginBottom: 10,
                }}>
                    <Text style={{ fontFamily: RK_FONT.med, fontSize: 12, color: RK.cream2 }}>Photos</Text>
                    <Text style={{
                        fontFamily: RK_FONT.mono, fontSize: 8,
                        color: meetsMin ? RK.muted : accent.border,
                        letterSpacing: 0.5, textTransform: 'uppercase',
                    }}>
                        {meetsMin ? `${filled} added` : `${MIN_PHOTOS} required · ${filled} added`}
                    </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        {frames.map((type, idx) => {
                            if (type === 'filled') {
                                return (
                                    <View key={idx} style={{ position: 'relative' }}>
                                        <TouchableOpacity
                                            onPress={() => !uploading && pickPhoto(idx)}
                                            activeOpacity={0.85}
                                            style={{
                                                width: FRAME_SIZE, height: FRAME_SIZE, borderRadius: 10,
                                                overflow: 'hidden', borderWidth: 1, borderColor: accent.border,
                                            }}
                                        >
                                            <Image source={{ uri: photos[idx]?.uri }} style={{ width: FRAME_SIZE, height: FRAME_SIZE }} resizeMode="cover" />
                                            {uploading && (
                                                <View style={{
                                                    position: 'absolute', inset: 0, width: FRAME_SIZE, height: FRAME_SIZE,
                                                    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <ActivityIndicator color={accent.border} size="small" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {!uploading && (
                                            <TouchableOpacity
                                                onPress={() => removePhoto(idx)}
                                                hitSlop={4}
                                                style={{
                                                    position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9,
                                                    backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center',
                                                }}
                                            >
                                                <X size={10} color="#fff" strokeWidth={2.5} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            }

                            if (type === 'required') {
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => pickPhoto(idx)}
                                        activeOpacity={0.8}
                                        style={{
                                            width: FRAME_SIZE, height: FRAME_SIZE, borderRadius: 10,
                                            backgroundColor: accent.soft, borderWidth: 1.5, borderColor: accent.border,
                                            borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <ImageIcon size={15} color={accent.border} strokeWidth={1.5} />
                                    </TouchableOpacity>
                                );
                            }

                            if (type === 'add') {
                                return (
                                    <TouchableOpacity
                                        key="add"
                                        onPress={() => pickPhoto(filled)}
                                        activeOpacity={0.8}
                                        style={{
                                            width: FRAME_SIZE, height: FRAME_SIZE, borderRadius: 10,
                                            backgroundColor: RK.surface, borderWidth: 1.5, borderColor: RK.hair,
                                            borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <Plus size={15} color={RK.dim} strokeWidth={2} />
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <View
                                    key="opt"
                                    style={{
                                        width: FRAME_SIZE, height: FRAME_SIZE, borderRadius: 10,
                                        backgroundColor: RK.surface, borderWidth: 1.5, borderColor: RK.hair,
                                        borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', opacity: 0.35,
                                    }}
                                >
                                    <ImageIcon size={15} color={RK.dim} strokeWidth={1.5} />
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>

            {/* ── Video reel ── */}
            <View style={{ marginBottom: 8 }}>
                <View style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: RK.hair, marginBottom: 10,
                }}>
                    <Text style={{ fontFamily: RK_FONT.med, fontSize: 12, color: RK.cream2 }}>Video reel</Text>
                    <Text style={{ fontFamily: RK_FONT.mono, fontSize: 8, color: RK.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Optional
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                    {Array.from({ length: MAX_VIDEOS }).map((_, idx) => {
                        const asset = videoAssets[idx];
                        if (asset) {
                            return (
                                <View key={idx} style={{ position: 'relative', flex: 1, aspectRatio: 3 / 4 }}>
                                    <TouchableOpacity
                                        onPress={() => !uploading && pickVideo(idx)}
                                        activeOpacity={0.85}
                                        style={{ flex: 1, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: accent.border }}
                                    >
                                        <Image
                                            source={{ uri: asset.uri }}
                                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                            resizeMode="cover"
                                        />
                                        <View style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {uploading
                                                ? <ActivityIndicator color={accent.border} size="small" />
                                                : <Play size={16} color="#fff" fill="#fff" strokeWidth={0} />}
                                        </View>
                                    </TouchableOpacity>
                                    {!uploading && (
                                        <TouchableOpacity
                                            onPress={() => removeVideo(idx)}
                                            hitSlop={4}
                                            style={{
                                                position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9,
                                                backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <X size={10} color="#fff" strokeWidth={2.5} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }
                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => pickVideo(idx)}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1, aspectRatio: 3 / 4, borderRadius: 10,
                                    backgroundColor: RK.surface, borderWidth: 1.5, borderColor: RK.hair,
                                    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
                                }}
                            >
                                <Play size={15} color={RK.dim} fill={RK.dim} strokeWidth={0} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
