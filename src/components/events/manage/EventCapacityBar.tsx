/**
 * EventCapacityBar — visual fill for event capacity.
 *
 * Gold tint at 80%+ fill, red at 100%. Animated width on mount via
 * Reanimated. Replaces the flat "Fill rate" KPI tile from the old
 * OverviewKpis layout.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated as RNAnimated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import type { EventDoc } from '@/services/eventService';
import {
  computeSlotsLeft,
  CAPACITY_URGENCY_THRESHOLD,
} from '@/lib/eventTokens';

export default function EventCapacityBar({ event }: { event: EventDoc }) {
  const { total = 0, registeredCount = 0 } = event.capacity ?? {};
  const slotsLeft = computeSlotsLeft(total, registeredCount);
  const fillPct = total > 0 ? Math.min(1, registeredCount / total) : 0;
  const isFull = fillPct >= 1;
  const isUrgent = fillPct >= CAPACITY_URGENCY_THRESHOLD;
  const fillColor = isFull ? '#EF4444' : isUrgent ? '#F59E0B' : '#FF6B35';

  const widthAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((rm) => {
      if (cancelled) return;
      RNAnimated.timing(widthAnim, {
        toValue: fillPct,
        duration: rm ? 0 : 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    return () => { cancelled = true; };
  }, [fillPct, widthAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(fillPct * 100), min: 0, max: 100 }}
      accessibilityLabel={`Capacity ${registeredCount} of ${total} registered`}
    >
      <View style={styles.headRow}>
        <View style={styles.headLeft}>
          <Text style={styles.label}>CAPACITY</Text>
          {isUrgent && !isFull && <Text style={styles.urgentTag}>FILLING UP</Text>}
          {isFull && <Text style={styles.fullTag}>SOLD OUT</Text>}
        </View>
        <View style={styles.fractionRow}>
          <Text style={styles.fractionMain}>{registeredCount}</Text>
          <Text style={styles.fractionDenom}>/ {total}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <RNAnimated.View
          style={[styles.fill, { width: animatedWidth, backgroundColor: fillColor }]}
        />
      </View>

      <Text style={styles.footnote}>
        {isFull
          ? 'Event is at capacity.'
          : slotsLeft === 1
            ? '1 seat left.'
            : `${slotsLeft} seats left.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#11111A',
    borderColor: 'rgba(243,239,232,0.09)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    fontSize: 9,
    letterSpacing: 1.6,
    fontFamily: 'Outfit-Bold',
    color: '#B8B1A6',
  },
  urgentTag: {
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: 'Outfit-Bold',
    color: '#F59E0B',
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullTag: {
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: 'Outfit-Bold',
    color: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fractionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  fractionMain: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    letterSpacing: -0.6,
    color: '#F3EFE8',
  },
  fractionDenom: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: '#6B6878',
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(243,239,232,0.05)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 99 },
  footnote: {
    fontSize: 11,
    color: '#B8B1A6',
    fontFamily: 'Outfit-Regular',
  },
});
