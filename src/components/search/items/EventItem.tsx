// src/components/search/items/EventItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface EventItemProps {
    item: any;
    onPress?: () => void;
}

export const EventItem = ({ item, onPress }: EventItemProps) => {
    const d = item.date ? new Date(item.date) : null;
    const month = d && !isNaN(d.getTime()) ? d.toLocaleString('default', { month: 'short' }) : '';
    const day = d && !isNaN(d.getTime()) ? d.getDate() : '';

    const meta: string[] = [];
    if (item.eventType) meta.push(String(item.eventType));
    if (typeof item.attendeeCount === 'number') meta.push(`${item.attendeeCount} attending`);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center py-3">
            <View className="w-11 h-11 rounded-lg bg-white/5 items-center justify-center">
                <Text className="text-orange-400 text-[10px] font-bold uppercase tracking-wider">{month}</Text>
                <Text className="text-white text-base font-bold leading-tight">{day}</Text>
            </View>
            <View className="flex-1 ml-3">
                <Text className="text-white font-semibold text-[15px]" numberOfLines={1}>{item.title}</Text>
                {meta.length > 0 ? (
                    <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>{meta.join(' · ')}</Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
};
