import { View } from 'react-native';
import { ComposerStep } from '@/stores/createEventStore';

const TOTAL = 7;

/** 7-segment progress bar — orange for done/current, faint for future (mockup O1–O7). */
export default function ComposerProgress({ current }: { current: ComposerStep }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 20, paddingBottom: 14 }}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: i + 1 <= current ? '#FF6B35' : 'rgba(255,255,255,0.07)',
          }}
        />
      ))}
    </View>
  );
}
