import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useEventRoster } from '@/hooks/useEventRoster';
import RosterRowComponent from './RosterRow';

const EVENTS_MANAGE_CSV_EXPORT = process.env.EXPO_PUBLIC_FEATURE_EVENTS_CSV_EXPORT === '1';

export default function RosterList({ eventId }: { eventId: string }) {
  const { data, isLoading } = useEventRoster(eventId);

  if (isLoading) return <View className="flex-1 items-center justify-center"><ActivityIndicator color="#FF6B35" /></View>;
  const rows = data?.rows ?? [];

  if (rows.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8 py-12">
        <Text className="font-serif text-event-textPrimary text-xl mb-2">No registrations yet</Text>
        <Text className="font-outfit text-event-textSecondary text-center text-sm leading-5">
          Once artists RSVP, you'll see them here with name and city. Phone numbers are shared only at the hire-confirmation step.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="px-5 py-4 border-b border-event-border flex-row items-center justify-between">
        <Text className="font-outfit text-event-textPrimary text-sm">
          {rows.length} registered
        </Text>
        {EVENTS_MANAGE_CSV_EXPORT ? (
          <Text className="font-outfit text-event-brand text-sm">Export CSV</Text>
        ) : null}
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r._id}
        renderItem={({ item }) => <RosterRowComponent row={item} />}
      />
    </View>
  );
}
