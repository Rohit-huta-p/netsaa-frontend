import React, { useCallback } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { EventDetails } from '@/components/events/EventDetails';
import { useEvent } from '@/hooks/useEvents';

import { OrganizerEventDetails } from '@/components/events/OrganizerEventDetails';
import useAuthStore from '@/stores/authStore';

export default function EventDetailsPage() {
    const { id } = useLocalSearchParams();
    const eventId = Array.isArray(id) ? id[0] : id;
    const { data: event, isLoading, error, refetch } = useEvent(eventId || '');
    const user = useAuthStore((state) => state.user);

    useFocusEffect(
        useCallback(() => {
            if (eventId) {
                refetch();
            }
        }, [eventId, refetch])
    );

    if (isLoading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#A855F7" />
            </View>
        );
    }

    if (error || !event) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <Text className="text-red-500">Failed to load event details.</Text>
            </View>
        );
    }

    // Determine if the current user is the organizer of this event
    const isOrganizer = user?._id === event.organizerId;

    return (
        <View className="flex-1 rounded-2xl ">
            <Stack.Screen options={{
                title: isOrganizer ? 'Manage Event' : 'Event Details',
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
                headerBackTitle: ''
            }} />

            {isOrganizer ? (
                <OrganizerEventDetails event={event} key={event.updatedAt || event._id} />
            ) : (
                <EventDetails event={event} key={event.updatedAt || event._id} isOrganizer={isOrganizer} />
            )}
        </View>
    );
}
