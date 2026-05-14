import { useLocalSearchParams } from 'expo-router';
import { View, ScrollView, ActivityIndicator, Text } from 'react-native';
import { useEvent } from '@/hooks/useEvents';
import OverviewKpis from '@/components/events/manage/OverviewKpis';
import OverviewActions from '@/components/events/manage/OverviewActions';

export default function OverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);

  if (isLoading) return (
    <View className="flex-1 items-center justify-center bg-event-bg">
      <ActivityIndicator color="#FF6B35" />
    </View>
  );
  if (!event) return null;

  return (
    <ScrollView className="flex-1 bg-event-bg" contentContainerStyle={{ padding: 24, gap: 20 }}>
      <View>
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest mb-2">Event</Text>
        <Text className="font-serif text-event-textPrimary text-2xl">{event.title}</Text>
      </View>
      <OverviewKpis event={event} />
      <OverviewActions event={event} />
    </ScrollView>
  );
}
