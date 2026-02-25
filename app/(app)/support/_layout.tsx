import { Stack } from 'expo-router';

export default function SupportLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: '#09090b' },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '700', fontSize: 17, fontFamily: 'Outfit_700Bold' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: '#09090b' },
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Help & Support' }} />
            <Stack.Screen name="search" options={{ title: 'Search Help' }} />
            <Stack.Screen name="category/[slug]" options={{ title: 'Category' }} />
            <Stack.Screen name="article/[slug]" options={{ title: 'Article' }} />
            <Stack.Screen name="new-ticket" options={{ title: 'Contact Support' }} />
            <Stack.Screen name="tickets" options={{ title: 'My Tickets' }} />
            <Stack.Screen name="ticket/[id]" options={{ title: 'Conversation' }} />
        </Stack>
    );
}
