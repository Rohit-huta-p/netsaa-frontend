import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { GigDetails } from '../../../src/components/gigs/GigDetails';

import { useGig } from '@/hooks/useGigs';
import { ActivityIndicator, Text } from 'react-native';


import { OrganizerGigControls } from '@/components/gigs/OrganizerGigControls';
import useAuthStore from '@/stores/authStore';

export default function GigDetailsPage() {
    const { id } = useLocalSearchParams();
    const gigId = Array.isArray(id) ? id[0] : id;
    const { data: gig, isLoading, error } = useGig(gigId || '');
    const user = useAuthStore((state) => state.user);

    if (isLoading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#A855F7" />
            </View>
        );
    }

    if (error || !gig) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <Text className="text-red-500">Failed to load gig details.</Text>
            </View>
        );
    }

    // Determine if the current user is the organizer of this gig
    const isOwner = user?._id === gig.organizerId;

    return (
        <View className="flex-1 bg-gray-50 relative ">
            <Stack.Screen options={{
                headerShown: false,
                presentation: 'containedModal', // optional
                title: isOwner ? 'Manage Gig' : 'Gig Details',
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
                headerBackTitle: '',
                contentStyle: { backgroundColor: '#F9FAFB' },
            }} />

            {isOwner ? (
                <OrganizerGigControls gig={gig} />
            ) : (
                <GigDetails gig={gig} />
            )}
        </View>
    );
}
