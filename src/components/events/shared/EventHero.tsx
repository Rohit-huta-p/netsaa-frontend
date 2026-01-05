import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Heart, Settings, Share2 } from 'lucide-react-native';
import { IEvent } from '@/types/event';

interface EventHeroProps {
    onSettingsPress?: () => void;
    event: IEvent;
    isOrganizer?: boolean;
}

export const EventHero: React.FC<EventHeroProps> = ({ onSettingsPress, event, isOrganizer }) => {
    return (
        <View className="flex-row h-56 rounded-3xl overflow-hidden relative">
            <View className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />

            {/* Center icon */}
            <View className="flex-1 justify-center items-center">
                <Text className="text-4xl">🎭</Text>
            </View>

            {/* Action buttons */}
            <View className="absolute top-4 right-4 flex-row space-x-2 z-50">
                <TouchableOpacity className="bg-white/90 p-2 rounded-full">
                    <Heart size={16} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity className="bg-white/90 p-2 rounded-full">
                    <Share2 size={16} color="#111" />
                </TouchableOpacity>
                {
                    isOrganizer && (
                        <TouchableOpacity className="bg-white/90 p-2 rounded-full" onPress={onSettingsPress}>
                            <Settings size={16} color="#111" />
                        </TouchableOpacity>
                    )
                }
            </View>
        </View>
    );
};
