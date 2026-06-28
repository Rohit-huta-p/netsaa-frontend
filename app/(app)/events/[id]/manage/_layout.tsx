import { Tabs } from 'expo-router';
import { eventTokens } from '@/lib/eventTokens';

export default function ManageLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: eventTokens.bg, borderTopColor: 'rgba(255,255,255,0.08)' },
        tabBarActiveTintColor: eventTokens.brand,
        tabBarInactiveTintColor: eventTokens.textSecondary,
        tabBarLabelStyle: { fontFamily: 'Outfit', fontSize: 12, fontWeight: '600' },
        headerStyle: { backgroundColor: eventTokens.bg },
        headerTitleStyle: { color: eventTokens.textPrimary, fontFamily: 'DMSerifDisplay' },
      }}
    >
      <Tabs.Screen name="overview" options={{ title: 'Overview' }} />
      <Tabs.Screen name="roster" options={{ title: 'Roster' }} />
      <Tabs.Screen name="check-in" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
