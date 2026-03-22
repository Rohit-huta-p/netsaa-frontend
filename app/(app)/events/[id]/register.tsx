import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { EventRegisterSheet } from '@/components/events/EventRegisterSheet';
import { useEvent, useEventTicketTypes } from '@/hooks/useEvents';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';

export default function EventRegisterPage() {
    const { id } = useLocalSearchParams();
    const eventId = Array.isArray(id) ? id[0] : id as string;

    const { data: event, isLoading: isLoadingEvent } = useEvent(eventId);
    const { data: ticketTypes, isLoading: isLoadingTickets } = useEventTicketTypes(eventId);

    if (isLoadingEvent || isLoadingTickets) {
        return (
            <View className="flex-1 bg-[#111111] justify-center items-center">
                <LoadingAnimation
                    source="https://lottie.host/a9975e00-d157-4513-b40f-77f83c2039be/fJeNBIUK06.lottie"
                    width={150}
                    height={150}
                />
            </View>
        );
    }

    if (!event) return null;

    return (
        <View className="flex-1 bg-[#111111]">
            <EventRegisterSheet
                visible={true} // Now it's always "visible" since it's a dedicated page
                onClose={() => { }} // Won't be used since we'll swap out the close button logic to router.back()
                eventId={eventId}
                ticketTypes={ticketTypes || []}
                ticketPrice={event.ticketPrice}
                event={event}
            />
        </View>
    );
}
