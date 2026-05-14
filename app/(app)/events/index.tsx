import { Stack } from 'expo-router';
import { View } from 'react-native';
import DiscoveryFeed from '@/components/events/discovery/DiscoveryFeed';

export default function EventsIndexScreen() {
  return (
    <View className="flex-1 bg-event-bg">
      <Stack.Screen options={{ title: 'Events' }} />
      <DiscoveryFeed />
    </View>
  );
}
