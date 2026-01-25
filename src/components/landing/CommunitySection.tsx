import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Users, Share2, Trophy, Search, TrendingUp, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface FeatureCardProps {
    icon: any;
    title: string;
    description: string;
    gradient: readonly [string, string];
    index: number;
}

const FeatureCard = ({ icon: Icon, title, description, gradient, index }: FeatureCardProps) => {
    return (
        <View className="mb-6 relative">
            {/* Card */}
            <View
                className="rounded-3xl p-6"
                style={{
                    backgroundColor: 'rgba(26, 26, 36, 0.6)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                }}
            >
                {/* Icon Container with Gradient */}
                <View className="mb-5">
                    <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="w-16 h-16 rounded-2xl items-center justify-center"
                    >
                        <Icon size={28} color="white" strokeWidth={2.5} />
                    </LinearGradient>
                </View>

                <Text className="text-white text-2xl font-outfit-black mb-3">{title}</Text>
                <Text className="text-gray-400 text-base font-outfit" style={{ lineHeight: 24 }}>{description}</Text>

                {/* Hover Indicator */}
                <View className="mt-4 flex-row items-center">
                    <Text className="text-sm font-outfit-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Learn more</Text>
                    <Text className="text-lg ml-1 font-outfit" style={{ color: 'rgba(255,255,255,0.6)' }}>→</Text>
                </View>
            </View>
        </View>
    );
};

const AnimatedCounter = ({ value, label, delay }: { value: string; label: string; delay: number }) => {
    return (
        <View className="items-center flex-1">
            <LinearGradient
                colors={['#ff006e', '#8338ec'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="mb-2 px-1 py-1 rounded-lg"
            >
                <Text className="text-white text-4xl font-outfit-black">{value}</Text>
            </LinearGradient>
            <Text className="text-gray-400 text-sm text-center font-outfit">{label}</Text>
        </View>
    );
};

export default function CommunitySection({ scrollY }: { scrollY: any }) {
    const router = useRouter();

    const features = [
        {
            icon: Users,
            title: 'Connect & Network',
            description: 'Build meaningful relationships with fellow dancers, choreographers, and industry professionals worldwide.',
            gradient: ['#ff006e', '#ff4d94'] as const,
            index: 0,
        },
        {
            icon: Share2,
            title: 'Share & Collaborate',
            description: 'Join discussions, share your work, and collaborate on creative projects with the community.',
            gradient: ['#8338ec', '#a855f7'] as const,
            index: 1,
        },
        {
            icon: Trophy,
            title: 'Showcase Talent',
            description: 'Create your artist profile, showcase your skills, and get discovered by event organizers.',
            gradient: ['#3b82f6', '#60a5fa'] as const,
            index: 2,
        },
        {
            icon: Search,
            title: 'Find Opportunities',
            description: 'Discover jobs, auditions, and performance opportunities that match your unique style.',
            gradient: ['#f59e0b', '#fbbf24'] as const,
            index: 3,
        },
    ];

    return (
        <View className="py-20 px-6 relative" style={{ backgroundColor: '#0a0a0f' }}>
            {/* Background Elements */}
            <View className="absolute" style={{ top: 160, left: -50, width: 256, height: 256, opacity: 0.1 }}>
                <LinearGradient
                    colors={['#ff006e', 'transparent'] as const}
                    style={{ width: '100%', height: '100%', borderRadius: 999 }}
                />
            </View>

            <View className="absolute" style={{ bottom: 80, right: -50, width: 288, height: 288, opacity: 0.1 }}>
                <LinearGradient
                    colors={['#8338ec', 'transparent'] as const}
                    style={{ width: '100%', height: '100%', borderRadius: 999 }}
                />
            </View>

            {/* Section Header */}
            <View className="mb-12">
                <View className="flex-row items-center justify-center mb-4">
                    <Zap size={24} color="#ff006e" fill="#ff006e" />
                </View>

                <Text className="text-white text-4xl font-outfit-black text-center mb-2">
                    Join a Thriving
                </Text>
                <View className="items-center">
                    <LinearGradient
                        colors={['#ff006e', '#8338ec'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-4 py-2 rounded-lg"
                    >
                        <Text className="text-white text-4xl font-outfit-black px-2">Creative Community</Text>
                    </LinearGradient>
                </View>

                <Text className="text-gray-400 text-center mt-5 text-base max-w-md mx-auto font-outfit" style={{ lineHeight: 24 }}>
                    Netsa isn't just about events—it's about building lasting connections and growing together
                </Text>
            </View>

            {/* Features Grid */}
            <View
                className="mb-12"
                style={isWeb ? {
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 16,
                    maxWidth: 1200,
                    alignSelf: 'center',
                } : undefined}
            >
                {features.map((feature, index) => (
                    <View key={index} style={isWeb ? { width: '45%', minWidth: 300, maxWidth: 400 } : undefined}>
                        <FeatureCard {...feature} />
                    </View>
                ))}
            </View>

            {/* Stats Section */}
            <View className="mb-12 relative">
                {/* Glow Background */}
                <LinearGradient
                    colors={['transparent', 'rgba(255,0,110,0.1)', 'transparent'] as const}
                    className="absolute inset-0"
                    style={{ position: 'absolute', top: 0, left: -24, right: -24, bottom: 0 }}
                />

                <View
                    className="rounded-3xl p-8"
                    style={{
                        backgroundColor: 'rgba(26, 26, 36, 0.4)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)'
                    }}
                >
                    <View className="flex-row items-center justify-center mb-6">
                        <TrendingUp size={20} color="#ff006e" />
                        <Text className="text-white font-outfit-bold ml-2">Platform Growth</Text>
                    </View>

                    <View className="flex-row justify-around">
                        <AnimatedCounter value="10K+" label="Active Members" delay={200} />
                        <AnimatedCounter value="500+" label="Events Monthly" delay={400} />
                        <AnimatedCounter value="98%" label="Satisfaction" delay={600} />
                    </View>
                </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                activeOpacity={0.8}
                className="relative"
            >
                {/* Button Glow */}
                <View className="absolute rounded-3xl" style={{ top: -8, left: -8, right: -8, bottom: -8, opacity: 0.4 }}>
                    <LinearGradient
                        colors={['#ff006e', '#8338ec'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: '100%', height: '100%', borderRadius: 24 }}
                    />
                </View>

                {/* Button */}
                <LinearGradient
                    colors={['#ff006e', '#8338ec'] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-5 rounded-2xl"
                    style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
                >
                    <Text className="text-white font-outfit-black text-lg text-center">
                        Start Your Journey ✨
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}