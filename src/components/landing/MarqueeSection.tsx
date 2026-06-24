import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LANDING } from '@/constants/landingTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ITEMS = ['Dancers', 'Musicians', 'Actors', 'Anchors', 'Comedians', 'DJs', 'Kathak', 'Bharatanatyam', 'Bollywood', 'Classical Vocals'];

function MarqueeItem({ text }: { text: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemText}>{text}</Text>
      <View style={styles.dot} />
    </View>
  );
}

function EqBars({ side }: { side: 'left' | 'right' }) {
  const bars = useRef(
    Array.from({ length: 5 }, () => ({
      anim: new Animated.Value(0),
      min: 6 + Math.random() * 6,
      max: 20 + Math.random() * 16,
      dur: 600 + Math.random() * 500,
      color: [LANDING.gradient.pink, LANDING.gradient.orange, LANDING.gradient.gold][Math.floor(Math.random() * 3)],
    }))
  ).current;

  useEffect(() => {
    bars.forEach(bar => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar.anim, { toValue: 1, duration: bar.dur, useNativeDriver: false }),
          Animated.timing(bar.anim, { toValue: 0, duration: bar.dur, useNativeDriver: false }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={[styles.eqBars, side === 'left' ? { left: 16 } : { right: 16 }]}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.eqBar,
            {
              backgroundColor: bar.color,
              height: bar.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [bar.min, bar.max],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function MarqueeSection() {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH * 3,
        duration: 25000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const allItems = [...ITEMS, ...ITEMS];

  return (
    <View style={styles.section}>
      {/* <EqBars side="left" />
      <EqBars side="right" /> */}

      {/* Left fade */}
      <LinearGradient
        colors={[LANDING.bg.primary, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fadeMask, { left: 0 }]}
        pointerEvents="none"
      />

      {/* Right fade */}
      <LinearGradient
        colors={['transparent', LANDING.bg.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fadeMask, { right: 0 }]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        {allItems.map((item, i) => (
          <MarqueeItem key={i} text={item} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: LANDING.border.default,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: LANDING.bg.primary,
  },
  track: {
    flexDirection: 'row',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  itemText: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 32,
    color: 'rgba(255,255,255,0.06)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LANDING.gradient.pink,
    opacity: 0.35,
  },
  fadeMask: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    zIndex: 2,
  },
  eqBars: {
    position: 'absolute',
    top: '50%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
    zIndex: 3,
    opacity: 0.5,
    transform: [{ translateY: -20 }],
  },
  eqBar: {
    width: 4,
    borderRadius: 2,
  },
});
