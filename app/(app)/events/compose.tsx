import { Stack } from 'expo-router';
import { View } from 'react-native';
import ComposerShell from '@/components/events/composer/ComposerShell';
import ComposerV4 from '@/components/events/composer/v4/ComposerV4';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function ComposeScreen() {
  const { eventComposerV4 } = useFeatureFlags();
  return (
    <View className="flex-1 bg-event-bg">
      <Stack.Screen options={{ headerShown: false }} />
      {eventComposerV4 ? <ComposerV4 /> : <ComposerShell />}
    </View>
  );
}
