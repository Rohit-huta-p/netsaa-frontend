import { useMemo, useState } from 'react';
import { View, StyleSheet, PanResponder, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function fracFromX(x: number, width: number): number {
  if (width <= 0) return 0;
  return Math.max(0, Math.min(1, x / width));
}

export default function VideoScrubber({ progress, onSeek }: { progress: number; onSeek: (frac: number) => void }) {
  const [width, setWidth] = useState(0);
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => onSeek(fracFromX(e.nativeEvent.locationX, width)),
        onPanResponderMove: (e) => onSeek(fracFromX(e.nativeEvent.locationX, width)),
      }),
    [width, onSeek],
  );

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      hitSlop={{ top: 12, bottom: 12 }}
      {...pan.panHandlers}
      style={styles.track}
      accessibilityRole="adjustable"
      accessibilityValue={{ now: Math.round(pct), min: 0, max: 100 }}
    >
      <LinearGradient colors={['#FF8A5B', '#FF6B35']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
      <View style={[styles.thumb, { left: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99 },
  thumb: { position: 'absolute', width: 11, height: 11, borderRadius: 6, marginLeft: -5, backgroundColor: '#fff' },
});
