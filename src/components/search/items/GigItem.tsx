// src/components/search/items/GigItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Briefcase } from 'lucide-react-native';

interface GigItemProps {
    item: any;
    onPress?: () => void;
}

export const GigItem = ({ item, onPress }: GigItemProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-row items-start py-4 border-b border-white/5">
        <View className="w-12 h-12 bg-white/10 rounded-lg items-center justify-center mr-4 border border-white/5">
            <Briefcase size={20} color="#a1a1aa" />
        </View>

        <View className="flex-1">
            <Text className="text-white font-bold text-base mb-0.5">{item.title}</Text>
            <Text className="text-gray-300 text-sm mb-1">{item.organizerName || 'Organizer'}</Text>
            <View className="flex-row items-center gap-3">
                <Text className="text-gray-500 text-xs">{item.city || 'Remote'}</Text>
                <Text className="text-green-400 text-xs font-bold">{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
        </View>

        <View className="mt-1">
            <View className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Text className="text-white text-xs font-bold">View</Text>
            </View>
        </View>
    </TouchableOpacity>
);
