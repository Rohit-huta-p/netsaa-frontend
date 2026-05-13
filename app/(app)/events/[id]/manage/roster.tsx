import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import RosterList from '@/components/events/manage/RosterList';

export default function RosterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-event-bg">
      <RosterList eventId={id} />
    </View>
  );
}
