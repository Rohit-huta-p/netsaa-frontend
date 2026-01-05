import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Users, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const events = [
    {
        id: 1,
        type: 'Workshop',
        title: 'Contemporary Flow',
        date: 'Dec 15 • 7:00 PM',
        location: 'NYC',
        image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        color: '#db2777', // Pink
    },
    {
        id: 2,
        type: 'Battle',
        title: 'Street Heat Finals',
        date: 'Dec 18 • 6:00 PM',
        location: 'Brooklyn',
        image: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        color: '#ef4444', // Red
    },
    {
        id: 3,
        type: 'Intensive',
        title: 'Ballet Masterclass',
        date: 'Dec 20-21',
        location: 'Manhattan',
        image: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        color: '#f59e0b', // Orange
    },
];

export function EventsSection() {
    return (
        <View className="py-8">
            <View className="px-6 mb-6">
                <Text className="text-teal-400 font-bold text-xs uppercase tracking-widest mb-2">
                    What's On
                </Text>
                <Text className="text-3xl font-black text-white">
                    Trending <Text className="text-gray-500">Gigs</Text>
                </Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            >
                {events.map((event) => (
                    <TouchableOpacity
                        key={event.id}
                        activeOpacity={0.9}
                        className="w-[260px] bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
                    >
                        {/* Image Container */}
                        <View className="h-40 bg-gray-900 relative">
                            <Image
                                source={{ uri: event.image }}
                                className="w-full h-full opacity-80"
                                resizeMode="cover"
                            />
                            {/* Gradient Fade */}
                            <LinearGradient
                                colors={['transparent', '#000']}
                                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 }}
                            />

                            {/* Floating Badge */}
                            <View
                                className="absolute top-3 left-3 px-3 py-1 rounded-full backdrop-blur-md"
                                style={{ backgroundColor: event.color }}
                            >
                                <Text className="text-white text-[10px] font-bold uppercase">{event.type}</Text>
                            </View>

                            <View className="absolute top-3 right-3 bg-black/40 p-1.5 rounded-full backdrop-blur-sm">
                                <Heart size={14} color="#fff" />
                            </View>
                        </View>

                        {/* Content */}
                        <View className="p-4 space-y-3">
                            <Text className="text-lg font-bold text-white leading-tight">
                                {event.title}
                            </Text>

                            <View className="space-y-2">
                                <View className="flex-row items-center gap-2">
                                    <Calendar size={12} color="#9ca3af" />
                                    <Text className="text-xs text-gray-400 font-medium">{event.date}</Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                    <MapPin size={12} color="#9ca3af" />
                                    <Text className="text-xs text-gray-400 font-medium">{event.location}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}