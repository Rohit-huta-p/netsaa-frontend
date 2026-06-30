import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEvent } from '@/hooks/useEvents';
import { useCreateEventStore } from '@/stores/createEventStore';
import ComposerShell from '@/components/events/composer/ComposerShell';

const BG = '#09090b';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const { hydrateFromEvent, reset } = useCreateEventStore();
  const hydratedRef = useRef(false);

  // Hydrate exactly once when the event data first arrives.
  // The ref guard prevents re-hydration on re-renders (which would stomp edits).
  useEffect(() => {
    if (event && !hydratedRef.current) {
      hydratedRef.current = true;
      hydrateFromEvent(event);
    }
  }, [event, hydrateFromEvent]);

  // On unmount, reset so a subsequent "create" starts fresh.
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  if (isLoading || !event) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ComposerShell />
    </View>
  );
}
