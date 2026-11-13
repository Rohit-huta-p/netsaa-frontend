import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

const EVENTS = [
  { type: 'Workshop', title: 'Kathak masterclass', meta: 'Sat 10am · Pune · 12 spots left', colors: ['#ff4d88', '#ff822e'] as const },
  { type: 'Audition', title: 'Open audition — short film', meta: '22 Nov · Mumbai', colors: ['#ef4444', '#ff4d88'] as const },
  { type: 'Open Mic', title: 'Citywide open mic night', meta: 'Every Sunday · Pune · Free', colors: ['#ff822e', '#ff976b'] as const },
  { type: 'Jam', title: 'Sunday jam session', meta: 'Weekly · Pune · Free', colors: ['#ff976b', '#ff4d88'] as const },
  { type: 'Workshop', title: 'Vocal technique workshop', meta: 'Sat · Online', colors: ['#ff4d88', '#c41e3a'] as const },
  { type: 'Masterclass', title: 'Theatre intensive', meta: '5 days · Pune', colors: ['#ff822e', '#ef4444'] as const },
];

export default function EventsScrollSection() {
  return (
    <View style={styles.section}>
      <View style={styles.glow} />

      {/* Heading */}
      <View style={styles.head}>
        <Text style={styles.h2}>Never stop{' '}
          <MaskedView maskElement={<Text style={styles.h2Accent}>growing.</Text>}>
            <LinearGradient
              colors={['#ff4d88', '#ff822e', '#ff976b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.h2Accent, { opacity: 0 }]}>growing.</Text>
            </LinearGradient>
          </MaskedView>
        </Text>
        <Text style={styles.sub}>
          Workshops, masterclasses, auditions, open mics and jams — performing-arts events to discover and show up to.
        </Text>
      </View>

      {/* Horizontal scroll */}
      <FlatList
        data={EVENTS}
        horizontal
        keyExtractor={(_, i) => String(i)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        snapToInterval={292}
        decelerationRate="fast"
        renderItem={({ item }) => <EventCard event={item} />}
      />
    </View>
  );
}

function EventCard({ event }: { event: typeof EVENTS[0] }) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={event.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{event.type}</Text>
        </View>
      </LinearGradient>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardMeta}>{event.meta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 80,
    paddingBottom: 80,
    backgroundColor: LANDING.bg.primary,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 600,
    height: 500,
    borderRadius: 9999,
    backgroundColor: LANDING.gradient.rose,
    opacity: 0.04,
    left: -120,
    top: 0,
  },
  head: {
    paddingHorizontal: LANDING.spacing.px,
    marginBottom: 32,
    zIndex: 2,
  },
  h2: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 46,
    color: LANDING.text.primary,
    marginBottom: 12,
  },
  h2Accent: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 40,
    lineHeight: 46,
  },
  sub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 15,
    lineHeight: 23,
    color: LANDING.text.mid,
    maxWidth: 340,
  },
  scroll: {
    paddingHorizontal: LANDING.spacing.px,
    paddingBottom: 4,
    gap: 16,
  },
  card: {
    width: 272,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(39,39,42,0.3)',
    backgroundColor: 'rgba(17,17,19,0.6)',
  },
  cover: {
    height: 136,
    justifyContent: 'flex-end',
    padding: 14,
  },
  badge: {
    backgroundColor: 'rgba(9,9,11,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: LANDING.fonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#fff',
  },
  cardBody: {
    padding: 18,
  },
  cardTitle: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 18,
    lineHeight: 24,
    color: LANDING.text.primary,
    marginBottom: 6,
  },
  cardMeta: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: LANDING.text.mid,
  },
});
