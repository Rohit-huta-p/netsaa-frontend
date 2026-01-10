import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Quote, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const testimonials = [
    {
        id: 1,
        name: 'Priya Sharma',
        role: 'Classical Dancer',
        location: 'Mumbai',
        quote: 'NETSA transformed my passion into a sustainable career. I now earn consistently and connect with quality opportunities that respect my craft.',
        achievement: '15+ gigs completed',
        gradient: ['#ec4899', '#db2777'],
    },
    {
        id: 2,
        name: 'Arjun Patel',
        role: 'Theatre Artist',
        location: 'Delhi',
        quote: 'Finally, a platform that values artists fairly. Clear contracts, timely payments, and respect for our work.',
        achievement: '₹2.4L earned in 6 months',
        gradient: ['#8b5cf6', '#7c3aed'],
    },
    {
        id: 3,
        name: 'Meera Iyer',
        role: 'Folk Musician',
        location: 'Bangalore',
        quote: 'The workshops helped me refine my skills while the gig marketplace connected me with audiences who appreciate traditional arts.',
        achievement: 'Skill level: Intermediate → Expert',
        gradient: ['#f59e0b', '#d97706'],
    },
];

export function TestimonialSection() {
    return (
        <View className="py-12">
            {/* Section Header */}
            <View className="px-6 mb-8">
                <View className="flex-row items-center mb-3">
                    <View className="h-[2px] w-8 bg-rose-500 mr-3" />
                    <Text className="text-amber-500 font-bold text-xs uppercase tracking-[2px]">
                        Artist Stories
                    </Text>
                </View>
                <Text className="text-white text-3xl font-black leading-tight mb-2">
                    Voices of{'\n'}
                    <Text className="text-gray-600">Success</Text>
                </Text>
                <Text className="text-gray-400 text-sm leading-relaxed max-w-[300px]">
                    Real artists sharing their journey with NETSA
                </Text>
            </View>

            {/* Testimonials Horizontal Scroll */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                className="mb-8"
            >
                {testimonials.map((testimonial) => (
                    <View
                        key={testimonial.id}
                        className="w-[300px] bg-white/[0.03] border border-white/10 rounded-3xl p-6 overflow-hidden relative"
                        style={{
                            shadowColor: testimonial.gradient[0],
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.2,
                            shadowRadius: 12,
                            elevation: 6,
                        }}
                    >
                        {/* Decorative gradient blob */}
                        {/* <LinearGradient
                            colors={[...testimonial.gradient.map(c => `${c}20`), 'transparent'] as [string, string, ...string[]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                position: 'absolute',
                                top: -60,
                                right: -60,
                                width: 150,
                                height: 150,
                                borderRadius: 75
                            }}
                        /> */}

                        {/* Quote Icon */}
                        <View className="mb-4">
                            <LinearGradient
                                colors={testimonial.gradient as [string, string, ...string[]]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-10 h-10 rounded-xl items-center justify-center"
                            >
                                <Quote size={18} color="#fff" />
                            </LinearGradient>
                        </View>

                        {/* Quote Text */}
                        <Text className="text-white text-[15px] leading-[24px] mb-5 font-medium">
                            "{testimonial.quote}"
                        </Text>

                        {/* Artist Info */}
                        <View className="border-t border-white/10 pt-4">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-base">
                                        {testimonial.name}
                                    </Text>
                                    <Text className="text-gray-400 text-xs">
                                        {testimonial.role} • {testimonial.location}
                                    </Text>
                                </View>

                                {/* Rating */}
                                <View className="flex-row">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} size={12} fill="#fbbf24" color="#fbbf24" />
                                    ))}
                                </View>
                            </View>

                            {/* Achievement Badge */}
                            <View className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 self-start">
                                <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                    {testimonial.achievement}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Trust Indicators */}
            <View className="px-6">
                <View className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <View className="flex-row items-center justify-around">
                        <View className="items-center">
                            <Text className="text-emerald-400 text-2xl font-black mb-1">4.8/5</Text>
                            <Text className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                                Artist Rating
                            </Text>
                        </View>

                        <View className="h-10 w-[1px] bg-white/10" />

                        <View className="items-center">
                            <Text className="text-purple-400 text-2xl font-black mb-1">98%</Text>
                            <Text className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                                On-Time Pay
                            </Text>
                        </View>

                        <View className="h-10 w-[1px] bg-white/10" />

                        <View className="items-center">
                            <Text className="text-amber-400 text-2xl font-black mb-1">24hr</Text>
                            <Text className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                                Avg Response
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}