import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientButton } from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/Button';
import { ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const benefits = [
    'Transparent payment terms & on-time disbursement',
    'Access to 200+ monthly opportunities nationwide',
    'Skill development through expert-led workshops',
    'Fair contracts that protect your interests',
    'Connect with verified organizers and talent scouts',
    'Build your portfolio and get discovered',
];

export function CTASection() {
    const router = useRouter();

    return (
        <View className="px-6 py-16">
            {/* Main CTA Card */}
            <View
                className="rounded-[32px] overflow-hidden relative"
                style={{
                    shadowColor: '#dc2626',
                    shadowOffset: { width: 0, height: 12 },
                    shadowOpacity: 0.4,
                    shadowRadius: 24,
                    elevation: 12,
                }}
            >
                {/* Gradient Background */}
                <LinearGradient
                    colors={['#1a0a0f', '#0f0506', '#0a0a0a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-8 border-2 border-rose-500/30"
                >
                    {/* Decorative light spots */}
                    <View
                        className="absolute -top-20 -right-20 w-48 h-48 bg-rose-500/20 rounded-full"
                        style={{ filter: 'blur(60px)' }}
                    />
                    <View
                        className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full"
                        style={{ filter: 'blur(60px)' }}
                    />

                    <View className="relative z-10">
                        {/* Header */}
                        <View className="items-center mb-8">
                            <Text className="text-white text-[32px] font-black text-center leading-tight mb-3">
                                Your Stage{'\n'}
                                <Text className="text-rose-500">Awaits</Text>
                            </Text>
                            <View className="h-1 w-16 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" />
                        </View>

                        {/* Subheading */}
                        <Text className="text-gray-300 text-center text-base leading-[26px] mb-8 font-medium">
                            Join 5,000+ artists building sustainable careers in India's ₹3.8B performing arts industry
                        </Text>

                        {/* Benefits List */}
                        <View className="mb-8 space-y-3">
                            {benefits.map((benefit, index) => (
                                <View key={index} className="flex-row items-start">
                                    <View className="mt-0.5">
                                        <CheckCircle2 size={18} color="#10b981" fill="#10b981" />
                                    </View>
                                    <Text className="text-gray-300 text-sm ml-3 flex-1 leading-relaxed">
                                        {benefit}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* CTA Buttons */}
                        <View className="space-y-3">
                            <GradientButton
                                label="Start Your Journey Today"
                                colors={["#dc2626", "#ea580c", "#f59e0b"]}
                                onPress={() => router.push('/(auth)/register')}
                                icon={<ArrowRight size={18} color="white" />}
                            />

                            <Button
                                label="Learn More About NETSA"
                                variant="outline"
                                className="border-white/20 bg-white/5"
                                textClassName="text-white font-semibold"
                                onPress={() => {/* Navigate to about page */ }}
                            />
                        </View>

                        {/* Trust Badge */}
                        <View className="mt-8 pt-6 border-t border-white/10 flex-row items-center justify-center">
                            <View className="flex-row items-center">
                                <View className="bg-emerald-500/20 rounded-full p-1 mr-2">
                                    <CheckCircle2 size={14} color="#10b981" fill="#10b981" />
                                </View>
                                <Text className="text-gray-400 text-xs font-medium">
                                    Free to join • No hidden fees • Cancel anytime
                                </Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Footer Message */}
            <View className="mt-12 items-center">
                <Text className="text-gray-500 text-xs text-center leading-relaxed max-w-[280px]">
                    Empowering artists across India to turn their passion into profession.
                    Built by artists, for artists.
                </Text>
            </View>
        </View>
    );
}