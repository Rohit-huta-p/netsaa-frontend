import React from 'react';
import { View, Text, ScrollView, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Users, Star, TrendingUp, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface JourneyStep {
    id: string;
    number: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    gradient: readonly [string, string];
    stat: string;
    statLabel: string;
}

const journeySteps: JourneyStep[] = [
    {
        id: 'discover',
        number: '01',
        title: 'Discover',
        description: 'Find opportunities that match your unique talent and style',
        icon: Search,
        color: '#ff006e',
        gradient: ['#ff006e', '#ff4d94'] as const,
        stat: '5,000+',
        statLabel: 'opportunities posted monthly',
    },
    {
        id: 'connect',
        number: '02',
        title: 'Connect',
        description: 'Network with fellow artists, organizers, and industry pros',
        icon: Users,
        color: '#8338ec',
        gradient: ['#8338ec', '#a855f7'] as const,
        stat: '10K+',
        statLabel: 'active connections made',
    },
    {
        id: 'perform',
        number: '03',
        title: 'Perform',
        description: 'Book gigs, auditions, and showcase your incredible talent',
        icon: Star,
        color: '#3b82f6',
        gradient: ['#3b82f6', '#60a5fa'] as const,
        stat: '2,500+',
        statLabel: 'gigs booked last month',
    },
    {
        id: 'grow',
        number: '04',
        title: 'Grow',
        description: 'Build your reputation and take your career to new heights',
        icon: TrendingUp,
        color: '#10b981',
        gradient: ['#10b981', '#34d399'] as const,
        stat: '85%',
        statLabel: 'artists report career growth',
    },
];

const JourneyCard = ({ step, index }: { step: JourneyStep; index: number }) => {
    const Icon = step.icon;
    const cardWidth = isWeb ? Math.min(width * 0.4, 320) : width * 0.75;

    return (
        <View
            className="mr-5"
            style={{ width: cardWidth }}
        >
            <View
                className="rounded-3xl p-6 relative overflow-hidden"
                style={{
                    backgroundColor: 'rgba(26, 26, 36, 0.9)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                }}
            >
                {/* Background number */}
                <Text
                    className="absolute font-outfit-black"
                    style={{
                        fontSize: 100,
                        color: step.color,
                        opacity: 0.05,
                        top: -20,
                        right: -10,
                    }}
                >
                    {step.number}
                </Text>

                {/* Step number badge */}
                <LinearGradient
                    colors={step.gradient}
                    className="w-12 h-12 rounded-2xl items-center justify-center mb-5"
                >
                    <Icon size={24} color="white" />
                </LinearGradient>

                {/* Title */}
                <Text className="text-white text-2xl font-outfit-black mb-2">{step.title}</Text>

                {/* Description */}
                <Text className="text-gray-400 text-base mb-6 font-outfit" style={{ lineHeight: 24 }}>
                    {step.description}
                </Text>

                {/* Stat */}
                <View className="flex-row items-baseline flex-wrap">
                    <Text style={{ color: step.color }} className="text-3xl font-outfit-black mr-2">
                        {step.stat}
                    </Text>
                    <Text className="text-gray-500 text-sm flex-1 font-outfit">
                        {step.statLabel}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default function OpportunityJourney({ scrollY }: { scrollY: any }) {
    return (
        <View className="py-16 relative" style={{ backgroundColor: '#0a0a0f' }}>
            {/* Background */}
            <LinearGradient
                colors={['#0a0a0f', '#1a0b2e', '#0a0a0f'] as const}
                locations={[0, 0.5, 1]}
                className="absolute inset-0"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Decorative elements */}
            <View
                className="absolute opacity-20"
                style={{ top: 80, left: -50, width: 150, height: 150 }}
            >
                <LinearGradient
                    colors={['#ff006e', 'transparent'] as const}
                    style={{ width: '100%', height: '100%', borderRadius: 999 }}
                />
            </View>

            {/* Section Header */}
            <View className="px-6 mb-10">
                <View className="flex-row items-center justify-center mb-4">
                    <Sparkles size={20} color="#ff006e" />
                    <Text className="text-sm font-outfit-bold ml-2 tracking-wider" style={{ color: '#ff006e' }}>
                        YOUR PATH TO SUCCESS
                    </Text>
                </View>

                <Text className="text-white text-4xl font-outfit-black text-center mb-2">
                    The Artist's
                </Text>
                <View className="items-center">
                    <LinearGradient
                        colors={['#ff006e', '#8338ec'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-4 py-2 rounded-lg"
                    >
                        <Text className="text-white text-4xl font-outfit-black">Journey</Text>
                    </LinearGradient>
                </View>

                <Text className="text-gray-400 text-center mt-4 text-base max-w-sm mx-auto font-outfit" style={{ lineHeight: 24 }}>
                    From discovery to stardom, we're with you every step of the way
                </Text>
            </View>

            {/* Journey Steps Carousel */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8 }}
                decelerationRate="fast"
                snapToInterval={isWeb ? undefined : width * 0.75 + 20}
            >
                {journeySteps.map((step, index) => (
                    <JourneyCard key={step.id} step={step} index={index} />
                ))}
            </ScrollView>

            {/* Progress indicator */}
            <View className="flex-row justify-center mt-8" style={{ gap: 12 }}>
                {journeySteps.map((step) => (
                    <View
                        key={step.id}
                        className="w-12 h-1 rounded-full"
                        style={{ backgroundColor: step.color + '60' }}
                    />
                ))}
            </View>
        </View>
    );
}
