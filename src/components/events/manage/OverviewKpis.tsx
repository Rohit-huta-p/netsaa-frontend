import { View, Text } from 'react-native';
import type { EventDoc } from '@/services/eventService';
import { computeSlotsLeft } from '@/lib/eventTokens';

export default function OverviewKpis({ event }: { event: EventDoc }) {
  const slotsLeft = computeSlotsLeft(event.capacity.total, event.capacity.registeredCount);
  const start = new Date(event.startsAt);
  const hoursToGo = Math.max(0, Math.floor((start.getTime() - Date.now()) / 3_600_000));
  const daysToGo = Math.floor(hoursToGo / 24);

  const fillPct = event.capacity.total > 0
    ? Math.round((event.capacity.registeredCount / event.capacity.total) * 100)
    : 0;

  return (
    <View className="flex-row flex-wrap gap-3">
      <Kpi label="Registered" value={`${event.capacity.registeredCount}`} sub={`/ ${event.capacity.total}`} />
      <Kpi label="Fill rate" value={`${fillPct}%`} sub={`${slotsLeft} left`} />
      <Kpi label="Time to event" value={daysToGo > 0 ? `${daysToGo}d` : `${hoursToGo}h`} sub={daysToGo > 0 ? `${hoursToGo % 24}h` : ''} />
      <Kpi label="Views" value={`${event.stats?.views ?? 0}`} sub="" />
    </View>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View className="flex-1 min-w-[44%] rounded-2xl bg-event-surface border border-event-border p-4">
      <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest mb-2">{label}</Text>
      <View className="flex-row items-baseline gap-2">
        <Text className="font-serif text-event-textPrimary text-3xl">{value}</Text>
        {sub ? <Text className="font-outfit text-event-textSecondary text-xs">{sub}</Text> : null}
      </View>
    </View>
  );
}
