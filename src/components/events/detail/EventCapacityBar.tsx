import { View, Text } from 'react-native';
import { computeSlotsLeft, isCapacityUrgent, eventTokens } from '@/lib/eventTokens';

interface Props {
  total: number;
  registeredCount: number;
}

export default function EventCapacityBar({ total, registeredCount }: Props) {
  const slotsLeft = computeSlotsLeft(total, registeredCount);
  const urgent = isCapacityUrgent(total, registeredCount);
  const isFull = slotsLeft === 0;
  const fillPct = total > 0 ? Math.min(100, (registeredCount / total) * 100) : 0;

  const fillColor = isFull
    ? eventTokens.textMuted ?? '#6E6C76'
    : urgent
      ? eventTokens.capacityUrgent
      : eventTokens.brand;

  return (
    <View className="px-6 py-6 mt-2 bg-event-bg gap-3">
      <View className="flex-row justify-between items-baseline">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Capacity
        </Text>
        <Text className="font-outfit text-event-textPrimary text-sm">
          {isFull ? 'Event full' : `${slotsLeft} ${slotsLeft === 1 ? 'spot' : 'spots'} left`}
        </Text>
      </View>
      <View className="h-2 rounded-full bg-event-surface overflow-hidden">
        <View
          testID="capacity-bar-fill"
          style={{
            width: `${fillPct}%`,
            height: '100%',
            backgroundColor: fillColor,
          }}
        />
      </View>
      <Text className="font-outfit text-event-textSecondary text-xs">
        {registeredCount} of {total} registered
      </Text>
    </View>
  );
}
