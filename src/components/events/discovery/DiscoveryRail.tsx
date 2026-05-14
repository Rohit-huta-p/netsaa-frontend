import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import EventCardV2 from './EventCardV2';

interface Props {
  title: string;
  events: EventDoc[];
  isLoading: boolean;
  variant?: 'tall' | 'wide';
}

export default function DiscoveryRail({ title, events, isLoading, variant = 'tall' }: Props) {
  return (
    <View className="gap-3 py-4">
      <Text className="font-serif text-event-textPrimary text-xl px-6">{title}</Text>
      {isLoading ? (
        <View className="px-6 py-8"><ActivityIndicator color="#FF6B35" /></View>
      ) : events.length === 0 ? (
        <Text className="font-outfit text-event-textMuted text-xs px-6">Nothing here yet.</Text>
      ) : (
        <FlatList
          horizontal
          data={events}
          keyExtractor={(e) => e._id}
          renderItem={({ item }) => <EventCardV2 event={item} variant={variant} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        />
      )}
    </View>
  );
}
