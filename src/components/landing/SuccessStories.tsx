import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Quote, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface Testimonial {
    id: string;
    name: string;
    role: string;
    artistType: string;
    quote: string;
    achievement: string;
    color: string;
    gradient: readonly [string, string];
}

const testimonials: Testimonial[] = [
    {
        id: '1',
        name: 'Maria Rodriguez',
        role: 'Professional Dancer',
        artistType: '💃 Dancer',
        quote: "Booked my first music video choreography gig through Netsa. The connections I've made here have completely transformed my career.",
        achievement: 'Booked 12 gigs in 3 months',
        color: '#ff006e',
        gradient: ['#ff006e', '#ff4d94'] as const,
    },
    {
        id: '2',
        name: 'Jake Morrison',
        role: 'Session Musician',
        artistType: '🎵 Musician',
        quote: "Found my band's new drummer and landed a residency at a jazz club all through the platform. Netsa gets what musicians need.",
        achievement: 'Connected with 50+ artists',
        color: '#8338ec',
        gradient: ['#8338ec', '#a855f7'] as const,
    },
    {
        id: '3',
        name: 'DJ Phoenix',
        role: 'Club DJ & Producer',
        artistType: '🎧 DJ',
        quote: "From open decks to headlining—Netsa helped me build my network and book consistent weekend slots across the city.",
        achievement: 'Weekly residency at 2 clubs',
        color: '#3b82f6',
        gradient: ['#3b82f6', '#60a5fa'] as const,
    },
    {
        id: '4',
        name: 'Aisha Thompson',
        role: 'Theater Actor',
        artistType: '🎭 Actor',
        quote: "The audition alerts are a game-changer. I've booked more theater work in 6 months than the previous 2 years combined.",
        achievement: 'Lead role in 3 productions',
        color: '#f59e0b',
        gradient: ['#f59e0b', '#fbbf24'] as const,
    },
    {
        id: '5',
        name: 'Lucas Chen',
        role: 'Fashion Model',
        artistType: '📸 Model',
        quote: "Got scouted for fashion week through Netsa. The platform connects models with real opportunities, not just exposure.",
        achievement: 'Walked in 8 runway shows',
        color: '#10b981',
        gradient: ['#10b981', '#34d399'] as const,
    },
];

const TestimonialCard = ({ testimonial, isActive }: { testimonial: Testimonial; isActive: boolean }) => {
    const cardWidth = isWeb ? Math.min(width * 0.5, 500) : width - 48;

    return (
        <View
            style={{
                width: cardWidth,
                marginHorizontal: 8,
                opacity: isActive ? 1 : 0.7,
                transform: [{ scale: isActive ? 1 : 0.95 }],
            }}
        >
            <View
                className="rounded-3xl p-8 relative overflow-hidden"
                style={{
                    backgroundColor: 'rgba(26, 26, 36, 0.95)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                }}
            >
                {/* Quote Icon */}
                <View className="absolute" style={{ top: 24, right: 24, opacity: 0.1 }}>
                    <Quote size={60} color={testimonial.color} />
                </View>

                {/* Artist Type Badge */}
                <LinearGradient
                    colors={testimonial.gradient}
                    className="self-start px-4 py-2 rounded-full mb-6"
                >
                    <Text className="text-white text-sm font-outfit-bold">{testimonial.artistType}</Text>
                </LinearGradient>

                {/* Quote */}
                <Text className="text-white text-lg mb-6 font-outfit" style={{ fontStyle: 'italic', lineHeight: 28 }}>
                    "{testimonial.quote}"
                </Text>

                {/* Achievement */}
                <View
                    className="rounded-2xl px-4 py-3 mb-6 self-start"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderLeftWidth: 3,
                        borderLeftColor: testimonial.color
                    }}
                >
                    <View className="flex-row items-center">
                        <Star size={16} color={testimonial.color} fill={testimonial.color} />
                        <Text className="text-white font-outfit-bold ml-2">{testimonial.achievement}</Text>
                    </View>
                </View>

                {/* Profile */}
                <View className="flex-row items-center">
                    {/* Avatar placeholder */}
                    <LinearGradient
                        colors={testimonial.gradient}
                        className="w-14 h-14 rounded-full items-center justify-center mr-4"
                    >
                        <Text className="text-white text-xl font-outfit-black">
                            {testimonial.name.charAt(0)}
                        </Text>
                    </LinearGradient>

                    <View className="flex-1">
                        <Text className="text-white text-lg font-outfit-bold">{testimonial.name}</Text>
                        <Text className="text-gray-400 text-sm font-outfit">{testimonial.role}</Text>
                    </View>

                    {/* Rating */}
                    <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={14}
                                color="#fbbf24"
                                fill="#fbbf24"
                                style={{ marginLeft: 2 }}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function SuccessStories({ scrollY }: { scrollY: any }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const cardWidth = isWeb ? Math.min(width * 0.5, 500) + 16 : width - 32;

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / cardWidth);
        setActiveIndex(Math.min(index, testimonials.length - 1));
    };

    const scrollToIndex = (index: number) => {
        const clampedIndex = Math.max(0, Math.min(index, testimonials.length - 1));
        scrollViewRef.current?.scrollTo({
            x: clampedIndex * cardWidth,
            animated: true,
        });
        setActiveIndex(clampedIndex);
    };

    return (
        <View className="py-16 relative" style={{ backgroundColor: '#0a0a0f' }}>
            {/* Background */}
            <LinearGradient
                colors={['#0a0a0f', '#0f0a1a', '#0a0a0f'] as const}
                className="absolute inset-0"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Decorative sparkles */}
            <View className="absolute" style={{ top: 40, right: 40 }}>
                <Sparkles size={24} color="#fbbf24" style={{ opacity: 0.5 }} />
            </View>

            <View className="absolute" style={{ bottom: 80, left: 40 }}>
                <Sparkles size={20} color="#ff006e" style={{ opacity: 0.3 }} />
            </View>

            {/* Section Header */}
            <View className="px-6 mb-10">
                <View className="flex-row items-center justify-center mb-4">
                    <Star size={20} color="#fbbf24" fill="#fbbf24" />
                    <Text className="text-sm font-outfit-bold ml-2 tracking-wider" style={{ color: '#fbbf24' }}>
                        SUCCESS STORIES
                    </Text>
                </View>

                <Text className="text-white text-4xl font-outfit-black text-center mb-2">
                    Artists Who Made
                </Text>
                <View className="items-center">
                    <LinearGradient
                        colors={['#ff006e', '#8338ec'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-4 py-2 rounded-lg"
                    >
                        <Text className="text-white text-4xl font-outfit-black">It Here</Text>
                    </LinearGradient>
                </View>

                <Text className="text-gray-400 text-center mt-4 text-base max-w-sm mx-auto font-outfit" style={{ lineHeight: 24 }}>
                    Real stories from performers who found their next big break
                </Text>
            </View>

            {/* Testimonials Carousel */}
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled={!isWeb}
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                decelerationRate="fast"
                snapToInterval={isWeb ? undefined : cardWidth}
            >
                {testimonials.map((testimonial, index) => (
                    <TestimonialCard
                        key={testimonial.id}
                        testimonial={testimonial}
                        isActive={activeIndex === index}
                    />
                ))}
            </ScrollView>

            {/* Navigation */}
            <View className="flex-row items-center justify-center mt-8" style={{ gap: 16 }}>
                <TouchableOpacity
                    onPress={() => scrollToIndex(activeIndex - 1)}
                    className="p-3 rounded-full"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        opacity: activeIndex === 0 ? 0.3 : 1
                    }}
                    disabled={activeIndex === 0}
                >
                    <ChevronLeft size={20} color="white" />
                </TouchableOpacity>

                <View className="flex-row" style={{ gap: 8 }}>
                    {testimonials.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => scrollToIndex(index)}
                        >
                            <View
                                className="rounded-full"
                                style={{
                                    width: activeIndex === index ? 24 : 8,
                                    height: 8,
                                    backgroundColor: activeIndex === index
                                        ? testimonials[index].color
                                        : 'rgba(255,255,255,0.2)',
                                }}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={() => scrollToIndex(activeIndex + 1)}
                    className="p-3 rounded-full"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        opacity: activeIndex === testimonials.length - 1 ? 0.3 : 1
                    }}
                    disabled={activeIndex === testimonials.length - 1}
                >
                    <ChevronRight size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
