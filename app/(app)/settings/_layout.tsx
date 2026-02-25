// app/(app)/settings/_layout.tsx
import { Stack } from 'expo-router';

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: '#09090b' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { fontFamily: 'Outfit-SemiBold', fontSize: 17 },
                headerShadowVisible: false,
            }}
        />
    );
}
