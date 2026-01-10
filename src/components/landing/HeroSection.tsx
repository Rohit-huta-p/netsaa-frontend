import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { GradientButton } from '../ui/GradientButton';
import { Button } from '../ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function HeroSection() {
    const router = useRouter();
    const video = React.useRef(null);
    const { height } = useWindowDimensions();

    return (
        <View
            className="relative justify-end overflow-hidden"
            style={{ height: Math.max(650, height * 0.85) }}
        >
            {/* Background Video */}
            <Video
                ref={video}
                style={{
                    position: 'absolute',
                    top: 0, left: 0, bottom: 0, right: 0,
                    opacity: 0.5
                }}
                source={require('../../../assets/header-video.mp4')}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
            />

            {/* Dramatic spotlight gradient overlay */}
            <LinearGradient
                colors={[
                    'rgba(10, 10, 10, 0)',
                    'rgba(10, 10, 10, 0.4)',
                    'rgba(10, 10, 10, 0.9)',
                    '#0a0a0a'
                ]}
                locations={[0, 0.4, 0.7, 1]}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />

            {/* Accent light from top */}
            <LinearGradient
                colors={['rgba(220, 38, 127, 0.15)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    position: 'absolute',
                    left: -100,
                    top: -100,
                    width: 400,
                    height: 400,
                    borderRadius: 200
                }}
            />

            <View className="px-6 pb-16 z-10">
                {/* Authentic Badge */}
                <View className="mb-6">
                    <View className="self-start flex-row items-center bg-gradient-to-r from-rose-900/30 to-amber-900/30 border border-rose-500/30 px-4 py-2 rounded-full backdrop-blur-md">
                        <Sparkles size={14} color="#fbbf24" />
                        <Text className="text-amber-200 font-bold text-[11px] uppercase tracking-[2px] ml-2">
                            India's Performing Arts Network
                        </Text>
                    </View>
                </View>

                {/* Powerful Headline */}
                <View className="mb-8">
                    <Text
                        className="text-white font-black text-[52px] leading-[58px] tracking-tight mb-3"
                        style={{ fontFamily: 'System' }}
                    >
                        Your Talent{'\n'}
                        Deserves{'\n'}
                        <Text className="text-rose-500">Recognition</Text>
                    </Text>

                    <View className="h-1 w-16 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full mt-2" />
                </View>

                {/* Mission Statement */}
                <Text className="text-gray-300 text-[17px] leading-[28px] mb-2 font-medium max-w-[340px]">
                    Turn your passion into profession.
                </Text>
                <Text className="text-gray-400 text-[15px] leading-[24px] mb-10 max-w-[340px]">
                    Connect with <Text className="text-amber-400 font-semibold">opportunities</Text>,
                    earn <Text className="text-emerald-400 font-semibold">fair pay</Text>, and
                    build a <Text className="text-rose-400 font-semibold">sustainable career</Text> in the performing arts.
                </Text>

                {/* CTA Buttons */}
                <View className="gap-3">
                    <GradientButton
                        label="Start Your Journey"
                        colors={["#dc2626", "#ea580c", "#f59e0b"]}
                        onPress={() => router.push('/(auth)/register')}
                        icon={<ArrowRight size={18} color="white" />}
                    />

                    <Button
                        label="Explore Opportunities"
                        variant="outline"
                        className="border-white/20 bg-white/5 backdrop-blur-md"
                        textClassName="text-white font-semibold"
                    />
                </View>

                {/* Trust Indicator */}
                <View className="mt-10 flex-row items-center">
                    <View className="flex-row -space-x-3 mr-3">
                        {[1, 2, 3, 4].map((i) => (
                            <View
                                key={i}
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 border-2 border-[#0a0a0a]"
                            />
                        ))}
                    </View>
                    <View>
                        <Text className="text-white font-bold text-sm">5,000+ Artists</Text>
                        <Text className="text-gray-500 text-xs">Building careers with NETSA</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}