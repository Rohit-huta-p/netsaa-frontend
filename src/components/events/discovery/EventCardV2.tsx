import { View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventDoc } from '@/services/eventService';
import { computeSlotsLeft, isCapacityUrgent } from '@/lib/eventTokens';

interface Props {
  event: EventDoc;
  variant?: 'tall' | 'wide';
}

export default function EventCardV2({ event, variant = 'tall' }: Props) {
  const router = useRouter();
  const slotsLeft = computeSlotsLeft(event.capacity.total, event.capacity.registeredCount);
  const urgent = isCapacityUrgent(event.capacity.total, event.capacity.registeredCount);
  const hero = event.media.find((m) => m.isHero) ?? event.media[0];
  const start = new Date(event.startsAt);
  const width = variant === 'tall' ? 230 : 300;

  return (
    <Pressable
      onPress={() => router.push(`/events/${event._id}`)}
      style={{ width }}
      className="bg-event-surface rounded-2xl overflow-hidden border border-event-border"
    >
      <View style={{ aspectRatio: variant === 'tall' ? 3 / 4 : 16 / 9 }} className="bg-event-bgAlt">
        {hero?.url ? (
          <Image source={{ uri: hero.thumbnailUrl ?? hero.url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center bg-black">
            <Text className="font-serif text-event-brand text-3xl">N</Text>
          </View>
        )}
        {urgent && slotsLeft > 0 ? (
          <View className="absolute top-3 left-3 px-2 py-1 rounded-full bg-event-capacityUrgent">
            <Text className="font-mono text-white text-[10px] uppercase tracking-widest">
              {slotsLeft} left
            </Text>
          </View>
        ) : null}
        {slotsLeft === 0 ? (
          <View className="absolute top-3 left-3 px-2 py-1 rounded-full bg-event-surface/90">
            <Text className="font-mono text-event-textPrimary text-[10px] uppercase tracking-widest">Full</Text>
          </View>
        ) : null}
      </View>
      <View className="p-3 gap-1">
        <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest" numberOfLines={1}>
          {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {' · '}
          {event.location.kind === 'online' ? 'Online' : (event.location.venueName || event.location.address?.split(',')[0])}
        </Text>
        <Text className="font-serif text-event-textPrimary text-base leading-5" numberOfLines={2}>
          {event.title}
        </Text>
        <View className="flex-row flex-wrap gap-1 mt-1">
          {event.topicTags.slice(0, 2).map((t) => (
            <View key={t} className="px-2 py-0.5 rounded-full bg-event-bgAlt">
              <Text className="font-outfit text-event-textSecondary text-[10px]">{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}
