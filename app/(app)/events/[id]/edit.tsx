import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import ComposerV4 from '@/components/events/composer/v4/ComposerV4';

const BG = '#09090b';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // The v4 one-form composer owns its own fetch + hydrate + loading (see ComposerV4).
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ComposerV4 eventId={id} />
    </View>
  );
}
