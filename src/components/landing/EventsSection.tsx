import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Users, Heart, Share2, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface EventCardProps {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    attendees: number;
    price: string;
    category: string;
    imageUrl?: string;
    index: number;
}

const EventCard = ({ event }: { event: EventCardProps }) => {
    const router = useRouter();
    const cardWidth = isWeb ? Math.min(width * 0.35, 340) : width * 0.8;

    return (
        <TouchableOpacity
            onPress={() => router.push(`/events/${event.id}`)}
            activeOpacity={0.9}
            style={{ width: cardWidth, marginRight: 20 }}
        >
            {/* Card Container */}
            <View
                className="rounded-3xl overflow-hidden"
                style={{
                    backgroundColor: 'rgba(26, 26, 36, 0.9)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)'
                }}
            >
                {/* Event Image */}
                <View style={{ height: 200, position: 'relative' }}>
                    {event.imageUrl ? (
                        <Image
                            source={{ uri: event.imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    ) : (
                        <LinearGradient
                            colors={['#ff006e', '#8338ec'] as const}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}

                    {/* Overlay Gradient */}
                    <LinearGradient
                        colors={['transparent', 'rgba(26, 26, 36, 0.8)'] as const}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />

                    {/* Floating Category Badge */}
                    <View style={{ position: 'absolute', top: 16, left: 16 }}>
                        <LinearGradient
                            colors={['#ff006e', '#ff4d94'] as const}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="px-4 py-2 rounded-full flex-row items-center"
                            style={{ gap: 4 }}
                        >
                            <Sparkles size={14} color="white" />
                            <Text className="text-white text-xs font-outfit-bold">{event.category}</Text>
                        </LinearGradient>
                    </View>

                    {/* Price Badge */}
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)',
                        }}
                    >
                        <Text className="text-white text-base font-outfit-black">{event.price}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={{ position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: 12,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.2)',
                            }}
                        >
                            <Heart size={18} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: 12,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.2)',
                            }}
                        >
                            <Share2 size={18} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Card Content */}
                <View className="p-5">
                    <Text className="text-white text-xl font-outfit-black mb-3" style={{ lineHeight: 26 }}>
                        {event.title}
                    </Text>

                    <Text className="text-gray-400 text-sm mb-5 font-outfit" style={{ lineHeight: 20 }} numberOfLines={2}>
                        {event.description}
                    </Text>

                    {/* Event Meta Info */}
                    <View style={{ gap: 12, marginBottom: 20 }}>
                        <View className="flex-row items-center">
                            <View
                                className="p-2 rounded-lg mr-3"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                            >
                                <Calendar size={16} color="#ff006e" />
                            </View>
                            <Text className="text-gray-300 text-sm flex-1 font-outfit">{event.date}</Text>
                        </View>

                        <View className="flex-row items-center">
                            <View
                                className="p-2 rounded-lg mr-3"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                            >
                                <MapPin size={16} color="#8338ec" />
                            </View>
                            <Text className="text-gray-300 text-sm flex-1 font-outfit">{event.location}</Text>
                        </View>

                        <View className="flex-row items-center">
                            <View
                                className="p-2 rounded-lg mr-3"
                                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                            >
                                <Users size={16} color="#3b82f6" />
                            </View>
                            <Text className="text-gray-300 text-sm font-outfit">{event.attendees} interested</Text>
                        </View>
                    </View>

                    {/* CTA Button */}
                    <TouchableOpacity activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#ff006e', '#ff4d94'] as const}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 rounded-2xl"
                        >
                            <Text className="text-white text-center font-outfit-black text-base">Join Event →</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function EventsSection({ scrollY }: { scrollY: any }) {
    const router = useRouter();

    const events = [
        {
            id: '1',
            title: 'Hip-Hop Dance Battle Championship',
            description: 'Annual competition featuring the best street dancers. Prize money and networking opportunities!',
            date: 'Jan 25, 2026 • 6:00 PM',
            location: 'Urban Center, Brooklyn',
            attendees: 120,
            price: 'Free',
            category: '💃 Dance Battle',
            index: 0,
        },
        {
            id: '2',
            title: 'Open Mic Night - Musicians & Singers',
            description: 'Showcase your musical talent in an intimate setting. All genres welcome!',
            date: 'Jan 20, 2026 • 8:00 PM',
            location: 'The Blue Note, Manhattan',
            attendees: 45,
            price: '$10',
            category: '🎵 Live Music',
            index: 1,
        },
        {
            id: '3',
            title: 'DJ Residency Auditions',
            description: "Looking for resident DJs for our weekend slots. Bring your best sets!",
            date: 'Jan 22, 2026 • 10:00 PM',
            location: 'Club Pulse, Miami',
            attendees: 30,
            price: 'Free',
            category: '🎧 DJ Gig',
            index: 2,
        },
        {
            id: '4',
            title: 'Theater Casting Call - Spring Musical',
            description: 'Open auditions for lead and ensemble roles in our upcoming Broadway-style production.',
            date: 'Jan 28, 2026 • 10:00 AM',
            location: 'Civic Theater, LA',
            attendees: 85,
            price: 'Free',
            category: '🎭 Audition',
            index: 3,
        },
        {
            id: '5',
            title: 'Fashion Week Model Casting',
            description: 'Seeking male and female models for Spring/Summer collection runway shows.',
            date: 'Feb 5, 2026 • 2:00 PM',
            location: 'Fashion District, NYC',
            attendees: 200,
            price: 'Free',
            category: '📸 Casting',
            index: 4,
        },
    ];

    return (
        <View className="py-20 relative" style={{ backgroundColor: '#0a0a0f' }}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#0a0a0f', '#1a0b2e', '#0a0a0f'] as const}
                className="absolute inset-0"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />

            {/* Section Header */}
            <View className="px-6 mb-12">
                <View className="flex-row items-center justify-center mb-3">
                    <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <Sparkles size={20} color="#ff006e" style={{ marginHorizontal: 12 }} />
                    <View style={{ height: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                </View>

                <Text className="text-white text-4xl font-outfit-black text-center mb-2">
                    Discover Amazing
                </Text>
                <View className="items-center">
                    <LinearGradient
                        colors={['#ff006e', '#8338ec'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-2 py-1 rounded-lg"
                    >
                        <Text className="text-white text-4xl font-outfit-black">Events & Workshops</Text>
                    </LinearGradient>
                </View>

                <Text className="text-gray-400 text-center mt-4 text-base max-w-md mx-auto font-outfit" style={{ lineHeight: 24 }}>
                    From beginner workshops to professional gigs, find opportunities that ignite your passion
                </Text>
            </View>

            {/* Events Carousel */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
                decelerationRate="fast"
                snapToInterval={isWeb ? undefined : (width * 0.8) + 20}
            >
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </ScrollView>

            {/* View All Button */}
            <View className="px-6 mt-12 items-center">
                <TouchableOpacity
                    onPress={() => router.push('/events')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#8338ec', '#a855f7'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-10 py-4 rounded-2xl"
                        style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                        <Text className="text-white font-outfit-black text-base">Explore All Events →</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}