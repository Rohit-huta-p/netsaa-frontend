import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEvent } from '@/hooks/useEvents';
import { useCreateEventStore, type ComposerStep } from '@/stores/createEventStore';
import ComposerShell from '@/components/events/composer/ComposerShell';

const BG = '#09090b';

export default function EditEventScreen() {
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  const { data: event, isLoading } = useEvent(id);
  const { hydrateFromEvent, setStep, reset } = useCreateEventStore();
  const hydratedRef = useRef(false);

  // Hydrate exactly once when the event data first arrives.
  // The ref guard prevents re-hydration on re-renders (which would stomp edits).
  useEffect(() => {
    if (event && !hydratedRef.current) {
      hydratedRef.current = true;
      hydrateFromEvent(event);
      // Deep-link: ?step=N opens the composer directly on that step — e.g. the
      // poster "add photo" lands on 6 (media). hydrateFromEvent resets step to 1,
      // so this override must run immediately after it (both are sync store sets).
      const target = Number(step);
      if (Number.isInteger(target) && target >= 1 && target <= 7) {
        setStep(target as ComposerStep);
      }
    }
  }, [event, hydrateFromEvent, setStep, step]);

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
