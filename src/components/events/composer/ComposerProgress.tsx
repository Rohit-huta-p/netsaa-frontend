import { View } from 'react-native';
import { ComposerStep } from '@/stores/createEventStore';

const TOTAL = 7;

export default function ComposerProgress({ current }: { current: ComposerStep }) {
  return (
    <View className="flex-row gap-1.5 px-6 mt-2 mb-3">
      {Array.from({ length: TOTAL }).map((_, i) => {
        const idx = i + 1;
        const active = idx <= current;
        return (
          <View
            key={idx}
            className={`flex-1 h-1 rounded-full ${active ? 'bg-event-brand' : 'bg-event-surface'}`}
          />
        );
      })}
    </View>
  );
}
