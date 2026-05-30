// src/components/search/items/PersonItem.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { UserPlus, Check } from 'lucide-react-native';
import noAvatar from '@/assets/no-avatar.jpg';
import connectionService from '@/services/connectionService';
import { interpretConnectionError } from '@/utils/connectionErrors';

type ConnectionStatus = 'none' | 'pending' | 'connected';

interface PersonItemProps {
    item: any;
    status: ConnectionStatus;
    onPress?: () => void;
}

export const PersonItem = ({ item, status: initialStatus, onPress }: PersonItemProps) => {
    const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setStatus(initialStatus);
    }, [initialStatus]);

    const handleConnect = async () => {
        if (status !== 'none' || isLoading) return;
        try {
            setIsLoading(true);
            await connectionService.sendConnectionRequest(item.id);
            setStatus('pending');
        } catch (error: any) {
            const info = interpretConnectionError(error);
            if (info.swallow) {
                setStatus('pending');
            } else {
                Alert.alert(info.title, info.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Build the single meta line: artistType + city, separated by middle dot.
    // Hide entirely when neither is set.
    const name = [item.firstName, item.lastName].filter(Boolean).join(' ').trim() || item.displayName || item.title;
    const metaParts: string[] = [];
    if (item.artistType) metaParts.push(String(item.artistType));
    if (item.city) metaParts.push(String(item.city));
    const meta = metaParts.join(' · ');

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center py-3">
            {/* Avatar — smaller, no extra border */}
            <Image
                source={item?.profileImageUrl ? { uri: item.profileImageUrl } : noAvatar}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                className="bg-white/5"
                resizeMode="cover"
            />

            {/* Info — name + single meta line */}
            <View className="flex-1 ml-3 mr-2">
                <Text className="text-white font-semibold text-[15px]" numberOfLines={1}>{name}</Text>
                {meta ? (
                    <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>{meta}</Text>
                ) : null}
            </View>

            {/* Action — minimal connect button on the right */}
            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation();
                    handleConnect();
                }}
                disabled={status !== 'none' || isLoading}
                className={`px-3 py-1.5 rounded-full border ${
                    status === 'connected' || status === 'pending'
                        ? 'border-white/15'
                        : 'border-white/35'
                }`}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : status === 'connected' ? (
                    <Text className="text-gray-400 font-semibold text-xs">Following</Text>
                ) : status === 'pending' ? (
                    <View className="flex-row items-center">
                        <Check size={13} color="#9ca3af" />
                        <Text className="text-gray-400 font-semibold text-xs ml-1">Pending</Text>
                    </View>
                ) : (
                    <View className="flex-row items-center">
                        <UserPlus size={13} color="#fff" />
                        <Text className="text-white font-semibold text-xs ml-1">Connect</Text>
                    </View>
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );
};
