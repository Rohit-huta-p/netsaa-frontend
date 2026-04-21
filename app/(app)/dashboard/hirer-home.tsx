// netsa-mobile/app/(app)/dashboard/hirer-home.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import ModeToggle from '../../../src/components/mode/ModeToggle';
import ScreenTooltip from '../../../src/components/mode/ScreenTooltip';

export default function HirerHome() {
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>NETSA</Text>
        </View>

        <ModeToggle />

        <View style={styles.placeholder}>
          <Text style={styles.placeholderHeading}>Hirer mode — Home</Text>
          <Text style={styles.placeholderBody}>
            Sections ship in Plan 3: Hero · NextUp · Posts list · Analytics · Saved artists · Upcoming bookings · Spend · Rehire suggestions · Drafts · Reviews given · Time-to-fill · Messages preview.
          </Text>
        </View>
      </ScrollView>

      <ScreenTooltip
        screenId="home-toggle"
        anchorTop={110}
        anchorRight={80}
        copy="NETSA has two modes. Tap the pill above to switch between Artist and Hirer."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 },
  header: { marginBottom: 24 },
  wordmark: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#F5F0EB',
    letterSpacing: 2,
  },
  placeholder: {
    marginTop: 40,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  placeholderHeading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#F5F0EB',
    marginBottom: 12,
  },
  placeholderBody: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: 'rgba(245, 240, 235, 0.6)',
    lineHeight: 22,
  },
});
