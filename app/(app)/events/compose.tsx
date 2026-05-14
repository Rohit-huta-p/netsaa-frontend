import { Stack } from 'expo-router';
import { View } from 'react-native';
import ComposerShell from '@/components/events/composer/ComposerShell';

export default function ComposeScreen() {
  return (
    <View className="flex-1 bg-event-bg">
      <Stack.Screen options={{ headerShown: false }} />
      <ComposerShell />
    </View>
  );
}
