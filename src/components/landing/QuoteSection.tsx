import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

export default function QuoteSection() {
  return (
    <View style={styles.section}>
      {/* Dark fade at top */}
      <LinearGradient
        colors={[LANDING.bg.primary, 'rgba(255,255,255,0)']}
        style={styles.fadeTop}
      />

      {/* White content area */}
      <View style={styles.white}>
        <Text style={styles.stair1}>"PERFORMING</Text>
        <Text style={styles.stair2}>ART IS</Text>
        <Text style={styles.stair2}>NOT JUST</Text>
        <Text style={styles.stair3}>A HOBBY."</Text>

        {/* Gradient subtext */}
        <MaskedView maskElement={<Text style={styles.manifesto}>The NETSA Manifesto</Text>}>
          <LinearGradient
            colors={['#ef4444', '#ff4d88']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <Text style={[styles.manifesto, { opacity: 0 }]}>The NETSA Manifesto</Text>
          </LinearGradient>
        </MaskedView>
      </View>

      {/* Dark fade at bottom */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', LANDING.bg.primary]}
        style={styles.fadeBot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  fadeTop: {
    height: 120,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  white: {
    paddingTop: 140,
    paddingBottom: 140,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
  },
  stair1: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 40,
    color: '#000',
    marginLeft: 0,
  },
  stair2: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 40,
    color: '#000',
    marginLeft: 32,
  },
  stair3: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 36,
    lineHeight: 40,
    color: '#000',
    marginLeft: 64,
    marginBottom: 28,
  },
  manifesto: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 18,
    lineHeight: 26,
  },
  fadeBot: {
    height: 120,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
});
