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

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center py-4 border-b border-white/5">
            {/* Avatar */}
            <View className="w-14 h-14 rounded-full overflow-hidden border border-white/10 relative">
                <Image
                    source={item?.profileImageUrl ? { uri: item.profileImageUrl } : noAvatar}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
                    className="rounded-full mr-4 bg-gray-800"
                    resizeMode="cover"
                />
            </View>

            {/* Info */}
            <View className="flex-1">
                <Text className="text-white font-bold text-base">{item.firstName} {item.lastName} {item.title}</Text>
                <Text className="text-gray-400 text-sm mb-0.5" numberOfLines={1}>
                    {item.artistType || 'Member'}
                </Text>
                <Text className="text-gray-500 text-xs">
                    {item.city || 'Unknown Location'} • {status === 'connected' ? 'Connected' : (status === 'pending' ? 'Pending' : 'Connect')}
                </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation();
                    handleConnect();
                }}
                disabled={status !== 'none' || isLoading}
                className={`px-4 py-2 rounded-full border ${status === 'connected' || status === 'pending'
                    ? 'bg-white/5 border-white/20'
                    : 'bg-transparent border-white/40'
                    }`}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                ) : status === 'connected' ? (
                    <Text className="text-gray-400 font-bold text-sm">Following</Text>
                ) : status === 'pending' ? (
                    <View className="flex-row items-center">
                        <Check size={16} color="#9ca3af" className="mr-1" />
                        <Text className="text-gray-400 font-bold text-sm">Pending</Text>
                    </View>
                ) : (
                    <View className="flex-row items-center">
                        <UserPlus size={16} color="white" className="mr-1" />
                        <Text className="text-white font-bold text-sm">Connect</Text>
                    </View>
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );
};
