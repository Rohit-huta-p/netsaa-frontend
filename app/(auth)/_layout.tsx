// app/(auth)/_layout.tsx
import React from 'react';
import { Stack, Slot } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Slot />
        </Stack>
    );
}