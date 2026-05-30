// src/components/search/items/EventItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';

interface EventItemProps {
    item: any;
    onPress?: () => void;
}

export const EventItem = ({ item, onPress }: EventItemProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center py-4 border-b border-white/5">
        {/* Calendar Box */}
        <View className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 items-center justify-center mr-4">
            <Text className="text-red-400 text-xs font-bold uppercase mb-0.5">
                {new Date(item.date).toLocaleString('default', { month: 'short' })}
            </Text>
            <Text className="text-white text-xl font-bold">
                {new Date(item.date).getDate()}
            </Text>
        </View>

        <View className="flex-1">
            <Text className="text-white font-bold text-base mb-0.5">{item.title}</Text>
            <Text className="text-gray-400 text-sm mb-1">{item.eventType}</Text>
            <View className="flex-row items-center">
                <Text className="text-gray-500 text-xs">{item.attendeeCount || 0} attendees</Text>
            </View>
        </View>

        <View className="bg-white/10 p-2 rounded-full">
            <MoreHorizontal size={20} color="gray" />
        </View>
    </TouchableOpacity>
);
