import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { uploadMediaFlow } from '@/utils/upload';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import noAvatar from '@/assets/no-avatar.jpg';

/**
 * EditableAvatar — tap photo to change
 * No modal. Direct camera/gallery picker. Uploads immediately.
 */

interface Props {
    imageUrl?: string;
    isOwner: boolean;
    size?: number;
}

export default function EditableAvatar({ imageUrl, isOwner, size = 88 }: Props) {
    const [uploading, setUploading] = useState(false);

    const handlePick = async () => {
        if (!isOwner) return;

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo access to change your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.[0]) return;

        setUploading(true);
        try {
            const asset = result.assets[0];
            // Upload and get URL
            const uploadResult = await uploadMediaFlow(asset.uri, 'avatar');
            const newUrl = uploadResult?.url || asset.uri;

            await authService.updateMe({ profileImageUrl: newUrl });

            const currentUser = useAuthStore.getState().user as any;
            if (currentUser) {
                useAuthStore.getState().setAuth({
                    user: { ...currentUser, profileImageUrl: newUrl },
                    accessToken: useAuthStore.getState().accessToken || '',
                });
            }
        } catch (err: any) {
            Alert.alert('Upload failed', 'Could not update photo. Try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Pressable onPress={handlePick} disabled={!isOwner || uploading} style={s.wrap}>
            <Image
                source={imageUrl ? { uri: imageUrl } : noAvatar}
                style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}
            />
            {uploading && (
                <View style={[s.overlay, { width: size, height: size, borderRadius: size / 2 }]}>
                    <ActivityIndicator color="#F97316" />
                </View>
            )}
            {isOwner && !uploading && (
                <LinearGradient
                    colors={['#EC4899', '#F97316']}
                    style={s.cameraBadge}
                >
                    <Camera size={12} color="#fff" strokeWidth={2} />
                </LinearGradient>
            )}
        </Pressable>
    );
}

const s = StyleSheet.create({
    wrap: { position: 'relative', alignSelf: 'center', marginBottom: 16 },
    avatar: { backgroundColor: '#1E1C26' },
    overlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#121018',
    },
});
