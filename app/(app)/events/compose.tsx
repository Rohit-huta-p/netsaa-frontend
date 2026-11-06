import { Stack } from 'expo-router';
import { View } from 'react-native';
import ComposerV4 from '@/components/events/composer/v4/ComposerV4';

export default function ComposeScreen() {
  return (
    <View className="flex-1 bg-event-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ComposerV4 />
    </View>
  );
}
