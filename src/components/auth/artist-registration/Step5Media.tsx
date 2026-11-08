import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Plus, X, Star } from 'lucide-react-native';
import type { ImagePickerAsset } from 'expo-image-picker';
import { C, FONT, s } from './shared';

const MAX_PHOTOS = 6;
const MIN_PHOTOS = 2;
const SLOT_SIZE = 102; // 3 columns in ~360px viewport

interface Props {
    photos: ImagePickerAsset[];
    setPhotos: (p: ImagePickerAsset[]) => void;
    uploading?: boolean;
}

export function Step5Media({ photos, setPhotos, uploading = false }: Props) {
    const slots = Array.from({ length: MAX_PHOTOS });

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
            aspect: [4, 3],
        });
        if (result.canceled || !result.assets?.[0]) return;
        const next = [...photos];
        next[idx] = result.assets[0];
        setPhotos(next.filter(Boolean));
    };

    const removePhoto = (idx: number) => {
        const next = photos.filter((_, i) => i !== idx);
        setPhotos(next);
    };

    const filled = photos.length;
    const meetsMin = filled >= MIN_PHOTOS;

    return (
        <View>
            <View style={{ marginBottom: 28 }}>
                <Text style={s.eyebrow}>STEP 5 OF 5</Text>
                <Text style={s.headline}>Show your{'\n'}work.</Text>
                <Text style={s.subhead}>Portfolio photos help you get hired. Add at least 2.</Text>
            </View>

            {/* Photo grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {slots.map((_, idx) => {
                    const asset = photos[idx];
                    const isFirst = idx === 0;
                    return (
                        <View key={idx} style={{ position: 'relative' }}>
                            <TouchableOpacity
                                onPress={() => !uploading && pickPhoto(idx)}
                                activeOpacity={0.8}
                                style={{
                                    width: SLOT_SIZE,
                                    height: SLOT_SIZE,
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    backgroundColor: C.surface,
                                    borderWidth: 1,
                                    borderColor: asset ? C.orangeBorder : C.border,
                                    borderStyle: asset ? 'solid' : 'dashed',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {asset ? (
                                    <Image
                                        source={{ uri: asset.uri }}
                                        style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={{ alignItems: 'center', gap: 6 }}>
                                        <View style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 10,
                                            backgroundColor: C.orangeDim,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Plus size={16} color={C.orange} strokeWidth={2} />
                                        </View>
                                        {idx < MIN_PHOTOS && (
                                            <Text style={{ fontFamily: FONT.mono, fontSize: 8, color: C.t4, letterSpacing: 1 }}>
                                                REQUIRED
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Cover badge on slot 0 */}
                            {isFirst && (
                                <View style={{
                                    position: 'absolute',
                                    bottom: 6,
                                    left: 6,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 3,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                }}>
                                    <Star size={9} color={C.orange} fill={C.orange} strokeWidth={0} />
                                    <Text style={{ fontFamily: FONT.mono, fontSize: 8, color: C.t1, letterSpacing: 0.5 }}>
                                        COVER
                                    </Text>
                                </View>
                            )}

                            {/* Remove button */}
                            {asset && !uploading && (
                                <TouchableOpacity
                                    onPress={() => removePhoto(idx)}
                                    hitSlop={4}
                                    style={{
                                        position: 'absolute',
                                        top: 5,
                                        right: 5,
                                        width: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        backgroundColor: 'rgba(0,0,0,0.65)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <X size={11} color="#fff" strokeWidth={2.5} />
                                </TouchableOpacity>
                            )}

                            {/* Per-slot upload spinner */}
                            {uploading && asset && (
                                <View style={{
                                    position: 'absolute',
                                    inset: 0,
                                    width: SLOT_SIZE,
                                    height: SLOT_SIZE,
                                    borderRadius: 12,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <ActivityIndicator color={C.orange} size="small" />
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Counter / nudge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 }}>
                <View style={{
                    flex: 1,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: C.border,
                    overflow: 'hidden',
                }}>
                    <View style={{
                        height: 2,
                        width: `${Math.min(filled / MAX_PHOTOS, 1) * 100}%`,
                        backgroundColor: meetsMin ? C.orange : C.t4,
                    }} />
                </View>
                <Text style={{ fontFamily: FONT.mono, fontSize: 9, color: meetsMin ? C.t3 : C.t4, letterSpacing: 1 }}>
                    {filled}/{MAX_PHOTOS}
                </Text>
            </View>

            {!meetsMin && (
                <Text style={[s.fineprint, { color: C.t3, marginTop: 8 }]}>
                    Add {MIN_PHOTOS - filled} more photo{MIN_PHOTOS - filled !== 1 ? 's' : ''} to continue.
                </Text>
            )}

            <Text style={s.fineprint}>
                First photo is your cover shot — shown on your profile and gig applications.
                You can reorder later.
            </Text>
        </View>
    );
}
