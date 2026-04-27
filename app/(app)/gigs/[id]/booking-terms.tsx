// app/(app)/gigs/[id]/booking-terms.tsx
import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { BookingTermsEditor } from '@/features/booking-terms-editor/BookingTermsEditor';

export default function BookingTermsScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return null;
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <BookingTermsEditor gigId={id} />
        </>
    );
}
