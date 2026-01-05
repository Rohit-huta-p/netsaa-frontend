import React from 'react';
import { View, Text } from 'react-native';
import { Users, Calendar, MapPin, Sparkles } from 'lucide-react-native';

const stats = [
    { id: 1, label: 'Artists', value: '5K+', icon: Users, color: '#f472b6' }, // Pink
    { id: 2, label: 'Gigs/Mo', value: '200+', icon: Calendar, color: '#2dd4bf' }, // Teal
    { id: 3, label: 'Cities', value: '50+', icon: MapPin, color: '#a78bfa' }, // Purple
    { id: 4, label: 'Workshops', value: '1K+', icon: Sparkles, color: '#fbbf24' }, // Amber
];

export function StatsSection() {
    return (
        <View className="px-6 -mt-10 mb-12">
            <View className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex-row flex-wrap justify-between gap-y-6">
                {stats.map((stat) => (
                    <View key={stat.id} className="w-[48%] md:w-auto items-center md:flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                            <stat.icon size={16} color={stat.color} />
                            <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                                {stat.label}
                            </Text>
                        </View>
                        <Text className="text-white font-black text-2xl md:text-3xl tracking-tight">
                            {stat.value}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}