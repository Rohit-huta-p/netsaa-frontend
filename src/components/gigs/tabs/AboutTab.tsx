import React from 'react';
import { View, Text } from 'react-native';
import { Zap } from 'lucide-react-native';

interface AboutTabProps {
    gig: any;
}

/**
 * About tab content — description, tags, and additional benefits.
 */
export const AboutTab: React.FC<AboutTabProps> = ({ gig }) => (
    <View className="space-y-6">
        {/* Description */}
        <View>
            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                GIG OVERVIEW
            </Text>
            <View className="border-l-4 border-blue-500/30 pl-6">
                <Text className="text-md text-zinc-300 leading-relaxed font-light">
                    {gig.description || 'No description provided.'}
                </Text>
            </View>
        </View>

        {/* Tags */}
        {gig.tags && gig.tags.length > 0 && (
            <View>
                <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                    TAGS
                </Text>
                <View className="flex-row flex-wrap gap-2">
                    {gig.tags.map((tag: string, idx: number) => (
                        <View
                            key={idx}
                            className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg"
                        >
                            <Text className="text-zinc-400 text-xs">#{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>
        )}

        {/* Additional Benefits */}
        {gig.compensation?.perks && gig.compensation.perks.length > 0 && (
            <View>
                <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">
                    ADDITIONAL BENEFITS
                </Text>
                <View className="space-y-3">
                    {gig.compensation.perks.map((perk: string, idx: number) => (
                        <View
                            key={idx}
                            className="flex-row items-center gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-white/5"
                        >
                            <View className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 items-center justify-center">
                                <Zap size={18} color="#A855F7" />
                            </View>
                            <Text className="flex-1 text-base text-zinc-300">{perk}</Text>
                        </View>
                    ))}
                </View>
            </View>
        )}
    </View>
);
