import { View, Pressable, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Edit3, XCircle, Clock } from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';
import { eventTokens } from '@/lib/eventTokens';

// Feature flags — flip on once backend Plan 6 Tasks 13-14 land
const EVENTS_MANAGE_CANCEL_RESCHEDULE = process.env.EXPO_PUBLIC_FEATURE_EVENTS_CANCEL_RESCHEDULE === '1';

export default function OverviewActions({ event }: { event: EventDoc }) {
  const router = useRouter();

  return (
    <View className="gap-3">
      <Pressable
        onPress={() => Alert.alert('Edit', 'Editing live events ships in V2.')}
        className="flex-row items-center gap-3 p-4 rounded-2xl bg-event-surface border border-event-border"
      >
        <Edit3 size={20} color={eventTokens.textSecondary} />
        <Text className="font-outfit text-event-textPrimary text-base flex-1">Edit details</Text>
      </Pressable>

      {EVENTS_MANAGE_CANCEL_RESCHEDULE ? (
        <>
          <Pressable
            onPress={() => Alert.alert('Reschedule', 'Coming soon — backend wiring in progress.')}
            className="flex-row items-center gap-3 p-4 rounded-2xl bg-event-surface border border-event-border"
          >
            <Clock size={20} color={eventTokens.gold} />
            <Text className="font-outfit text-event-textPrimary text-base flex-1">Reschedule event</Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('Cancel', 'Coming soon — backend wiring in progress.')}
            className="flex-row items-center gap-3 p-4 rounded-2xl bg-event-surface border border-event-capacityUrgent"
          >
            <XCircle size={20} color={eventTokens.capacityUrgent} />
            <Text className="font-outfit text-event-capacityUrgent text-base flex-1">Cancel event</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
