// src/components/search/items/GigItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Briefcase } from 'lucide-react-native';

interface GigItemProps {
    item: any;
    onPress?: () => void;
}

export const GigItem = ({ item, onPress }: GigItemProps) => {
    // Single meta line: organizer · city · createdAt (only the parts that exist)
    const meta: string[] = [];
    if (item.organizerName) meta.push(String(item.organizerName));
    if (item.city) meta.push(String(item.city));
    if (item.createdAt) {
        try { meta.push(new Date(item.createdAt).toLocaleDateString()); } catch { /* skip */ }
    }
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-center py-3">
            <View className="w-11 h-11 rounded-lg bg-white/5 items-center justify-center">
                <Briefcase size={18} color="#a78bfa" />
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
