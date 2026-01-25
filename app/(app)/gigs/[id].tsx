import React from 'react';
import { View, ActivityIndicator, Text, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { GigDetails } from '../../../src/components/gigs/GigDetails';
import { LinearGradient } from 'expo-linear-gradient';
import { useGig } from '@/hooks/useGigs';
import { OrganizerGigControls } from '@/components/gigs/OrganizerGigControls';
import useAuthStore from '@/stores/authStore';
import { Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function GigDetailsPage() {
    const { id } = useLocalSearchParams();
    const gigId = Array.isArray(id) ? id[0] : id;
    const { data: gig, isLoading, error } = useGig(gigId || '');
    const user = useAuthStore((state) => state.user);

    if (isLoading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                {/* Spotlight while loading */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        marginLeft: -width * 0.5,
                        width: width,
                        height: height * 0.5,
                    }}
                >
                    <LinearGradient
                        colors={['rgba(59,130,246,0.15)', 'transparent']}
                        locations={[0, 1]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={{ width: '100%', height: '100%' }}
                    />
                </View>
                <View className="items-center z-10">
                    <LoadingAnimation
                        source="https://lottie.host/a9975e00-d157-4513-b40f-77f83c2039be/fJeNBIUK06.lottie"
                        width={200}
                        height={200}
                    />
                    <Text className="text-zinc-500 font-medium text-sm">Loading opportunity...</Text>
                </View>
            </View>
        );
    }

    if (error || !gig) {
        return (
            <View className="flex-1 bg-black justify-center items-center px-8">
                <View className="w-20 h-20 rounded-full items-center justify-center mb-4 bg-red-500/10 border border-red-500/20">
                    <Sparkles size={32} color="#EF4444" />
                </View>
                <Text className="text-white font-black text-2xl text-center mb-2 tracking-tight">Oops!</Text>
                <Text className="text-zinc-400 text-center font-light">
                    This gig may have been filled or removed. Check back for new opportunities!
                </Text>
            </View>
        );
    }

    // Determine if the current user is the organizer of this gig
    const isOwner = user?._id === gig.organizerId;

    return (
        <View className="flex-1 bg-black relative">
            <Stack.Screen
                options={{
                    headerShown: false,
                    presentation: 'card',
                    title: isOwner ? 'Manage Gig' : 'Gig Details',
                    headerStyle: { backgroundColor: '#000000' },
                    headerTintColor: '#fff',
                    headerBackTitle: '',
                    contentStyle: { backgroundColor: '#000000' },
                }}
            />

            {/* Spotlight Effect */}
            <View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    marginLeft: -width * 0.75,
                    width: width * 1.5,
                    height: height * 0.35,
                    pointerEvents: 'none',
                }}
            >
                <LinearGradient
                    colors={['rgba(59,130,246,0.2)', 'rgba(139,92,246,0.1)', 'transparent']}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderBottomLeftRadius: width,
                        borderBottomRightRadius: width,
                    }}
                />
            </View>

            {/* Main Content */}
            <View className="flex-1 relative z-10">
                <GigDetails gig={gig} />
            </View>
        </View>
    );
}