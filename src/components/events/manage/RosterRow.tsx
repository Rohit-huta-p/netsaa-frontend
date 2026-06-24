import { View, Text } from 'react-native';
import type { RosterRow } from '@/hooks/useEventRoster';

export default function RosterRowComponent({ row }: { row: RosterRow }) {
  const date = new Date(row.registeredAt);
  return (
    <View className="flex-row items-center gap-4 px-5 py-4 border-b border-event-border">
      <View className="w-10 h-10 rounded-full bg-event-surfaceAlt items-center justify-center">
        <Text className="font-serif text-event-textPrimary text-base">{row.name?.[0] ?? '?'}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-outfit text-event-textPrimary text-base">{row.name}</Text>
        <Text className="font-outfit text-event-textSecondary text-xs mt-0.5">
          {row.city ? `${row.city} · ` : ''}{date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      {row.visibility === 'private' ? (
        <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest">Private</Text>
      ) : null}
    </View>
  );
}
