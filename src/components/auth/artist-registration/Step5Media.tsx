import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, Image, Alert,
    ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Plus, X, Image as ImageIcon, Play, User } from 'lucide-react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { C, FONT, s } from './shared';

const MIN_PHOTOS = 2;
const FRAME_SIZE = 68;

interface Props {
    photos: ImagePickerAsset[];
    setPhotos: (p: ImagePickerAsset[]) => void;
    avatar?: ImagePickerAsset | null;
    setAvatar?: (a: ImagePickerAsset | null) => void;
    videoUrl?: string;
    setVideoUrl?: (v: string) => void;
    uploading?: boolean;
    onSkip?: () => void;
}

export function Step5Media({
    photos,
    setPhotos,
    avatar = null,
    setAvatar,
    videoUrl = '',
    setVideoUrl,
    uploading = false,
    onSkip,
}: Props) {
    const [videoInput, setVideoInput] = useState(videoUrl);

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

    const removePhoto = (idx: number) => {
        setPhotos(photos.filter((_, i) => i !== idx));
    };

    const commitVideoUrl = () => {
        setVideoUrl?.(videoInput.trim());
    };

    const filled = photos.length;
    const meetsMin = filled >= MIN_PHOTOS;

    // Render frames: required slots, then one add button, then one dim optional slot
    const frames: Array<'filled' | 'required' | 'add' | 'optional'> = [];
    for (let i = 0; i < filled; i++) frames.push('filled');
    for (let i = filled; i < MIN_PHOTOS; i++) frames.push('required');
    frames.push('add');
    if (frames.length < 5) frames.push('optional');

    return (
        <View>
            <View style={{ marginBottom: 24 }}>
                <Text style={s.eyebrow}>STEP 5 OF 5</Text>
                <Text style={s.headline}>Show your art</Text>
                <Text style={s.subhead}>Your portfolio is how hirers find you.</Text>
            </View>

            {/* ── Avatar ring ── */}
            <TouchableOpacity
                onPress={pickAvatar}
                activeOpacity={0.8}
                style={{ alignItems: 'center', marginBottom: 24 }}
            >
                <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 1.5,
                    borderColor: C.border,
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: C.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        {avatar ? (
                            <Image source={{ uri: avatar.uri }} style={{ width: 56, height: 56 }} />
                        ) : (
                            <User size={22} color={C.t4} strokeWidth={1.5} />
                        )}
                    </View>

                    {/* Optional badge */}
                    <View style={{
                        position: 'absolute',
                        bottom: -9,
                        left: '50%',
                        transform: [{ translateX: -24 }],
                        backgroundColor: C.surface2,
                        borderWidth: 1,
                        borderColor: C.border,
                        borderRadius: 20,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                    }}>
                        <Text style={{ fontFamily: FONT.mono, fontSize: 7, color: C.t4, letterSpacing: 1, textTransform: 'uppercase' }}>
                            Optional
                        </Text>
                    </View>
                </View>
                <Text style={{ fontFamily: FONT.body, fontSize: 11, color: C.t3, marginTop: 16 }}>
                    Tap to add profile photo
                </Text>
            </TouchableOpacity>

            {/* ── Photos section ── */}
            <View style={{ marginBottom: 16 }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: C.border,
                    marginBottom: 10,
                }}>
                    <Text style={{ fontFamily: FONT.bodyMed, fontSize: 12, color: C.t2 }}>Photos</Text>
                    <Text style={{
                        fontFamily: FONT.mono,
                        fontSize: 8,
                        color: meetsMin ? C.t3 : C.orange,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                    }}>
                        {meetsMin ? `${filled} added` : `${MIN_PHOTOS} required · ${filled} added`}
                    </Text>
                </View>

                {/* Horizontal strip */}
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
                                                width: FRAME_SIZE,
                                                height: FRAME_SIZE,
                                                borderRadius: 10,
                                                overflow: 'hidden',
                                                borderWidth: 1,
                                                borderColor: C.orangeBorder,
                                            }}
                                        >
                                            <Image
                                                source={{ uri: photos[idx]?.uri }}
                                                style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
                                                resizeMode="cover"
                                            />
                                            {uploading && (
                                                <View style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    width: FRAME_SIZE,
                                                    height: FRAME_SIZE,
                                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <ActivityIndicator color={C.orange} size="small" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {!uploading && (
                                            <TouchableOpacity
                                                onPress={() => removePhoto(idx)}
                                                hitSlop={4}
                                                style={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 9,
                                                    backgroundColor: 'rgba(0,0,0,0.65)',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
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
                                            width: FRAME_SIZE,
                                            height: FRAME_SIZE,
                                            borderRadius: 10,
                                            backgroundColor: 'rgba(255,107,53,0.07)',
                                            borderWidth: 1.5,
                                            borderColor: 'rgba(255,107,53,0.3)',
                                            borderStyle: 'dashed',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <ImageIcon size={15} color="rgba(255,107,53,0.4)" strokeWidth={1.5} />
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
                                            width: FRAME_SIZE,
                                            height: FRAME_SIZE,
                                            borderRadius: 10,
                                            backgroundColor: C.surface,
                                            borderWidth: 1.5,
                                            borderColor: C.border,
                                            borderStyle: 'dashed',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Plus size={15} color={C.t4} strokeWidth={2} />
                                    </TouchableOpacity>
                                );
                            }

                            // optional dim slot
                            return (
                                <View
                                    key="opt"
                                    style={{
                                        width: FRAME_SIZE,
                                        height: FRAME_SIZE,
                                        borderRadius: 10,
                                        backgroundColor: C.surface,
                                        borderWidth: 1.5,
                                        borderColor: C.border,
                                        borderStyle: 'dashed',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0.35,
                                    }}
                                >
                                    <ImageIcon size={15} color={C.t4} strokeWidth={1.5} />
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>

            {/* ── Video reel section ── */}
            <View style={{ marginBottom: 8 }}>
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: C.border,
                    marginBottom: 10,
                }}>
                    <Text style={{ fontFamily: FONT.bodyMed, fontSize: 12, color: C.t2 }}>Video reel</Text>
                    <Text style={{ fontFamily: FONT.mono, fontSize: 8, color: C.t3, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Optional
                    </Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: C.surface,
                        borderWidth: 1,
                        borderColor: C.border,
                        borderRadius: 11,
                        padding: 11,
                    }}
                    onPress={() => {/* open link input */}}
                >
                    <View style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        backgroundColor: C.surface2,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Play size={12} color={C.t4} fill={C.t4} />
                    </View>
                    <View style={{ flex: 1 }}>
                        {videoUrl ? (
                            <Text style={{ fontFamily: FONT.bodyMed, fontSize: 12, color: C.t2 }} numberOfLines={1}>
                                {videoUrl}
                            </Text>
                        ) : (
                            <Text style={{ fontFamily: FONT.bodyMed, fontSize: 12, color: C.t3 }}>
                                Add a performance video
                            </Text>
                        )}
                        <Text style={{ fontFamily: FONT.body, fontSize: 9, color: C.t4, marginTop: 2 }}>
                            YouTube link or upload · Max 90 s
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
