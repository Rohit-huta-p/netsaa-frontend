// src/components/search/items/PersonItem.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
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

const GOLD = '#D4A155';

export const PersonItem = ({ item, status: initialStatus, onPress }: PersonItemProps) => {
    const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const [hover, setHover] = useState(false);

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

    const name =
        [item.firstName, item.lastName].filter(Boolean).join(' ').trim() ||
        item.displayName ||
        item.title;

    const metaParts: string[] = [];
    if (item.artistType) metaParts.push(String(item.artistType));
    if (item.city) metaParts.push(String(item.city));
    const meta = metaParts.join(' · ');

    const webHover =
        Platform.OS === 'web'
            ? {
                  onMouseEnter: () => setHover(true),
                  onMouseLeave: () => setHover(false),
              }
            : {};

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            {...(webHover as any)}
            style={{
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(212, 161, 85, 0.10)', // gold hairline
                backgroundColor: hover ? 'rgba(255, 200, 140, 0.025)' : 'transparent',
            }}
            className="flex-row items-center py-4 px-1"
        >
            {/* Avatar with subtle gold ring on hover */}
            <View
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    padding: 1.5,
                    backgroundColor: hover ? GOLD : 'rgba(255,255,255,0.06)',
                }}
            >
                <Image
                    source={item?.profileImageUrl ? { uri: item.profileImageUrl } : noAvatar}
                    style={{ width: '100%', height: '100%', borderRadius: 24 }}
                    resizeMode="cover"
                />
            </View>

            {/* Info */}
            <View className="flex-1 ml-4 mr-3">
                <Text className="font-outfit-semibold text-white text-[15px]" numberOfLines={1}>
                    {name}
                </Text>
                {meta ? (
                    <Text
                        className="font-outfit text-zinc-500 text-[12px] mt-0.5"
                        numberOfLines={1}
                        style={{ letterSpacing: 0.2 }}
                    >
                        {meta}
                    </Text>
                ) : null}
            </View>

            {/* Connect action */}
            <TouchableOpacity
                onPress={(e) => {
                    e.stopPropagation();
                    handleConnect();
                }}
                disabled={status !== 'none' || isLoading}
                style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor:
                        status === 'connected' || status === 'pending'
                            ? 'rgba(255,255,255,0.15)'
                            : hover
                            ? GOLD
                            : 'rgba(255,255,255,0.35)',
                }}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : status === 'connected' ? (
                    <Text className="font-outfit-semibold text-zinc-400 text-[11px] tracking-wide">
                        FOLLOWING
                    </Text>
                ) : status === 'pending' ? (
                    <View className="flex-row items-center">
                        <Check size={12} color="#9ca3af" />
                        <Text className="font-outfit-semibold text-zinc-400 text-[11px] ml-1 tracking-wide">
                            PENDING
                        </Text>
                    </View>
                ) : (
                    <View className="flex-row items-center">
                        <UserPlus size={12} color="#fff" />
                        <Text className="font-outfit-semibold text-white text-[11px] ml-1 tracking-wide">
                            CONNECT
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </TouchableOpacity>
    );
};
