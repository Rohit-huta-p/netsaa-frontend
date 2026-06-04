import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { UserPen, Settings, MessageCircle } from 'lucide-react-native';

type ConnectionState = 'none' | 'pending' | 'connected';

type Props = {
    isOwner: boolean;
    connectionStatus?: ConnectionState;
    isConnectionLoading?: boolean;
    onConnectPress?: () => void;
    onSettingsPress?: () => void;
};

const CONNECT_LABELS: Record<ConnectionState, string> = {
    none: 'Connect',
    pending: 'Pending',
    connected: 'Connected',
};

export const ProfileActions: React.FC<Props> = ({
    isOwner,
    connectionStatus = 'none',
    isConnectionLoading = false,
    onConnectPress,
    onSettingsPress,
}) => {
    if (isOwner) {
        return (
            <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                    onPress={onSettingsPress || (() => router.push('/settings'))}
                    className="flex-row items-center gap-2 bg-white/10 border border-white/20 px-5 py-2.5 rounded-full"
                >
                    <Settings size={14} color="white" />
                    <Text className="text-white font-outfit-medium text-xs uppercase tracking-widest">
                        Settings
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
                onPress={onConnectPress}
                disabled={isConnectionLoading || connectionStatus === 'pending'}
                className={`flex-row items-center gap-2 px-5 py-2.5 rounded-full border ${connectionStatus === 'connected'
                        ? 'bg-white/10 border-white/30'
                        : connectionStatus === 'pending'
                            ? 'bg-white/5 border-white/10'
                            : 'bg-[#ea698b] border-[#ea698b]'
                    }`}
            >
                {isConnectionLoading ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <Text className="text-white font-outfit-bold text-xs uppercase tracking-widest">
                        {CONNECT_LABELS[connectionStatus]}
                    </Text>
                )}
            </TouchableOpacity>

            {connectionStatus === 'connected' && (
                <TouchableOpacity
                    className="flex-row items-center gap-2 bg-white/10 border border-white/20 px-5 py-2.5 rounded-full"
                >
                    <MessageCircle size={14} color="white" />
                    <Text className="text-white font-outfit-medium text-xs uppercase tracking-widest">
                        Message
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
