import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LANDING } from '@/constants/landingTheme';

export default function ManifestoSection() {
  return (
    <View style={styles.wrapper}>
      {/* Dark to White gradient */}
      <LinearGradient
        colors={[LANDING.bg.primary, '#FFFFFF']}
        style={styles.fadeIn}
      />

      {/* White section */}
      <View style={styles.manifesto}>
        <Text style={styles.quote}>"Performing Art Is Not Just a Hobby."</Text>
        <Text style={styles.label}>THE NETSA MANIFESTO</Text>
      </View>

      {/* White to Dark gradient */}
      <LinearGradient
        colors={['#FFFFFF', LANDING.bg.primary]}
        style={styles.fadeOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  fadeIn: {
    height: 120,
  },
  manifesto: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: LANDING.spacing.px,
  },
  quote: {
    fontFamily: LANDING.fonts.sansExtraBold,
    fontSize: 40,
    lineHeight: 40,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 6,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  fadeOut: {
    height: 120,
  },
});
