import React from 'react';
import { View, Text } from 'react-native';
import { Users, MessageCircle, Trophy, Mic2 } from 'lucide-react-native';
import { GradientButton } from '@/components/ui/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';

const features = [
    {
        id: 1,
        title: 'The Network',
        description: 'Connect with top directors.',
        icon: Users,
        // Pink Gradient
        gradient: ['#ec4899', '#be185d'],
    },
    {
        id: 2,
        title: 'Collab',
        description: 'Find your crew instantly.',
        icon: MessageCircle,
        // Purple Gradient
        gradient: ['#a855f7', '#7e22ce'],
    },
    {
        id: 3,
        title: 'Spotlight',
        description: 'Get discovered by pros.',
        icon: Trophy,
        // Amber/Orange Gradient
        gradient: ['#f59e0b', '#d97706'],
    },
    {
        id: 4,
        title: 'Auditions',
        description: 'Direct access to casting.',
        icon: Mic2,
        // Teal Gradient
        gradient: ['#2dd4bf', '#0f766e'],
    },
];

export function CommunitySection() {
    return (
        <View className="py-12 px-6">
            <View className="mb-10">
                <Text className="text-pink-500 font-bold text-xs uppercase tracking-widest mb-2">
                    The Community
                </Text>
                <Text className="text-3xl font-black text-white leading-tight">
                    More Than Just{'\n'}
                    <Text className="text-gray-600">A Platform.</Text>
                </Text>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-4">
                {features.map((feature) => (
                    <View
                        key={feature.id}
                        className="w-[48%] overflow-hidden rounded-3xl"
                        // Add shadow for iOS/Android pop
                        style={{
                            shadowColor: feature.gradient[0],
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        {/* Glass Background with subtle top-to-bottom fade */}
                        <LinearGradient
                            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                            className="p-5 border-t border-white/20 border-l border-white/5 border-r border-white/5 border-b border-black/20"
                        >
                            {/* Icon Pop */}
                            <LinearGradient
                                colors={feature.gradient as [string, string, ...string[]]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-12 h-12 rounded-2xl items-center justify-center mb-4 shadow-sm"
                            >
                                <feature.icon size={22} color="#fff" />
                            </LinearGradient>

                            <Text className="text-lg font-bold text-white mb-1 tracking-tight">
                                {feature.title}
                            </Text>
                            <Text className="text-xs text-gray-400 font-medium leading-relaxed">
                                {feature.description}
                            </Text>
                        </LinearGradient>
                    </View>
                ))}
            </View>

            <View className="mt-12 items-center">
                <View className="w-full">
                    <GradientButton
                        label="Join the Movement"
                        colors={["#4c1d95", "#8b5cf6"]}
                    />
                </View>
            </View>
        </View>
    );
}