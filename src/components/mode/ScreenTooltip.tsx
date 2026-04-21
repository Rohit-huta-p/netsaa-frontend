// netsa-mobile/src/components/mode/ScreenTooltip.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, AccessibilityInfo, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useScreenTooltip } from '../../hooks/useScreenTooltip';

interface Props {
  screenId: string;
  anchorTop?: number; // px from top of screen where tooltip should appear
  anchorRight?: number;
  copy: string;
  ctaLabel?: string;
}

export default function ScreenTooltip({
  screenId,
  anchorTop = 120,
  anchorRight = 20,
  copy,
  ctaLabel = 'Got it',
}: Props) {
  const { shouldShow, dismiss } = useScreenTooltip(screenId);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldShow) return;
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 300);
    return () => clearTimeout(t);
  }, [shouldShow, opacity]);

  if (!shouldShow) return null;

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.card,
        { top: anchorTop, right: anchorRight, opacity },
      ]}
    >
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={dismiss}
        accessibilityLabel="Dismiss tooltip"
      >
        <X size={14} color="#F5F0EB" />
      </TouchableOpacity>
      <Text style={styles.copy}>{copy}</Text>
      <TouchableOpacity
        style={styles.cta}
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <Text style={styles.ctaLabel}>{ctaLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    backgroundColor: '#0A0A0F',
    borderRadius: 12,
    padding: 14,
    paddingRight: 32,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
  },
  closeBtn: { position: 'absolute', top: 6, right: 6, padding: 6 },
  copy: {
    color: '#F5F0EB',
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
