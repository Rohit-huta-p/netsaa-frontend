import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle, Target, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function MissionSection() {
    return (
        <View className="px-6 py-16">
            {/* Section Header */}
            <View className="mb-12">
                <View className="flex-row items-center mb-3">
                    <View className="h-[2px] w-8 bg-rose-500 mr-3" />
                    <Text className="text-amber-500 font-bold text-xs uppercase tracking-[2px]">
                        The Reality
                    </Text>
                </View>
                <Text className="text-white text-3xl font-black leading-tight mb-3">
                    India's ₹3.8B{'\n'}
                    Performing Arts{'\n'}
                    <Text className="text-gray-600">Market</Text>
                </Text>
                <Text className="text-gray-400 text-[15px] leading-[24px] max-w-[320px]">
                    Yet talented artists struggle with fragmented opportunities,
                    financial barriers, and lack of recognition.
                </Text>
            </View>

            {/* Challenges Cards */}
            <View className="gap-4 mb-8">
                {/* Challenge 1 */}
                <View className="bg-gradient-to-br from-rose-950/40 to-red-950/20 border border-rose-900/30 rounded-3xl p-5 overflow-hidden relative">
                    <LinearGradient
                        colors={['rgba(220, 38, 127, 0.1)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75 }}
                    />

                    <View className="flex-row items-start mb-3">
                        <View className="bg-rose-500/20 p-2 rounded-xl mr-3">
                            <AlertCircle size={20} color="#f43f5e" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg mb-1">Fragmented & Informal</Text>
                            <Text className="text-gray-400 text-sm leading-relaxed">
                                Opportunities scattered across word-of-mouth networks, making discovery nearly impossible
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Challenge 2 */}
                <View className="bg-gradient-to-br from-orange-950/40 to-amber-950/20 border border-orange-900/30 rounded-3xl p-5 overflow-hidden relative">
                    <LinearGradient
                        colors={['rgba(249, 115, 22, 0.1)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, borderRadius: 75 }}
                    />

                    <View className="flex-row items-start mb-3">
                        <View className="bg-orange-500/20 p-2 rounded-xl mr-3">
                            <Target size={20} color="#f97316" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg mb-1">Unfair Compensation</Text>
                            <Text className="text-gray-400 text-sm leading-relaxed">
                                Artists exploited through unclear contracts and delayed payments, unable to sustain their craft
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Challenge 3 */}
                <View className="bg-gradient-to-br from-yellow-950/40 to-amber-950/20 border border-yellow-900/30 rounded-3xl p-5 overflow-hidden relative">
                    <LinearGradient
                        colors={['rgba(251, 191, 36, 0.1)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: 'absolute', bottom: -50, right: -50, width: 150, height: 150, borderRadius: 75 }}
                    />

                    <View className="flex-row items-start mb-3">
                        <View className="bg-amber-500/20 p-2 rounded-xl mr-3">
                            <TrendingUp size={20} color="#fbbf24" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg mb-1">Limited Growth Path</Text>
                            <Text className="text-gray-400 text-sm leading-relaxed">
                                No structured career development or skill advancement opportunities
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Solution Statement */}
            <View className="bg-gradient-to-br from-emerald-950/30 to-teal-950/20 border-2 border-emerald-500/30 rounded-3xl p-6 mt-8">
                <View className="flex-row items-center mb-4">
                    <View className="h-10 w-1 bg-emerald-500 rounded-full mr-3" />
                    <Text className="text-emerald-400 font-black text-2xl">NETSA's Solution</Text>
                </View>
                <Text className="text-white text-base leading-[26px] font-medium">
                    A transparent, practical platform connecting artists with
                    <Text className="text-emerald-400"> opportunities</Text>,
                    <Text className="text-emerald-400"> fair pay</Text>, and
                    <Text className="text-emerald-400"> career development</Text>.
                </Text>
                <Text className="text-gray-400 text-sm mt-3 leading-relaxed">
                    Every performer deserves access to events, workshops, competitions, and sustainable income.
                </Text>
            </View>
        </View>
    );
}