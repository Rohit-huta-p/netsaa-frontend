import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
    Eye,
    Heart,
    Users,
    TrendingUp,
    Share2,
    Copy,
    Zap,
    ChevronRight,
    BarChart3,
} from 'lucide-react-native';

interface OrganizerDashboardCardProps {
    gig: any;
    applicationsCount: number;
    onBoostPress?: () => void;
    onSharePress?: () => void;
    onDuplicatePress?: () => void;
}

export const OrganizerDashboardCard: React.FC<OrganizerDashboardCardProps> = ({
    gig,
    applicationsCount,
    onBoostPress,
    onSharePress,
    onDuplicatePress,
}) => {
    // Use real stats from API (gig.stats is returned by getGigById)
    const stats = gig.stats || {};
    const views = stats.views || 0;
    const saves = stats.saves || 0;
    const applications = applicationsCount || stats.applications || 0;
    const conversionRate = views > 0 ? Math.round((applications / views) * 100) : 0;

    return (
        <View className="mb-6">
            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
                GIG PERFORMANCE
            </Text>

            <View className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
                {/* Stats Grid */}
                <View className="flex-row flex-wrap">
                    <View className="w-1/2 p-4 border-r border-b border-white/5">
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className="w-8 h-8 rounded-lg bg-blue-500/10 items-center justify-center">
                                <Eye size={16} color="#3B82F6" />
                            </View>
                            <Text className="text-white font-black text-2xl">{views}</Text>
                        </View>
                        <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                            Total Views
                        </Text>
                    </View>

                    <View className="w-1/2 p-4 border-b border-white/5">
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className="w-8 h-8 rounded-lg bg-pink-500/10 items-center justify-center">
                                <Heart size={16} color="#EC4899" />
                            </View>
                            <Text className="text-white font-black text-2xl">{saves}</Text>
                        </View>
                        <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                            Saved
                        </Text>
                    </View>

                    <View className="w-1/2 p-4 border-r border-white/5">
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className="w-8 h-8 rounded-lg bg-emerald-500/10 items-center justify-center">
                                <Users size={16} color="#10B981" />
                            </View>
                            <Text className="text-white font-black text-2xl">{applications}</Text>
                        </View>
                        <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                            Applications
                        </Text>
                    </View>

                    <View className="w-1/2 p-4">
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className="w-8 h-8 rounded-lg bg-amber-500/10 items-center justify-center">
                                <TrendingUp size={16} color="#F59E0B" />
                            </View>
                            <Text className="text-white font-black text-2xl">{conversionRate}%</Text>
                        </View>
                        <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                            Conversion
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="flex-row p-3 gap-2 bg-white/5">
                    <TouchableOpacity
                        onPress={onBoostPress}
                        className="flex-1 flex-row items-center justify-center gap-2 py-3 bg-blue-500/10 rounded-xl border border-blue-500/20"
                    >
                        <Zap size={16} color="#3B82F6" />
                        <Text className="text-blue-400 text-xs font-bold">Boost</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onSharePress}
                        className="flex-1 flex-row items-center justify-center gap-2 py-3 bg-zinc-800/50 rounded-xl border border-white/5"
                    >
                        <Share2 size={16} color="#A1A1AA" />
                        <Text className="text-zinc-300 text-xs font-bold">Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onDuplicatePress}
                        className="flex-1 flex-row items-center justify-center gap-2 py-3 bg-zinc-800/50 rounded-xl border border-white/5"
                    >
                        <Copy size={16} color="#A1A1AA" />
                        <Text className="text-zinc-300 text-xs font-bold">Duplicate</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
