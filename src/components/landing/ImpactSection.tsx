import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, DollarSign, Award, Users2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const impacts = [
    {
        id: 1,
        icon: TrendingUp,
        metric: '3.2x',
        label: 'Income Growth',
        description: 'Average artist earnings increased after joining NETSA',
        gradient: ['#10b981', '#059669'],
    },
    {
        id: 2,
        icon: DollarSign,
        metric: '₹18.5Cr',
        label: 'Paid to Artists',
        description: 'Total earnings distributed through the platform',
        gradient: ['#f59e0b', '#d97706'],
    },
    {
        id: 3,
        icon: Award,
        metric: '92%',
        label: 'Fair Contracts',
        description: 'Artists report transparent payment terms',
        gradient: ['#8b5cf6', '#7c3aed'],
    },
    {
        id: 4,
        icon: Users2,
        metric: '5,000+',
        label: 'Active Artists',
        description: 'Building sustainable careers in performing arts',
        gradient: ['#ec4899', '#db2777'],
    },
];

export function ImpactSection() {
    return (
        <View className="px-6 py-16">
            {/* Section Header */}
            <View className="mb-12">
                <View className="flex-row items-center mb-3">
                    <View className="h-[2px] w-8 bg-rose-500 mr-3" />
                    <Text className="text-amber-500 font-bold text-xs uppercase tracking-[2px]">
                        Real Impact
                    </Text>
                </View>
                <Text className="text-white text-3xl font-black leading-tight mb-3">
                    Transforming{'\n'}
                    <Text className="text-gray-600">Artist Careers</Text>
                </Text>
                <Text className="text-gray-400 text-sm leading-relaxed max-w-[300px]">
                    Measurable results from artists who've built their careers with NETSA
                </Text>
            </View>

            {/* Impact Metrics Grid */}
            <View className="flex-row flex-wrap justify-between gap-4 mb-12">
                {impacts.map((impact) => (
                    <View
                        key={impact.id}
                        className="w-[48%] overflow-hidden rounded-2xl"
                        style={{
                            shadowColor: impact.gradient[0],
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 12,
                            elevation: 6,
                        }}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                            className="p-5 border border-white/10"
                        >
                            {/* Icon */}
                            <LinearGradient
                                colors={impact.gradient as [string, string, ...string[]]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-11 h-11 rounded-xl items-center justify-center mb-4"
                            >
                                <impact.icon size={20} color="#fff" />
                            </LinearGradient>

                            {/* Metric */}
                            <Text className="text-white font-black text-2xl mb-1">
                                {impact.metric}
                            </Text>

                            {/* Label */}
                            <Text className="text-white font-bold text-sm mb-2">
                                {impact.label}
                            </Text>

                            {/* Description */}
                            <Text className="text-gray-400 text-[11px] leading-relaxed">
                                {impact.description}
                            </Text>
                        </LinearGradient>
                    </View>
                ))}
            </View>

            {/* Growth Projection */}
            <View className="bg-gradient-to-br from-indigo-950/40 to-purple-950/20 border-2 border-indigo-500/30 rounded-3xl p-6 overflow-hidden relative">
                {/* Decorative circles */}
                <View
                    className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-500/10 rounded-full"
                />
                <View
                    className="absolute -left-8 -bottom-8 w-24 h-24 bg-purple-500/10 rounded-full"
                />

                <View className="relative z-10">
                    <Text className="text-indigo-400 font-black text-sm uppercase tracking-wider mb-3">
                        Market Growth
                    </Text>
                    <Text className="text-white text-2xl font-black leading-tight mb-2">
                        ₹3.8B → ₹7B
                    </Text>
                    <Text className="text-gray-300 text-sm font-semibold mb-1">
                        India's performing arts market
                    </Text>
                    <Text className="text-gray-400 text-xs leading-relaxed">
                        Projected by 2027 - Join the movement and grow with the industry
                    </Text>

                    <View className="flex-row items-center mt-4 pt-4 border-t border-white/10">
                        <View className="flex-1">
                            <Text className="text-emerald-400 text-xl font-black">84%</Text>
                            <Text className="text-gray-400 text-[10px] font-medium uppercase">Growth Rate</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-purple-400 text-xl font-black">2027</Text>
                            <Text className="text-gray-400 text-[10px] font-medium uppercase">Target Year</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}