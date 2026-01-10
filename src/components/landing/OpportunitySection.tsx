import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Calendar, BookOpen, Trophy, Briefcase, Music, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const opportunities = [
    {
        id: 1,
        type: 'Live Gigs',
        title: 'Dance Performance',
        location: 'Mumbai • Garba Night',
        fee: '₹8,000',
        date: 'Dec 15',
        icon: Music,
        image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        gradient: ['#dc2626', '#ea580c'],
    },
    {
        id: 2,
        type: 'Workshop',
        title: 'Kathak Intensive',
        location: 'Delhi • 3 Day Program',
        fee: '₹3,500',
        date: 'Dec 18-20',
        icon: BookOpen,
        image: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        gradient: ['#7c3aed', '#a855f7'],
    },
    {
        id: 3,
        type: 'Competition',
        title: 'Theatre Fest 2024',
        location: 'Bangalore • Open Call',
        fee: 'Prize ₹50K',
        date: 'Jan 10',
        icon: Trophy,
        image: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        gradient: ['#f59e0b', '#eab308'],
    },
    {
        id: 4,
        type: 'Corporate',
        title: 'Annual Day Show',
        location: 'Pune • Group Required',
        fee: '₹25,000',
        date: 'Dec 22',
        icon: Briefcase,
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        gradient: ['#0891b2', '#06b6d4'],
    },
];

export function OpportunitySection() {
    return (
        <View className="py-12">
            {/* Section Header */}
            <View className="px-6 mb-8">
                <View className="flex-row items-center mb-3">
                    <View className="h-[2px] w-8 bg-rose-500 mr-3" />
                    <Text className="text-amber-500 font-bold text-xs uppercase tracking-[2px]">
                        Discover
                    </Text>
                </View>
                <Text className="text-white text-3xl font-black leading-tight mb-2">
                    Opportunities{'\n'}
                    <Text className="text-gray-600">Waiting for You</Text>
                </Text>
                <Text className="text-gray-400 text-sm leading-relaxed max-w-[300px]">
                    From live performances to skill-building workshops
                </Text>
            </View>

            {/* Horizontal Scroll of Opportunities */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                className="mb-12"
            >
                {opportunities.map((opp) => (
                    <TouchableOpacity
                        key={opp.id}
                        activeOpacity={0.9}
                        className="w-[280px] bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden"
                        style={{
                            shadowColor: opp.gradient[0],
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 16,
                            elevation: 8,
                        }}
                    >
                        {/* Image with Overlay */}
                        <View className="h-40 relative">
                            <Image
                                source={{ uri: opp.image }}
                                className="w-full h-full"
                                resizeMode="cover"
                                style={{ opacity: 0.7 }}
                            />

                            {/* Dark gradient overlay */}
                            <LinearGradient
                                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}
                            />

                            {/* Type Badge */}
                            <LinearGradient
                                colors={opp.gradient as [string, string, ...string[]]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{
                                    position: 'absolute',
                                    top: 12,
                                    left: 12,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20
                                }}
                            >
                                <View className="flex-row items-center">
                                    <opp.icon size={12} color="#fff" />
                                    <Text className="text-white text-[10px] font-black uppercase ml-1 tracking-wider">
                                        {opp.type}
                                    </Text>
                                </View>
                            </LinearGradient>

                            {/* Date */}
                            <View className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                                <Text className="text-white text-[11px] font-bold">{opp.date}</Text>
                            </View>
                        </View>

                        {/* Content */}
                        <View className="p-5">
                            <Text className="text-white text-lg font-bold mb-2 leading-tight">
                                {opp.title}
                            </Text>

                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-gray-400 text-xs font-medium flex-1">
                                    {opp.location}
                                </Text>
                            </View>

                            <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
                                <Text className="text-emerald-400 text-sm font-black">
                                    {opp.fee}
                                </Text>
                                <TouchableOpacity className="bg-white/10 px-4 py-2 rounded-full">
                                    <Text className="text-white text-xs font-bold">Apply Now</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Stats Overview */}
            <View className="px-6">
                <View className="bg-gradient-to-r from-white/[0.05] to-white/[0.02] border border-white/10 rounded-3xl p-6">
                    <View className="flex-row flex-wrap justify-between gap-y-6">
                        <View className="w-[48%]">
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                                Active Gigs
                            </Text>
                            <Text className="text-white font-black text-3xl">200+</Text>
                            <Text className="text-emerald-400 text-xs font-medium mt-1">
                                ↑ 15% this month
                            </Text>
                        </View>

                        <View className="w-[48%]">
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                                Avg. Payment
                            </Text>
                            <Text className="text-white font-black text-3xl">₹12K</Text>
                            <Text className="text-amber-400 text-xs font-medium mt-1">
                                Fair & transparent
                            </Text>
                        </View>

                        <View className="w-[48%]">
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                                Workshops
                            </Text>
                            <Text className="text-white font-black text-3xl">1,000+</Text>
                            <Text className="text-purple-400 text-xs font-medium mt-1">
                                Skill development
                            </Text>
                        </View>

                        <View className="w-[48%]">
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                                Cities
                            </Text>
                            <Text className="text-white font-black text-3xl">50+</Text>
                            <Text className="text-cyan-400 text-xs font-medium mt-1">
                                Nationwide reach
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}